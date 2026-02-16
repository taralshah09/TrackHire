package com.projects.JobTracker_Backend.util;

import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    /**
     * Get the currently authenticated user from SecurityContext
     * @return User object
     * @throws RuntimeException if user is not authenticated
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();

        // Case 1: Principal is already a User entity
        if (principal instanceof User) {
            return (User) principal;
        }

        // Case 2: Principal is UserDetails - load from database
        if (principal instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principal;
            String username = userDetails.getUsername(); // This is typically email

            // Try to find by email first
            return userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + username));
        }

        // Case 3: Principal is a String (username/email)
        if (principal instanceof String) {
            String username = (String) principal;
            return userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + username));
        }

        throw new RuntimeException("Invalid authentication principal type: " + principal.getClass().getName());
    }

    /**
     * Get current user's ID
     * @return User ID
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Get current user's email
     * @return User email
     */
    public String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }
}