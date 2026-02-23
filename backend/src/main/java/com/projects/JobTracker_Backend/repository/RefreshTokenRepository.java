package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.RefreshToken;
import com.projects.JobTracker_Backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}
