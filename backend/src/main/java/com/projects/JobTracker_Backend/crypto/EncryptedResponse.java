package com.projects.JobTracker_Backend.crypto;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method (or a whole controller) whose JSON response body
 * should go out AES-GCM encrypted instead of in the clear.
 *
 * <p>Put it on the handler and nothing else changes — the method keeps its usual
 * return type, and {@link EncryptedResponseAdvice} swaps the serialized body for
 * an {@link EncryptedPayload} on the way out.
 *
 * <pre>
 * &#64;GetMapping("/fulltime")
 * &#64;EncryptedResponse
 * public ResponseEntity&lt;Page&lt;JobDTO&gt;&gt; getFulltimeJobs(...) { ... }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface EncryptedResponse {
}
