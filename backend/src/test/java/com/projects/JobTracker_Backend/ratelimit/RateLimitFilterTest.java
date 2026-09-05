package com.projects.JobTracker_Backend.ratelimit;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    /** Stand-in for Redis: counts per key in a plain map, same contract. */
    private static class CountingLimiter extends RedisRateLimiter {
        final Map<String, Integer> counts = new HashMap<>();

        CountingLimiter() {
            super(null);
        }

        @Override
        public Decision consume(String key, int limit, Duration window) {
            int count = counts.merge(key, 1, Integer::sum);
            return new Decision(count <= limit, limit, Math.max(0, limit - count), window.toSeconds());
        }
    }

    private CountingLimiter limiter;
    private RateLimitProperties props;
    private RateLimitFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        limiter = new CountingLimiter();
        props = new RateLimitProperties();
        props.setEnabled(true);
        props.setDefaultLimit(3);
        props.setDefaultWindowSeconds(60);
        props.setAuthLimit(2);
        props.setAuthWindowSeconds(300);
        props.setAuthPaths(List.of("/api/auth/login", "/api/auth/register", "/api/auth/refresh"));
        props.setExemptPaths(List.of("/actuator/health", "/api/public/health"));
        filter = new RateLimitFilter(limiter, props);
        chain = mock(FilterChain.class);
    }

    private MockHttpServletRequest request(String method, String uri, String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest(method, uri);
        req.setRequestURI(uri);
        req.addHeader("X-Forwarded-For", ip);
        return req;
    }

    @Test
    void blocksOnceTheDefaultLimitIsExceeded() throws Exception {
        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(request("GET", "/api/jobs/fulltime", "1.2.3.4"), res, chain);
            assertEquals(200, res.getStatus(), "request " + (i + 1) + " should pass");
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/jobs/fulltime", "1.2.3.4"), blocked, chain);

        assertEquals(429, blocked.getStatus());
        assertNotNull(blocked.getHeader("Retry-After"));
        assertTrue(blocked.getContentAsString().contains("Rate limit exceeded"));
        verify(chain, times(3)).doFilter(any(), any());
    }

    @Test
    void countsEachIpSeparately() throws Exception {
        for (int i = 0; i < 3; i++) {
            filter.doFilter(request("GET", "/api/jobs", "1.1.1.1"), new MockHttpServletResponse(), chain);
        }

        MockHttpServletResponse other = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/jobs", "9.9.9.9"), other, chain);

        assertEquals(200, other.getStatus(), "a different IP must have its own budget");
    }

    @Test
    void authPathsGetTheirOwnStricterBudget() throws Exception {
        for (int i = 0; i < 2; i++) {
            filter.doFilter(request("POST", "/api/auth/login", "5.5.5.5"), new MockHttpServletResponse(), chain);
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(request("POST", "/api/auth/login", "5.5.5.5"), blocked, chain);
        assertEquals(429, blocked.getStatus(), "auth tier is 2, the third attempt must be throttled");

        // ...and the browse budget for the same IP is untouched.
        MockHttpServletResponse browse = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/jobs", "5.5.5.5"), browse, chain);
        assertEquals(200, browse.getStatus());
    }

    @Test
    void alwaysReportsTheRemainingBudget() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/jobs", "2.2.2.2"), res, chain);

        assertEquals("3", res.getHeader("X-RateLimit-Limit"));
        assertEquals("2", res.getHeader("X-RateLimit-Remaining"));
        assertNotNull(res.getHeader("X-RateLimit-Reset"));
    }

    @Test
    void neverThrottlesTheKeepAlivePing() throws Exception {
        // The Railway scheduler pings this every 10 minutes; throttling it would
        // let the Render instance spin down.
        for (int i = 0; i < 20; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(request("GET", "/api/public/health", "3.3.3.3"), res, chain);
            assertEquals(200, res.getStatus());
        }
        assertTrue(limiter.counts.isEmpty(), "exempt paths must not even touch Redis");
    }

    @Test
    void ignoresCorsPreflight() throws Exception {
        for (int i = 0; i < 10; i++) {
            filter.doFilter(request("OPTIONS", "/api/jobs/fulltime", "4.4.4.4"), new MockHttpServletResponse(), chain);
        }
        assertTrue(limiter.counts.isEmpty(), "preflight is issued by the browser, not the user");
    }

    @Test
    void doesNothingWhenDisabled() throws Exception {
        props.setEnabled(false);
        for (int i = 0; i < 10; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(request("GET", "/api/jobs", "6.6.6.6"), res, chain);
            assertEquals(200, res.getStatus());
        }
        assertTrue(limiter.counts.isEmpty());
    }

    @Test
    void fallsBackToRemoteAddrWithoutAForwardedHeader() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/jobs");
        req.setRequestURI("/api/jobs");
        req.setRemoteAddr("7.7.7.7");

        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertTrue(limiter.counts.containsKey("ratelimit:default:7.7.7.7"));
    }

    @Test
    void usesTheLeftMostForwardedHopAsTheClient() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/jobs");
        req.setRequestURI("/api/jobs");
        req.addHeader("X-Forwarded-For", "203.0.113.9, 10.0.0.1, 10.0.0.2");

        filter.doFilter(req, new MockHttpServletResponse(), chain);

        assertTrue(limiter.counts.containsKey("ratelimit:default:203.0.113.9"));
    }
}
