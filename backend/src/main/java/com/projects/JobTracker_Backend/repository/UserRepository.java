package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phone);
    Optional<User> findByUsernameOrEmailOrPhoneNumber(String username, String email, String phone);
    boolean existsByUsername(String username);
}