package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.crypto.DecryptedRequest;
import com.projects.JobTracker_Backend.dto.AuthResponseDTO;
import com.projects.JobTracker_Backend.dto.GoogleCompleteDTO;
import com.projects.JobTracker_Backend.dto.GoogleSignInDTO;
import com.projects.JobTracker_Backend.dto.RegisterResendDTO;
import com.projects.JobTracker_Backend.dto.RegisterStartDTO;
import com.projects.JobTracker_Backend.dto.RegisterVerifyDTO;
import com.projects.JobTracker_Backend.dto.UserLoginDTO;
import com.projects.JobTracker_Backend.model.RefreshToken;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.ratelimit.ClientIpResolver;
import com.projects.JobTracker_Backend.repository.RefreshTokenRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.security.JwtUtil;
import com.projects.JobTracker_Backend.service.GoogleAuthService;
import com.projects.JobTracker_Backend.service.OtpSignupService;
import com.projects.JobTracker_Backend.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    UserRepository userRepository;
    @Autowired
    JwtUtil jwtUtils;
    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    @Autowired
    private OtpSignupService otpSignupService;
    @Autowired
    private GoogleAuthService googleAuthService;

    // ==================================================================
    // Password login
    // ==================================================================

    @PostMapping("/login")
    @DecryptedRequest
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody UserLoginDTO loginDTO) {
        String identifier = loginDTO.getLoginIdentifier();

        // A Google-only account has no password to check, and Spring's
        // authentication would fail with something unhelpful. Say plainly that
        // there is no password account here.
        //
        // Tradeoff, stated deliberately: this distinguishes "registered with
        // Google" from "wrong password", which is account enumeration. It is the
        // behaviour that was asked for, and the NO_PASSWORD_ACCOUNT code below is
        // what the SPA uses to offer the Google button. Returning the same 401 for
        // both cases is a one-line change if that trade stops being worth it.
        Optional<User> candidate = userRepository
                .findByUsernameOrEmailOrPhoneNumber(identifier, identifier, identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier));

        if (candidate.isPresent() && !StringUtils.hasText(candidate.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found", "code", "NO_PASSWORD_ACCOUNT"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            identifier,
                            loginDTO.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Fetch actual User entity using username from UserDetails
            User dbUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate tokens
            String accessToken = jwtUtils.generateToken(dbUser.getUsername());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(dbUser.getId());

            // Return response
            AuthResponseDTO response = new AuthResponseDTO(
                    accessToken,
                    refreshToken.getToken(),
                    dbUser.getUsername(),
                    dbUser.getEmail()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            // The exception type and message stay in the log. They used to be
            // returned in the body, which handed a caller internal class names on
            // every failed login.
            log.warn("Login failed for identifier '{}': {}", identifier, e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    // ==================================================================
    // OTP-verified registration
    // ==================================================================

    /**
     * Validates, prices in the uniqueness checks, and mails a code. Nothing is
     * written to {@code users} here — that only happens once the code checks out.
     */
    @PostMapping("/register/start")
    @DecryptedRequest
    public ResponseEntity<?> registerStart(@Valid @RequestBody RegisterStartDTO dto,
                                           HttpServletRequest request) {
        return ResponseEntity.ok(otpSignupService.start(dto, ClientIpResolver.resolve(request)));
    }

    /** Checks the code, creates the account, and signs the person straight in. */
    @PostMapping("/register/verify")
    @DecryptedRequest
    public ResponseEntity<?> registerVerify(@Valid @RequestBody RegisterVerifyDTO dto) {
        return ResponseEntity.ok(otpSignupService.verify(dto.getEmail(), dto.getOtp()));
    }

    @PostMapping("/register/resend")
    @DecryptedRequest
    public ResponseEntity<?> registerResend(@Valid @RequestBody RegisterResendDTO dto) {
        return ResponseEntity.ok(otpSignupService.resend(dto.getEmail()));
    }

    /**
     * The old un-OTP'd signup route.
     *
     * <p>It is kept for exactly one release so that a browser holding a stale
     * bundle gets a message rather than a 404, and it answers 410 rather than
     * working: leaving it live would be an account-creation path with no email
     * verification, which defeats the whole point of the flow above. Delete it
     * once the new SPA is everywhere.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUserRetired() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of("message", "Please refresh the app to continue signing up.",
                        "code", "CLIENT_OUTDATED"));
    }

    // ==================================================================
    // Google Sign-In
    // ==================================================================

    /**
     * Verifies the GIS ID token and resolves it to an account.
     *
     * @return the usual {@link AuthResponseDTO} for an existing or linkable user,
     *         or {@code {status: USERNAME_REQUIRED, signupToken, email,
     *         suggestedUsername}} for someone brand new.
     */
    @PostMapping("/google")
    @DecryptedRequest
    public ResponseEntity<?> googleSignIn(@Valid @RequestBody GoogleSignInDTO dto) {
        return ResponseEntity.ok(googleAuthService.signIn(dto.getCredential()));
    }

    /** Second half of a brand-new Google signup, once a username has been picked. */
    @PostMapping("/google/complete")
    @DecryptedRequest
    public ResponseEntity<?> googleComplete(@Valid @RequestBody GoogleCompleteDTO dto) {
        return ResponseEntity.ok(googleAuthService.complete(dto.getSignupToken(), dto.getUsername()));
    }

    /**
     * Live feedback for the username screen.
     *
     * <p>It is a mild enumeration oracle, which is unavoidable if the screen is
     * to tell someone their name is taken before they submit. It sits in the
     * strict rate-limit tier for that reason.
     */
    @GetMapping("/username-available")
    public ResponseEntity<?> usernameAvailable(@RequestParam("u") String username) {
        return ResponseEntity.ok(googleAuthService.usernameAvailability(username));
    }

    // ==================================================================
    // Tokens
    // ==================================================================

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> payload) {
        String requestToken = payload.get("refreshToken");

        if (requestToken == null || requestToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Refresh token is required"));
        }

        return refreshTokenRepository.findByToken(requestToken)
                .map(token -> {
                    if (refreshTokenService.isTokenExpired(token)) {
                        refreshTokenRepository.delete(token);
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Refresh token expired. Please login again."));
                    }
                    String newJwt = jwtUtils.generateToken(token.getUser().getUsername());
                    return ResponseEntity.ok(Map.of("token", newJwt));
                })
                .orElse(ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid refresh token")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestBody Map<String, String> payload) {
        String requestToken = payload.get("refreshToken");

        if (requestToken == null || requestToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Refresh token is required"));
        }

        return refreshTokenRepository.findByToken(requestToken)
                .map(token -> {
                    refreshTokenRepository.delete(token);
                    return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
                })
                .orElse(ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid refresh token")));
    }
}
