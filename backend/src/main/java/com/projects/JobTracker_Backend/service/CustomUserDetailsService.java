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
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with identifier: " + loginIdentifier));

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