package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.AuthResponseDTO;
import com.projects.JobTracker_Backend.dto.RegisterStartDTO;
import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.enums.Role;
import com.projects.JobTracker_Backend.exception.ApiException;
import com.projects.JobTracker_Backend.exception.EmailDeliveryException;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.util.EmailNormalizer;
import com.projects.JobTracker_Backend.util.UsernameRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import tools.jackson.databind.ObjectMapper;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Email/password signup, with the account row created only after the code has
 * been checked.
 *
 * <p>The whole point is that nothing lands in {@code users} until someone has
 * proven they can read the inbox, so a bot that never opens mail leaves no
 * trace. Everything in flight — the bcrypt'd password, the bcrypt'd code, the
 * attempt counters — lives in Redis under a ten-minute TTL and evaporates on its
 * own if the flow is abandoned.
 *
 * <p><b>This path fails closed.</b> Unlike the rate limiter, a Redis outage here
 * returns 503 rather than letting the request through: failing open would mean
 * unverified account creation, which is exactly what this exists to prevent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpSignupService {

    private static final String PENDING_KEY = "signup:pending:";
    private static final String COOLDOWN_KEY = "signup:cooldown:";
    private static final String EMAIL_COUNT_KEY = "signup:email:";
    private static final String IP_COUNT_KEY = "signup:ip:";

    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_RESENDS = 3;
    private static final int MAX_SENDS_PER_EMAIL_PER_DAY = 5;
    private static final int MAX_STARTS_PER_IP_PER_DAY = 20;

    private static final Duration COOLDOWN = Duration.ofSeconds(60);
    private static final Duration DAY = Duration.ofDays(1);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailGatewayClient emailGatewayClient;
    private final AuthTokenIssuer authTokenIssuer;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email.otp-ttl-seconds:600}")
    private int otpTtlSeconds;

    /**
     * The pending signup, as it sits in Redis.
     *
     * <p>Both secrets are stored bcrypt'd, never in the clear: a six-digit code
     * has only a million possibilities, so a plain hash would fall to an offline
     * brute force in milliseconds if Redis ever leaked. BCrypt's ~50 ms is
     * irrelevant for one verify call and decisive for an attacker.
     */
    public record PendingSignup(String username,
                                String email,
                                String phoneNumber,
                                String passwordHash,
                                String otpHash,
                                int attempts,
                                int resends,
                                long createdAt) {
    }

    // ------------------------------------------------------------------
    // /register/start
    // ------------------------------------------------------------------

    public Map<String, Object> start(RegisterStartDTO dto, String clientIp) {
        String email = EmailNormalizer.normalize(dto.getEmail());
        String username = dto.getUsername() == null ? null : dto.getUsername().trim();

        String usernameProblem = UsernameRules.validate(username);
        if (usernameProblem != null) {
            throw ApiException.badRequest(usernameProblem);
        }

        // Everything below runs before a single byte is stored or a mail is sent.
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw ApiException.badRequest("Username is already taken");
        }

        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            if (!StringUtils.hasText(existing.getPassword())) {
                // A Google-only account. Saying so lets the form offer the Google
                // button instead of an error the person cannot act on.
                throw ApiException.conflict(
                        "This email is already registered with Google. Continue with Google to sign in.",
                        "USE_GOOGLE");
            }
            throw ApiException.badRequest("Email is already registered");
        });

        if (StringUtils.hasText(dto.getPhoneNumber())
                && userRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()) {
            throw ApiException.badRequest("Phone number is already registered");
        }

        PendingSignup existing = readPending(email);
        if (existing != null && Boolean.TRUE.equals(redis(() -> redis.hasKey(COOLDOWN_KEY + email)))) {
            // A pending signup is simply overwritten with a fresh code — people
            // retry signup forms constantly and that is not an error — but the
            // 60-second cooldown still applies so the form cannot be used as a
            // mail cannon.
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "A code was just sent. Please wait a minute before requesting another.");
        }

        countOrReject(IP_COUNT_KEY + clientIp, MAX_STARTS_PER_IP_PER_DAY,
                "Too many signup attempts from this network today. Please try again tomorrow.");
        countOrReject(EMAIL_COUNT_KEY + email, MAX_SENDS_PER_EMAIL_PER_DAY,
                "Too many codes requested for this email today. Please try again tomorrow.");

        String otp = generateOtp();
        PendingSignup pending = new PendingSignup(
                username,
                email,
                StringUtils.hasText(dto.getPhoneNumber()) ? dto.getPhoneNumber().trim() : null,
                passwordEncoder.encode(dto.getPassword()),
                passwordEncoder.encode(otp),
                0,
                0,
                System.currentTimeMillis());

        // Stored before the send so that a gateway failure leaves a record
        // /resend can recover from, instead of forcing the form again.
        writePending(pending, Duration.ofSeconds(otpTtlSeconds));
        redis(() -> {
            redis.opsForValue().set(COOLDOWN_KEY + email, "1", COOLDOWN);
            return null;
        });

        emailGatewayClient.sendOtp(email, otp);

        return response(email);
    }

    // ------------------------------------------------------------------
    // /register/resend
    // ------------------------------------------------------------------

    public Map<String, Object> resend(String rawEmail) {
        String email = EmailNormalizer.normalize(rawEmail);

        PendingSignup pending = readPending(email);
        if (pending == null) {
            throw ApiException.badRequest("That code has expired. Please sign up again.");
        }

        if (Boolean.TRUE.equals(redis(() -> redis.hasKey(COOLDOWN_KEY + email)))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "A code was just sent. Please wait a minute before requesting another.");
        }

        if (pending.resends() >= MAX_RESENDS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many codes requested. Please sign up again.");
        }

        countOrReject(EMAIL_COUNT_KEY + email, MAX_SENDS_PER_EMAIL_PER_DAY,
                "Too many codes requested for this email today. Please try again tomorrow.");

        String otp = generateOtp();
        // attempts carries over deliberately: resetting it would turn /resend into
        // a way to buy five more guesses at will.
        PendingSignup refreshed = new PendingSignup(
                pending.username(), pending.email(), pending.phoneNumber(), pending.passwordHash(),
                passwordEncoder.encode(otp), pending.attempts(), pending.resends() + 1, pending.createdAt());

        writePending(refreshed, Duration.ofSeconds(otpTtlSeconds));
        redis(() -> {
            redis.opsForValue().set(COOLDOWN_KEY + email, "1", COOLDOWN);
            return null;
        });

        emailGatewayClient.sendOtp(email, otp);

        return response(email);
    }

    // ------------------------------------------------------------------
    // /register/verify
    // ------------------------------------------------------------------

    @Transactional
    public AuthResponseDTO verify(String rawEmail, String otp) {
        String email = EmailNormalizer.normalize(rawEmail);

        PendingSignup pending = readPending(email);
        if (pending == null) {
            throw ApiException.badRequest("That code has expired. Please sign up again.");
        }

        if (pending.attempts() >= MAX_ATTEMPTS) {
            deletePending(email);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many incorrect codes. Please start over.");
        }

        if (!passwordEncoder.matches(otp, pending.otpHash())) {
            int attempts = pending.attempts() + 1;
            if (attempts >= MAX_ATTEMPTS) {
                // The pending record is burned outright, so even the correct code
                // is worthless from here on.
                deletePending(email);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many incorrect codes. Please start over.");
            }
            PendingSignup bumped = new PendingSignup(
                    pending.username(), pending.email(), pending.phoneNumber(), pending.passwordHash(),
                    pending.otpHash(), attempts, pending.resends(), pending.createdAt());
            // Keep whatever is left of the original TTL — a wrong guess must not
            // extend the life of the code.
            writePending(bumped, remainingTtl(email));
            throw ApiException.badRequest("That code is not right. "
                    + (MAX_ATTEMPTS - attempts) + " attempt(s) left.");
        }

        // Single use, and burned before the insert so a double-submit cannot
        // create two accounts.
        deletePending(email);

        // Ten minutes is plenty of time for the name or the address to be taken
        // by someone else, so every uniqueness check runs again here.
        if (userRepository.existsByUsernameIgnoreCase(pending.username())) {
            throw ApiException.badRequest("Username is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.badRequest("Email is already registered");
        }
        if (pending.phoneNumber() != null
                && userRepository.findByPhoneNumber(pending.phoneNumber()).isPresent()) {
            throw ApiException.badRequest("Phone number is already registered");
        }

        User user = new User();
        user.setUsername(pending.username());
        user.setEmail(email);
        user.setPhoneNumber(pending.phoneNumber());
        user.setPassword(pending.passwordHash());
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(Role.USER);
        user.setAccountEnabled(true);
        user.setEmailVerified(true);

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            // The lower(email) unique index is the final backstop against two
            // requests racing past the checks above.
            throw ApiException.conflict("That account already exists. Please sign in.", "ALREADY_EXISTS");
        }

        return authTokenIssuer.issue(user);
    }

    // ------------------------------------------------------------------
    // Redis plumbing
    // ------------------------------------------------------------------

    private Map<String, Object> response(String email) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "OTP_SENT");
        body.put("email", EmailNormalizer.mask(email));
        body.put("expiresInSeconds", otpTtlSeconds);
        return body;
    }

    private String generateOtp() {
        // Formatted, not truncated — "000123" is a perfectly good code and
        // dropping its leading zeros would shrink the keyspace.
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private PendingSignup readPending(String email) {
        String json = redis(() -> redis.opsForValue().get(PENDING_KEY + email));
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, PendingSignup.class);
        } catch (Exception ex) {
            log.warn("Discarding an unreadable pending signup record", ex);
            deletePending(email);
            return null;
        }
    }

    private void writePending(PendingSignup pending, Duration ttl) {
        String json = objectMapper.writeValueAsString(pending);
        Duration effective = (ttl == null || ttl.isNegative() || ttl.isZero())
                ? Duration.ofSeconds(otpTtlSeconds)
                : ttl;
        redis(() -> {
            redis.opsForValue().set(PENDING_KEY + pending.email(), json, effective);
            return null;
        });
    }

    private void deletePending(String email) {
        redis(() -> redis.delete(PENDING_KEY + email));
    }

    private Duration remainingTtl(String email) {
        Long seconds = redis(() -> redis.getExpire(PENDING_KEY + email));
        return (seconds == null || seconds <= 0) ? null : Duration.ofSeconds(seconds);
    }

    /** A daily counter that rejects once it passes {@code limit}. */
    private void countOrReject(String key, int limit, String message) {
        Long count = redis(() -> {
            Long value = redis.opsForValue().increment(key);
            if (value != null && value == 1L) {
                redis.expire(key, DAY);
            }
            return value;
        });
        if (count != null && count > limit) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
        }
    }

    /**
     * Every Redis call goes through here so that an outage becomes one honest
     * 503 rather than a half-completed signup.
     */
    private <T> T redis(Supplier<T> op) {
        try {
            return op.get();
        } catch (ApiException | EmailDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Redis is unavailable; refusing to create an unverified account", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Signup is temporarily unavailable. Please try again shortly.");
        }
    }
}
