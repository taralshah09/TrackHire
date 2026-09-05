package com.projects.JobTracker_Backend.exception;

/**
 * Thrown when an inbound body claims to be an encrypted envelope but cannot be
 * unwrapped — tampered ciphertext, the wrong key, bad base64 — or when an
 * endpoint requires encryption and the body arrived in the clear.
 *
 * <p>It exists so {@code GlobalExceptionHandler} can answer 400 with a fixed
 * message. Without it the catch-all {@code RuntimeException} handler would
 * return 500 and echo CryptoService's internal wording back to the caller.
 */
public class EncryptedRequestException extends RuntimeException {

    public EncryptedRequestException(String message) {
        super(message);
    }

    public EncryptedRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
