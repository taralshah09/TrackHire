package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.model.RefreshToken;
import com.projects.JobTracker_Backend.repository.RefreshTokenRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Value("${jwt.refreshExpirationMs}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository repo, UserRepository userRepo) {
        this.refreshTokenRepository = repo;
        this.userRepository = userRepo;
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        var user = userRepository.findById(userId).get();
        // Remove any existing refresh token for this user (e.g. stale token after cookie clear)
        refreshTokenRepository.deleteByUser(user);

        var token = new RefreshToken();
        token.setUser(user);
        token.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        token.setToken(UUID.randomUUID().toString());
        return refreshTokenRepository.save(token);
    }

    public boolean isTokenExpired(RefreshToken token) {
        return token.getExpiryDate().isBefore(Instant.now());
    }
}