package com.projects.JobTracker_Backend.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Tunables for the Redis-backed rate limiter. Every value is overridable by an
 * environment variable (see application.properties) so limits can be changed on
 * Render without a redeploy of code.
 */
@Component
@ConfigurationProperties(prefix = "app.ratelimit")
@Getter
@Setter
public class RateLimitProperties {

    /** Master switch. */
    private boolean enabled = true;

    /** Requests allowed per window for everything that is not an auth path. */
    private int defaultLimit = 120;

    /** Window length for the default tier. */
    private int defaultWindowSeconds = 60;

    /** Requests allowed per window for login / register / refresh. */
    private int authLimit = 10;

    /** Window length for the auth tier — deliberately long to slow credential stuffing. */
    private int authWindowSeconds = 300;

    /** Paths that fall into the strict auth tier. Matched by prefix. */
    private List<String> authPaths = List.of();

    /** Paths that skip rate limiting entirely (health checks, keep-alive pings). */
    private List<String> exemptPaths = List.of();
}
