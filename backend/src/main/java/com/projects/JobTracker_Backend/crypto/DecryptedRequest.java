package com.projects.JobTracker_Backend.crypto;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method (or a whole controller) whose request body may
 * arrive AES-GCM encrypted, in the same envelope {@link EncryptedPayload}
 * describes.
 *
 * <p>This is the mirror image of {@link EncryptedResponse}:
 * {@link DecryptedRequestAdvice} unwraps the envelope before argument binding,
 * so the handler keeps its usual {@code @RequestBody} DTO and {@code @Valid}
 * still fires against the decrypted payload.
 *
 * <p>Note on the threat model, stated plainly: the key ships inside the JS
 * bundle, so anyone with devtools can read it and forge an envelope. This raises
 * the cost of scripted signup and credential-stuffing loops; it is not a
 * replacement for TLS, the rate limiter, the OTP, or bcrypt.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface DecryptedRequest {

    /** When true, a plaintext body is rejected with 400 instead of being accepted. */
    boolean required() default false;
}
