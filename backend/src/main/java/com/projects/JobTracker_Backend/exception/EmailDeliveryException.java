package com.projects.JobTracker_Backend.exception;

/**
 * The email gateway would not take the message. Surfaces as a 502 so the caller
 * knows the code never went out and can retry, rather than sitting on a signup
 * form waiting for mail that will never arrive.
 *
 * <p>The pending signup record is deliberately left in Redis when this is
 * thrown, so {@code /register/resend} recovers without the user re-entering the
 * form.
 */
public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException(String message) {
        super(message);
    }

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
