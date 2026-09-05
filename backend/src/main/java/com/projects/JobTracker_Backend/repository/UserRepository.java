package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    /*
     * Emails are matched case-insensitively everywhere from here on: Google hands
     * back a lowercased address, and an existing row stored as "Taral@Gmail.com"
     * has to link to it rather than spawn a duplicate. The lower(email) unique
     * index in the database is the backstop that keeps these finders honest.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    Optional<User> findByPhoneNumber(String phone);

    Optional<User> findByUsernameOrEmailOrPhoneNumber(String username, String email, String phone);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.id = :id")
    Optional<User> findByIdWithProfile(Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.username = :username")
    Optional<User> findByUsernameWithProfile(String username);
}