package com.projects.JobTracker_Backend.util;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * One definition of what a username may be, shared by password signup and the
 * Google "choose a username" screen. Two copies of these rules would drift, and
 * the drift would only show up as a name that one path accepts and the other
 * rejects.
 */
public final class UsernameRules {

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 50;

    /**
     * Letters, digits and underscore at both ends; dots allowed only in the
     * middle. Length is checked separately so the message can say which bound
     * was missed.
     */
    private static final Pattern SHAPE = Pattern.compile("^[a-zA-Z0-9_][a-zA-Z0-9_.]{1,48}[a-zA-Z0-9_]$");

    /** Names that would read as the platform speaking rather than a person. */
    private static final Set<String> RESERVED = Set.of(
            "admin", "administrator", "api", "root", "support", "help", "trackhire",
            "system", "security", "moderator", "mod", "staff", "team", "official",
            "no-reply", "noreply", "billing", "abuse", "postmaster", "webmaster",
            "login", "register", "signup", "auth", "oauth", "google", "me", "null", "undefined"
    );

    private UsernameRules() {
    }

    /** @return null when the username is acceptable, otherwise the reason to show the user. */
    public static String validate(String username) {
        if (username == null || username.isBlank()) {
            return "Username is required.";
        }
        String trimmed = username.trim();
        if (trimmed.length() < MIN_LENGTH || trimmed.length() > MAX_LENGTH) {
            return "Username must be between " + MIN_LENGTH + " and " + MAX_LENGTH + " characters.";
        }
        if (!SHAPE.matcher(trimmed).matches()) {
            return "Use letters, numbers, underscores and dots only, starting and ending with a letter, number or underscore.";
        }
        if (RESERVED.contains(trimmed.toLowerCase(Locale.ROOT))) {
            return "That username is reserved.";
        }
        return null;
    }

    /**
     * Turns an email local-part into something that satisfies {@link #validate}.
     * Only ever a suggestion — the user is free to ignore it.
     */
    public static String suggestFromEmail(String email) {
        String local = email == null ? "" : email.split("@")[0];
        String cleaned = local.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_.]", "");
        cleaned = cleaned.replaceAll("^[^a-z0-9_]+", "").replaceAll("[^a-z0-9_]+$", "");
        if (cleaned.length() < MIN_LENGTH) {
            cleaned = (cleaned + "user").substring(0, MIN_LENGTH);
        }
        if (cleaned.length() > MAX_LENGTH) {
            cleaned = cleaned.substring(0, MAX_LENGTH);
        }
        return cleaned;
    }
}
