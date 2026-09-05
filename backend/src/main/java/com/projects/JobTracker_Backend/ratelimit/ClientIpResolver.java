package com.projects.JobTracker_Backend.ratelimit;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Works out the caller's IP behind Render's proxy.
 *
 * <p>Render terminates TLS and forwards with {@code X-Forwarded-For}, so
 * {@code getRemoteAddr()} on its own would bucket every user of the app into a
 * single counter. The left-most entry of X-Forwarded-For is the original
 * client. That header is client-spoofable in general, but Render overwrites
 * rather than appends for direct traffic, and the fallback below keeps things
 * sane if the header is absent.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {
    }

    public static String resolve(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String remote = request.getRemoteAddr();
        return remote != null ? remote : "unknown";
    }
}
