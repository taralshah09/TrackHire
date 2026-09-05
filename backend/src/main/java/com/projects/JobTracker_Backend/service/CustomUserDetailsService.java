package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String loginIdentifier)
            throws UsernameNotFoundException {

        User user = userRepository
                .findByUsernameOrEmailOrPhoneNumber(
                        loginIdentifier,
                        loginIdentifier,
                        loginIdentifier
                )
                // The exact-match finder above misses "USER@x.com" against a row
                // stored as "user@x.com"; the case-insensitive one catches it.
                .or(() -> userRepository.findByEmailIgnoreCase(loginIdentifier))
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with identifier: " + loginIdentifier));

        // A Google-only account has no password. Spring's User constructor throws
        // IllegalArgumentException on a null one, which surfaces as an opaque 500
        // with a stack trace instead of a failed login. Treat "no password
        // credential" as "not a password-login account" and let the normal
        // authentication failure path handle it.
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new UsernameNotFoundException("No password credential for identifier: " + loginIdentifier);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getAccountEnabled(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                !user.getAccountLocked(), // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }


}
