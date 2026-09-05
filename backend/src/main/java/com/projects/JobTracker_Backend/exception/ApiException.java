package com.projects.JobTracker_Backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * A failure the caller is meant to read: a status, a message written for a
 * person, and an optional machine-readable {@code code} the SPA can branch on
 * (for example {@code USE_GOOGLE}, which tells the register form to show the
 * Google button instead of a generic error).
 *
 * <p>Throwing this keeps the auth services free of {@code ResponseEntity}
 * plumbing while still giving every path one predictable body shape.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    /**
     * Extra fields merged into the response body. Used where a rejection has to
     * hand something back — a replacement {@code signupToken} on a taken
     * username, for instance, so one typo does not cost a full re-auth.
     */
    private final Map<String, Object> details;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null, Map.of());
    }

    public ApiException(HttpStatus status, String message, String code) {
        this(status, message, code, Map.of());
    }

    public ApiException(HttpStatus status, String message, String code, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details == null ? Map.of() : details;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException conflict(String message, String code) {
        return new ApiException(HttpStatus.CONFLICT, message, code);
    }
}
