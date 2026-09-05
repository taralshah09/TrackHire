package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.AuthResponseDTO;
import com.projects.JobTracker_Backend.model.RefreshToken;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Turns a persisted user into the token pair the SPA expects.
 *
 * <p>Four sign-in paths now end the same way — password login, OTP-verified
 * signup, Google sign-in and Google signup completion — and all four must return
 * the identical {@link AuthResponseDTO} shape, because {@code AuthContext.login()}
 * on the frontend parses exactly one shape.
 */
@Service
@RequiredArgsConstructor
public class AuthTokenIssuer {

    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public AuthResponseDTO issue(User user) {
        String accessToken = jwtUtil.generateToken(user.getUsername());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new AuthResponseDTO(
                accessToken,
                refreshToken.getToken(),
                user.getUsername(),
                user.getEmail()
        );
    }
}
