package com.projects.JobTracker_Backend.crypto;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * The one place AES-256-GCM lives. Anything that needs to encrypt or decrypt a
 * payload should call this rather than building its own Cipher — that keeps the
 * key handling, nonce generation and envelope format in a single reviewable spot.
 *
 * <p>Usage:
 * <pre>
 *   EncryptedPayload envelope = cryptoService.encrypt(jsonString);
 *   String json = cryptoService.decrypt(envelope);
 * </pre>
 *
 * <p>A fresh 96-bit nonce is generated per call. Never reuse a nonce with the
 * same key under GCM — it breaks the cipher outright — which is why there is no
 * API here that lets a caller pass one in.
 */
@Service
@Slf4j
public class CryptoService {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_NONCE_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int KEY_BYTES = 32;

    private final boolean enabled;
    private final String configuredKey;
    private final SecureRandom random = new SecureRandom();

    private SecretKey key;

    public CryptoService(@Value("${app.crypto.enabled:true}") boolean enabled,
                         @Value("${app.crypto.key:}") String configuredKey) {
        this.enabled = enabled;
        this.configuredKey = configuredKey;
    }

    @PostConstruct
    void init() {
        if (!enabled) {
            log.warn("Response encryption is DISABLED (app.crypto.enabled=false). "
                    + "Job endpoints will return plaintext JSON.");
            return;
        }

        if (configuredKey == null || configuredKey.isBlank()) {
            throw new IllegalStateException(
                    "RESPONSE_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` "
                            + "and set it on both the backend (RESPONSE_ENCRYPTION_KEY) and the frontend "
                            + "(VITE_RESPONSE_ENCRYPTION_KEY), or set RESPONSE_ENCRYPTION_ENABLED=false.");
        }

        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(configuredKey.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("RESPONSE_ENCRYPTION_KEY is not valid base64.", ex);
        }

        if (raw.length != KEY_BYTES) {
            throw new IllegalStateException(
                    "RESPONSE_ENCRYPTION_KEY must decode to exactly " + KEY_BYTES + " bytes (AES-256), got "
                            + raw.length + ". Generate one with `openssl rand -base64 32`.");
        }

        this.key = new SecretKeySpec(raw, "AES");
        log.info("Response encryption enabled (AES-256-GCM).");
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Encrypts UTF-8 text into a self-describing envelope. */
    public EncryptedPayload encrypt(String plaintext) {
        requireEnabled();
        try {
            byte[] nonce = new byte[GCM_NONCE_BYTES];
            random.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            Base64.Encoder encoder = Base64.getEncoder();
            return EncryptedPayload.of(encoder.encodeToString(nonce), encoder.encodeToString(ciphertext));
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to encrypt response payload", ex);
        }
    }

    /** Reverses {@link #encrypt}; throws if the payload was tampered with. */
    public String decrypt(EncryptedPayload payload) {
        requireEnabled();
        return decrypt(payload.iv(), payload.data());
    }

    /** Same as {@link #decrypt(EncryptedPayload)} for callers holding the raw base64 parts. */
    public String decrypt(String base64Iv, String base64Data) {
        requireEnabled();
        try {
            Base64.Decoder decoder = Base64.getDecoder();
            byte[] nonce = decoder.decode(base64Iv);
            byte[] ciphertext = decoder.decode(base64Data);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to decrypt payload", ex);
        }
    }

    private void requireEnabled() {
        if (!enabled || key == null) {
            throw new IllegalStateException("Response encryption is disabled; no key is loaded.");
        }
    }
}
