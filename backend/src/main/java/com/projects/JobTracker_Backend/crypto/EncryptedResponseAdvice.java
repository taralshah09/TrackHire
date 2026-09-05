package com.projects.JobTracker_Backend.crypto;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Encrypts the body of any handler annotated with {@link EncryptedResponse}.
 *
 * <p>The body is serialized with the application's own Jackson 3
 * {@link ObjectMapper} — the same instance the MVC message converter uses, which
 * on Spring Boot 4 is {@code tools.jackson}, not the legacy {@code com.fasterxml}
 * one that jjwt pulls in — so the JSON inside the envelope is byte-for-byte what
 * the endpoint used to return. Nothing about the DTO shape changes for the client; it only
 * has to unwrap first.
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class EncryptedResponseAdvice implements ResponseBodyAdvice<Object> {

    private final CryptoService cryptoService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (!cryptoService.isEnabled()) {
            return false;
        }
        return returnType.hasMethodAnnotation(EncryptedResponse.class)
                || (returnType.getContainingClass().isAnnotationPresent(EncryptedResponse.class));
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> converterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        // An error body produced by GlobalExceptionHandler must stay readable,
        // otherwise a 500 turns into an undecipherable blob in the console.
        if (body == null || body instanceof EncryptedPayload) {
            return body;
        }

        try {
            String json = objectMapper.writeValueAsString(body);
            response.getHeaders().set("X-Encrypted", "1");
            response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
            return cryptoService.encrypt(json);
        } catch (Exception ex) {
            // Fail closed. Falling back to plaintext here would quietly undo the
            // protection exactly when something is wrong, so surface the error
            // and let GlobalExceptionHandler turn it into a 500.
            log.error("Failed to encrypt response for {}", request.getURI(), ex);
            throw new IllegalStateException("Failed to encrypt response body", ex);
        }
    }
}
