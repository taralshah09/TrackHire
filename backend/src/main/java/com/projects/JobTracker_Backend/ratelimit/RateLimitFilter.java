package com.projects.JobTracker_Backend.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Per-IP rate limiting for every request, with a much stricter tier on the
 * authentication endpoints.
 *
 * <p>Runs before {@code AuthTokenFilter} so that a flood of requests carrying
 * junk tokens is rejected before it costs a JWT parse or a DB lookup.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisRateLimiter limiter;
    private final RateLimitProperties props;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!props.isEnabled()) {
            return true;
        }
        // CORS preflight carries no credentials and is issued by the browser, not the user.
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        return matchesAny(request.getRequestURI(), props.getExemptPaths());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean authTier = matchesAny(path, props.getAuthPaths());

        int limit = authTier ? props.getAuthLimit() : props.getDefaultLimit();
        Duration window = Duration.ofSeconds(
                authTier ? props.getAuthWindowSeconds() : props.getDefaultWindowSeconds());

        String tier = authTier ? "auth" : "default";
        String ip = ClientIpResolver.resolve(request);
        String key = "ratelimit:" + tier + ":" + ip;

        RedisRateLimiter.Decision decision = limiter.consume(key, limit, window);

        response.setHeader("X-RateLimit-Limit", String.valueOf(decision.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.remaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(decision.resetSeconds()));

        if (!decision.allowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(decision.resetSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\","
                            + "\"message\":\"Rate limit exceeded. Try again in "
                            + decision.resetSeconds() + " seconds.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private static boolean matchesAny(String path, Iterable<String> prefixes) {
        for (String prefix : prefixes) {
            if (!prefix.isBlank() && path.startsWith(prefix.trim())) {
                return true;
            }
        }
        return false;
    }
}
