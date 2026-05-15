package com.projects.JobTracker_Backend.exception;

public class LlmParseException extends RuntimeException {
    public LlmParseException(String message) {
        super(message);
    }

    public LlmParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
