package com.projects.JobTracker_Backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

/**
 * Rejects requests to the job-data endpoints that do not look like they came
 * from the app's own frontend running in a real browser.
 *
 * <p>Two checks, both cheap:
 * <ol>
 *   <li>the User-Agent must be present and must not contain a known HTTP-client
 *       token ({@code curl}, {@code python-requests}, {@code scrapy}, …);</li>
 *   <li>the request must carry an Origin or Referer belonging to a configured
 *       frontend URL — the browser sets both and a page cannot forge them.</li>
 * </ol>
 *
 * <p>Both signals are spoofable by anyone who bothers to set headers, so treat
 * this as a filter for lazy scrapers rather than a security boundary. The rate
 * limiter and the page-size cap are what actually bound the damage.
 */
@Component
@RequiredArgsConstructor
public class BrowserGuardFilter extends OncePerRequestFilter {

    private final BrowserGuardProperties props;

    @Value("#{'${frontend.urls}'.split(',')}")
    private List<String> frontendUrls;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!props.isEnabled()) {
            return true;
        }
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (startsWithAny(path, props.getExemptPaths())) {
            return true;
        }
        return !startsWithAny(path, props.getProtectedPrefixes());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null || userAgent.isBlank() || isScriptedAgent(userAgent)) {
            reject(response);
            return;
        }

        if (!hasTrustedOrigin(request)) {
            reject(response);
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isScriptedAgent(String userAgent) {
        String ua = userAgent.toLowerCase(Locale.ROOT);
        return props.getBlockedAgentTokens().stream()
                .map(token -> token.trim().toLowerCase(Locale.ROOT))
                .filter(token -> !token.isEmpty())
                .anyMatch(ua::contains);
    }

    /**
     * A cross-origin browser fetch always carries Origin; same-origin navigations
     * may only carry Referer, so either one matching is enough.
     */
    private boolean hasTrustedOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return frontendUrls.stream()
                    .map(String::trim)
                    .anyMatch(url -> url.equalsIgnoreCase(origin.trim()));
        }

        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            return frontendUrls.stream()
                    .map(String::trim)
                    .anyMatch(url -> referer.toLowerCase(Locale.ROOT)
                            .startsWith(url.toLowerCase(Locale.ROOT)));
        }

        return false;
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"status\":403,\"error\":\"Forbidden\","
                        + "\"message\":\"This endpoint is only available to the TrackHire web app.\"}");
    }

    private static boolean startsWithAny(String path, List<String> prefixes) {
        return prefixes.stream()
                .map(String::trim)
                .filter(prefix -> !prefix.isEmpty())
                .anyMatch(path::startsWith);
    }
}
