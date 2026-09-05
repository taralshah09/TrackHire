package com.projects.JobTracker_Backend.crypto;

import com.projects.JobTracker_Backend.exception.EncryptedRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdvice;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;

/**
 * Decrypts the body of any handler annotated with {@link DecryptedRequest}.
 *
 * <p>Runs as a {@code RequestBodyAdvice}, i.e. before argument binding, so the
 * handler's {@code @RequestBody} DTO and its {@code @Valid} constraints see the
 * plaintext payload and validation messages stay meaningful.
 *
 * <p>A body that is not an envelope passes straight through. That is what makes
 * this safe to deploy before the frontend starts encrypting, and what keeps
 * {@code app.crypto.enabled=false} working end to end. Flip
 * {@link DecryptedRequest#required()} to true once the new SPA is live.
 *
 * <p>The {@link ObjectMapper} injected here is Jackson 3
 * ({@code tools.jackson}) — the same instance the MVC converter uses on Spring
 * Boot 4. Injecting the legacy {@code com.fasterxml} one would pick up the stray
 * copy jjwt drags in and quietly disagree with the converter.
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class DecryptedRequestAdvice implements RequestBodyAdvice {

    /**
     * Ceiling on an inbound body before we will even look at it. These endpoints
     * are unauthenticated, and an unbounded {@code readAllBytes} on one of them
     * is a cheap way to make the server hold arbitrary memory.
     */
    private static final int MAX_BODY_BYTES = 64 * 1024;

    private final CryptoService cryptoService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter methodParameter,
                            Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        if (!cryptoService.isEnabled()) {
            return false;
        }
        return methodParameter.getMethodAnnotation(DecryptedRequest.class) != null
                || methodParameter.getContainingClass().isAnnotationPresent(DecryptedRequest.class);
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage inputMessage,
                                           MethodParameter parameter,
                                           Type targetType,
                                           Class<? extends HttpMessageConverter<?>> converterType) throws IOException {

        byte[] raw = readAtMost(inputMessage);
        if (raw.length == 0) {
            return replaceBody(inputMessage, raw);
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(raw);
        } catch (Exception ex) {
            // Not JSON at all. Hand it back untouched and let the message
            // converter produce its usual "malformed body" failure.
            return replaceBody(inputMessage, raw);
        }

        boolean isEnvelope = root != null
                && root.isObject()
                && root.path("encrypted").asBoolean(false)
                && root.hasNonNull("iv")
                && root.hasNonNull("data");

        if (!isEnvelope) {
            if (required(parameter)) {
                throw new EncryptedRequestException("This endpoint requires an encrypted request body.");
            }
            return replaceBody(inputMessage, raw);
        }

        String plaintext;
        try {
            plaintext = cryptoService.decrypt(root.get("iv").asString(), root.get("data").asString());
        } catch (Exception ex) {
            // Deliberately vague to the caller — the detail goes to the log, not
            // over the wire, so a tampering probe learns nothing from the reply.
            log.warn("Rejected an undecryptable request body on {}", parameter.getExecutable().getName());
            throw new EncryptedRequestException("Request payload could not be read.", ex);
        }

        return replaceBody(inputMessage, plaintext.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Object afterBodyRead(Object body,
                                HttpInputMessage inputMessage,
                                MethodParameter parameter,
                                Type targetType,
                                Class<? extends HttpMessageConverter<?>> converterType) {
        return body;
    }

    @Override
    public Object handleEmptyBody(Object body,
                                  HttpInputMessage inputMessage,
                                  MethodParameter parameter,
                                  Type targetType,
                                  Class<? extends HttpMessageConverter<?>> converterType) {
        return body;
    }

    private boolean required(MethodParameter parameter) {
        DecryptedRequest onMethod = parameter.getMethodAnnotation(DecryptedRequest.class);
        if (onMethod != null) {
            return onMethod.required();
        }
        DecryptedRequest onClass = parameter.getContainingClass().getAnnotation(DecryptedRequest.class);
        return onClass != null && onClass.required();
    }

    /** Reads the body, refusing anything over {@link #MAX_BODY_BYTES}. */
    private byte[] readAtMost(HttpInputMessage message) throws IOException {
        try (InputStream in = message.getBody()) {
            byte[] bytes = in.readNBytes(MAX_BODY_BYTES + 1);
            if (bytes.length > MAX_BODY_BYTES) {
                throw new EncryptedRequestException("Request body is too large.");
            }
            return bytes;
        }
    }

    private static HttpInputMessage replaceBody(HttpInputMessage original, byte[] body) {
        return new BufferedInputMessage(original.getHeaders(), body);
    }

    /**
     * The original headers with a new body. Spring ships
     * {@code MappingJacksonInputMessage} for this, but naming a Jackson class in
     * a crypto path that has nothing to do with Jackson is more confusing than
     * the ten lines it saves.
     */
    private record BufferedInputMessage(HttpHeaders headers, byte[] body) implements HttpInputMessage {

        @Override
        public InputStream getBody() {
            return new ByteArrayInputStream(body);
        }

        @Override
        public HttpHeaders getHeaders() {
            return headers;
        }
    }
}
