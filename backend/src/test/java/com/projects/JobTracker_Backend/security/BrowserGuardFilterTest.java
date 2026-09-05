package com.projects.JobTracker_Backend.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BrowserGuardFilterTest {

    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private static final String APP_ORIGIN = "https://trackhire.vercel.app";

    private BrowserGuardFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        BrowserGuardProperties props = new BrowserGuardProperties();
        props.setEnabled(true);
        props.setProtectedPrefixes(List.of("/api/jobs", "/api/companies", "/api/user", "/api/users", "/api/preferences"));
        props.setExemptPaths(List.of("/actuator/health", "/api/public/health"));
        props.setBlockedAgentTokens(List.of("curl", "python-requests", "scrapy", "go-http-client", "okhttp", "postmanruntime", "headlesschrome"));

        filter = new BrowserGuardFilter(props);
        ReflectionTestUtils.setField(filter, "frontendUrls", List.of(APP_ORIGIN, "http://localhost:5173"));
        chain = mock(FilterChain.class);
    }

    private MockHttpServletRequest request(String uri) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", uri);
        req.setRequestURI(uri);
        return req;
    }

    private int run(MockHttpServletRequest req) throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, chain);
        return res.getStatus();
    }

    @Test
    void allowsTheAppsOwnBrowserTraffic() throws Exception {
        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("User-Agent", CHROME);
        req.addHeader("Origin", APP_ORIGIN);

        assertEquals(200, run(req));
        verify(chain).doFilter(any(), any());
    }

    @Test
    void allowsASameOriginNavigationCarryingOnlyReferer() throws Exception {
        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("User-Agent", CHROME);
        req.addHeader("Referer", APP_ORIGIN + "/jobs?page=2");

        assertEquals(200, run(req));
    }

    @Test
    void blocksKnownScriptingClients() throws Exception {
        for (String ua : List.of("curl/8.4.0", "python-requests/2.31.0", "Scrapy/2.11", "okhttp/4.12", "PostmanRuntime/7.36")) {
            MockHttpServletRequest req = request("/api/jobs/fulltime");
            req.addHeader("User-Agent", ua);
            req.addHeader("Origin", APP_ORIGIN);

            assertEquals(403, run(req), ua + " should be rejected");
        }
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void blocksAMissingUserAgent() throws Exception {
        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("Origin", APP_ORIGIN);

        assertEquals(403, run(req));
    }

    @Test
    void blocksABrowserUserAgentWithNoOriginOrReferer() throws Exception {
        // i.e. a scraper that copied the UA string but not the rest of the request.
        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("User-Agent", CHROME);

        assertEquals(403, run(req));
    }

    @Test
    void blocksAnOriginThatIsNotTheApp() throws Exception {
        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("User-Agent", CHROME);
        req.addHeader("Origin", "https://evil.example");

        assertEquals(403, run(req));
    }

    @Test
    void leavesAuthAndPublicEndpointsAlone() throws Exception {
        // Login and the landing page must work before the SPA has any state,
        // and the scheduler pings /api/public/health with a Node user agent.
        for (String path : List.of("/api/auth/login", "/api/public/stats", "/api/public/jobs/featured", "/api/public/health")) {
            MockHttpServletRequest req = request(path);
            req.addHeader("User-Agent", "axios/1.6.0");

            assertEquals(200, run(req), path + " must not be guarded");
        }
    }

    @Test
    void doesNothingWhenDisabled() throws Exception {
        BrowserGuardProperties off = new BrowserGuardProperties();
        off.setEnabled(false);
        off.setProtectedPrefixes(List.of("/api/jobs"));
        off.setBlockedAgentTokens(List.of("curl"));
        BrowserGuardFilter disabled = new BrowserGuardFilter(off);
        ReflectionTestUtils.setField(disabled, "frontendUrls", List.of(APP_ORIGIN));

        MockHttpServletRequest req = request("/api/jobs/fulltime");
        req.addHeader("User-Agent", "curl/8.4.0");
        MockHttpServletResponse res = new MockHttpServletResponse();
        disabled.doFilter(req, res, chain);

        assertEquals(200, res.getStatus());
    }

    @Test
    void letsPreflightThrough() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("OPTIONS", "/api/jobs/fulltime");
        req.setRequestURI("/api/jobs/fulltime");

        assertEquals(200, run(req));
    }
}
