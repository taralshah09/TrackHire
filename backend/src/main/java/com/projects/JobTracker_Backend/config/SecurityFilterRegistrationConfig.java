package com.projects.JobTracker_Backend.config;

import com.projects.JobTracker_Backend.ratelimit.RateLimitFilter;
import com.projects.JobTracker_Backend.security.BrowserGuardFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Boot auto-registers every {@code Filter} bean in the servlet container.
 * Both of these are already wired into the Spring Security chain, so without
 * this they would run twice per request — which would double-count every
 * request against its rate-limit bucket and halve the effective limit.
 */
@Configuration
public class SecurityFilterRegistrationConfig {

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public FilterRegistrationBean<BrowserGuardFilter> browserGuardFilterRegistration(BrowserGuardFilter filter) {
        FilterRegistrationBean<BrowserGuardFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
