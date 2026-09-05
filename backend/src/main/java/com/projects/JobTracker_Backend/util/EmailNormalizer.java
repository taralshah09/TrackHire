package com.projects.JobTracker_Backend.util;

import java.util.Locale;

/**
 * The single place an email address is normalized before it is stored or looked
 * up: trim, lowercase, nothing else.
 *
 * <p>Gmail dots and {@code +tags} are deliberately NOT canonicalized.
 * {@code a.b@gmail.com} and {@code ab@gmail.com} land in the same inbox at
 * Google but are different identities everywhere else, and collapsing them here
 * would silently merge two people's accounts. That is a decision, not an
 * oversight.
 */
public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    /** {@code taral@gmail.com} becomes {@code t***@gmail.com} for echoing back to the client. */
    public static String mask(String email) {
        if (email == null || !email.contains("@")) {
            return "your email";
        }
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String visible = local.isEmpty() ? "" : local.substring(0, 1);
        return visible + "***@" + parts[1];
    }
}
