package com.projects.JobTracker_Backend.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Tunables for {@link BrowserGuardFilter}. Set {@code BROWSER_GUARD_ENABLED=false}
 * to turn the whole thing off when you need to hit the API with curl or Postman.
 */
@Component
@ConfigurationProperties(prefix = "app.browser-guard")
@Getter
@Setter
public class BrowserGuardProperties {

    private boolean enabled = true;

    /** Only these path prefixes are guarded — auth and public endpoints stay reachable. */
    private List<String> protectedPrefixes = List.of();

    /** Paths that always pass, e.g. the keep-alive ping from the scheduler. */
    private List<String> exemptPaths = List.of();

    /** Lower-cased substrings that mark a User-Agent as a scripted client. */
    private List<String> blockedAgentTokens = List.of();
}
