package com.projects.JobTracker_Backend.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.projects.JobTracker_Backend.exception.InvalidGoogleTokenException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

/**
 * The entire security boundary of Google sign-in.
 *
 * <p>{@link GoogleIdTokenVerifier} does the signature check against Google's
 * JWKS, including key fetching, caching and rotation, plus {@code exp} and
 * {@code aud}. That is the part you must not hand-roll — a bespoke JJWT check
 * that forgets to pin {@code aud} accepts any Google-issued token from any app.
 *
 * <p>On top of the library's checks, {@code email_verified} is enforced here and
 * it matters more than it looks: accounts are linked <em>by email</em>, so an
 * unverified Google address would let someone claim a {@code users} row they do
 * not own.
 */
@Component
@Slf4j
public class GoogleTokenVerifier {

    private static final List<String> VALID_ISSUERS =
            List.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private final boolean enabled;

    private GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId,
                               @Value("${app.google.enabled:true}") boolean enabled) {
        this.clientId = clientId;
        this.enabled = enabled;
    }

    @PostConstruct
    void init() {
        if (!enabled) {
            log.warn("Google sign-in is DISABLED (app.google.enabled=false).");
            return;
        }
        if (!StringUtils.hasText(clientId)) {
            // Not fatal: the rest of the app must still start. /api/auth/google
            // answers 503 until GOOGLE_CLIENT_ID is set.
            log.warn("GOOGLE_CLIENT_ID is not set — Google sign-in will be unavailable.");
            return;
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
        log.info("Google sign-in enabled.");
    }

    public boolean isAvailable() {
        return verifier != null;
    }

    /**
     * @return the verified claims
     * @throws InvalidGoogleTokenException if any check fails. The reason is
     *         logged, never returned — telling a caller which check failed only
     *         helps someone probing the endpoint.
     */
    public GoogleProfile verify(String idTokenString) {
        if (!isAvailable()) {
            throw new InvalidGoogleTokenException("Google sign-in is not configured on this server");
        }

        GoogleIdToken token;
        try {
            token = verifier.verify(idTokenString);
        } catch (Exception ex) {
            throw new InvalidGoogleTokenException("ID token could not be parsed or verified", ex);
        }

        if (token == null) {
            // Covers a bad signature, an expired token, and — the one that matters
            // most — a token minted for a different client id.
            throw new InvalidGoogleTokenException("ID token failed signature, expiry or audience checks");
        }

        GoogleIdToken.Payload payload = token.getPayload();

        // The library already checks the issuer; asserting it here means a future
        // change to how the verifier is built cannot silently drop the check.
        if (!VALID_ISSUERS.contains(payload.getIssuer())) {
            throw new InvalidGoogleTokenException("Unexpected issuer: " + payload.getIssuer());
        }

        String email = payload.getEmail();
        if (!StringUtils.hasText(email)) {
            throw new InvalidGoogleTokenException("ID token carries no email; accounts are linked by email");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new InvalidGoogleTokenException(
                    "Google has not verified this email; linking on it would let someone claim another user's row");
        }

        return new GoogleProfile(
                payload.getSubject(),
                email,
                asString(payload.get("name")),
                asString(payload.get("picture")));
    }

    private static String asString(Object claim) {
        return claim == null ? null : claim.toString();
    }
}
