package com.projects.JobTracker_Backend.exception;

/**
 * The Google ID token failed verification: bad signature, expired, minted for a
 * different {@code aud}, missing an email, or an email Google has not itself
 * verified.
 *
 * <p>Every one of those becomes the same 401 with the same message. The reason
 * goes to the log; telling the caller which check failed only helps someone
 * probing the endpoint.
 */
public class InvalidGoogleTokenException extends RuntimeException {

    public InvalidGoogleTokenException(String message) {
        super(message);
    }

    public InvalidGoogleTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
