package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.AuthResponseDTO;
import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.enums.Role;
import com.projects.JobTracker_Backend.exception.ApiException;
import com.projects.JobTracker_Backend.model.OAuthAccount;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.OAuthAccountRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.security.GoogleProfile;
import com.projects.JobTracker_Backend.security.GoogleTokenVerifier;
import com.projects.JobTracker_Backend.util.EmailNormalizer;
import com.projects.JobTracker_Backend.util.UsernameRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Resolves a verified Google identity to an account, creating one only when
 * there is genuinely nobody to sign in as.
 *
 * <pre>
 * 1. oauth_accounts has this sub          -> sign in as that user      [returning Google user]
 * 2. a users row has this email           -> link, then sign in        [no duplicate account]
 * 3. neither                              -> ask for a username first  [no row written yet]
 * </pre>
 *
 * <p>Step 2 is the rule that stops a second account appearing for someone who
 * already signed up with a password. Note what it deliberately does <em>not</em>
 * do: it does not null the password and it does not flip
 * {@code User.authProvider}. After linking, that person can sign in either way —
 * which is what people expect, and the only thing that keeps the step
 * idempotent. The presence of the {@code oauth_accounts} row, not the
 * {@code authProvider} column, is the source of truth for "can sign in with
 * Google".
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private static final String PENDING_KEY = "google:signup:";
    private static final int TOKEN_BYTES = 32;

    private final GoogleTokenVerifier tokenVerifier;
    private final UserRepository userRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final AuthTokenIssuer authTokenIssuer;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.google.pending-signup-ttl-seconds:900}")
    private int pendingTtlSeconds;

    /** A Google identity that has been verified but has no account yet. */
    public record PendingGoogleSignup(String sub, String email, String name, String picture) {
    }

    // ------------------------------------------------------------------
    // POST /api/auth/google
    // ------------------------------------------------------------------

    /**
     * @return an {@link AuthResponseDTO} when there is an account to sign in to,
     *         or a {@code USERNAME_REQUIRED} map when the person is brand new.
     */
    @Transactional
    public Object signIn(String credential) {
        if (!tokenVerifier.isAvailable()) {
            // Missing GOOGLE_CLIENT_ID is a server misconfiguration, not a bad
            // token, and a 401 here would send people hunting for the wrong thing.
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google sign-in is not available right now.");
        }
        GoogleProfile profile = tokenVerifier.verify(credential);
        String email = EmailNormalizer.normalize(profile.email());

        // 1. Returning Google user, matched on the stable subject id rather than
        //    the address, so a changed Gmail still lands on the same account.
        Optional<OAuthAccount> linked =
                oauthAccountRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, profile.sub());
        if (linked.isPresent()) {
            return signInExisting(linked.get().getUser());
        }

        // 2. Someone who already signed up with a password. Link, do not duplicate.
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            requireUsable(user);
            try {
                link(user, profile);
            } catch (DataIntegrityViolationException ex) {
                // Two tabs signing in at once. Whoever lost the race just reads the
                // row the winner wrote.
                log.info("Concurrent Google link for user {}; re-reading the linked account", user.getId());
                OAuthAccount existing = oauthAccountRepository
                        .findByProviderAndProviderUserId(AuthProvider.GOOGLE, profile.sub())
                        .orElseThrow(() -> ex);
                return signInExisting(existing.getUser());
            }
            return authTokenIssuer.issue(user);
        }

        // 3. Nobody to sign in as. Park the verified identity and ask for a
        //    username — no users row is written at this point.
        return pendingSignupResponse(profile, email);
    }

    // ------------------------------------------------------------------
    // POST /api/auth/google/complete
    // ------------------------------------------------------------------

    @Transactional
    public AuthResponseDTO complete(String signupToken, String rawUsername) {
        // Loaded and deleted together: single use, and deleted BEFORE anything is
        // created so a retry cannot double-create the account.
        PendingGoogleSignup pending = consumePending(signupToken);
        if (pending == null) {
            throw ApiException.badRequest("Sign-in session expired. Please try again.");
        }

        String username = rawUsername == null ? null : rawUsername.trim();
        String problem = UsernameRules.validate(username);
        if (problem != null) {
            // The token was just consumed, so hand back a fresh one — otherwise a
            // single typo would force a full round-trip through Google again.
            throw usernameRejected(HttpStatus.BAD_REQUEST, problem, null, pending);
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw usernameRejected(HttpStatus.CONFLICT, "That username is taken.", "USERNAME_TAKEN", pending);
        }

        String email = EmailNormalizer.normalize(pending.email());

        // A local account with this address may have been created during the
        // fifteen-minute window. If so, link to it rather than creating a second one.
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            requireUsable(user);
            link(user, new GoogleProfile(pending.sub(), email, pending.name(), pending.picture()));
            return authTokenIssuer.issue(user);
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(null);           // no password credential; see CustomUserDetailsService
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setRole(Role.USER);
        user.setAccountEnabled(true);
        user.setEmailVerified(true);

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw usernameRejected(HttpStatus.CONFLICT, "That username is taken.", "USERNAME_TAKEN", pending);
        }

        link(user, new GoogleProfile(pending.sub(), email, pending.name(), pending.picture()));
        return authTokenIssuer.issue(user);
    }

    // ------------------------------------------------------------------
    // GET /api/auth/username-available
    // ------------------------------------------------------------------

    public Map<String, Object> usernameAvailability(String username) {
        String candidate = username == null ? null : username.trim();
        String problem = UsernameRules.validate(candidate);

        Map<String, Object> body = new LinkedHashMap<>();
        if (problem != null) {
            body.put("available", false);
            body.put("reason", problem);
            return body;
        }
        body.put("available", !userRepository.existsByUsernameIgnoreCase(candidate));
        return body;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private AuthResponseDTO signInExisting(User user) {
        requireUsable(user);
        return authTokenIssuer.issue(user);
    }

    /** A disabled or locked account must not be signed into, however it authenticates. */
    private void requireUsable(User user) {
        if (Boolean.FALSE.equals(user.getAccountEnabled()) || Boolean.TRUE.equals(user.getAccountLocked())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account has been disabled.");
        }
    }

    /**
     * Records that this user can sign in with Google, and marks the address
     * verified — Google just proved it. The password and {@code authProvider}
     * are left exactly as they were.
     */
    private void link(User user, GoogleProfile profile) {
        if (oauthAccountRepository.existsByUserIdAndProvider(user.getId(), AuthProvider.GOOGLE)) {
            user.setEmailVerified(true);
            return;
        }
        OAuthAccount account = new OAuthAccount();
        account.setUser(user);
        account.setProvider(AuthProvider.GOOGLE);
        account.setProviderUserId(profile.sub());
        account.setLinkedAt(LocalDateTime.now());
        oauthAccountRepository.saveAndFlush(account);

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    private Map<String, Object> pendingSignupResponse(GoogleProfile profile, String email) {
        byte[] raw = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        storePending(token, new PendingGoogleSignup(profile.sub(), email, profile.name(), profile.pictureUrl()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "USERNAME_REQUIRED");
        body.put("signupToken", token);
        body.put("email", email);
        body.put("suggestedUsername", suggestUsername(email));
        return body;
    }

    /** A suggestion only — the sanitized local part, numbered until it is free. */
    private String suggestUsername(String email) {
        String base = UsernameRules.suggestFromEmail(email);
        if (UsernameRules.validate(base) == null && !userRepository.existsByUsernameIgnoreCase(base)) {
            return base;
        }
        for (int i = 1; i <= 20; i++) {
            String candidate = base + i;
            if (UsernameRules.validate(candidate) == null
                    && !userRepository.existsByUsernameIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return base + secureRandom.nextInt(1000, 10000);
    }

    /**
     * Rejecting a username costs the caller their pending token, so every
     * rejection carries a replacement. Without it, one typo means signing in
     * with Google all over again.
     */
    private ApiException usernameRejected(HttpStatus status, String message, String code,
                                          PendingGoogleSignup pending) {
        byte[] raw = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        storePending(token, pending);
        return new ApiException(status, message, code, Map.of("signupToken", token));
    }

    private void storePending(String token, PendingGoogleSignup pending) {
        String json = objectMapper.writeValueAsString(pending);
        redis(() -> {
            redis.opsForValue().set(PENDING_KEY + token, json, Duration.ofSeconds(pendingTtlSeconds));
            return null;
        });
    }

    private PendingGoogleSignup consumePending(String token) {
        String json = redis(() -> redis.opsForValue().getAndDelete(PENDING_KEY + token));
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, PendingGoogleSignup.class);
        } catch (Exception ex) {
            log.warn("Discarding an unreadable pending Google signup record", ex);
            return null;
        }
    }

    /** Like the OTP flow, this path fails closed rather than half-creating an account. */
    private <T> T redis(Supplier<T> op) {
        try {
            return op.get();
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Redis is unavailable during Google sign-in", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Sign-in is temporarily unavailable. Please try again shortly.");
        }
    }
}
