package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.AuthResponseDTO;
import com.projects.JobTracker_Backend.dto.UserLoginDTO;
import com.projects.JobTracker_Backend.dto.UserRegisterDTO;
import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.enums.Role;
import com.projects.JobTracker_Backend.model.RefreshToken;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.RefreshTokenRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.security.JwtUtil;
import com.projects.JobTracker_Backend.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    UserRepository userRepository;
    @Autowired
    PasswordEncoder encoder;
    @Autowired
    JwtUtil jwtUtils;
    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody UserLoginDTO loginDTO) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getLoginIdentifier(),
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegisterDTO registerDTO) {
        // Check if username exists
        if (userRepository.existsByUsername(registerDTO.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username is already taken"));
        }

        // Check if email exists (if provided)
        if (registerDTO.getEmail() != null &&
                userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email is already registered"));
        }

        // Check if phone exists (if provided)
        if (registerDTO.getPhoneNumber() != null &&
                userRepository.findByPhoneNumber(registerDTO.getPhoneNumber()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Phone number is already registered"));
        }

        // Create new user
        User newUser = new User();
        newUser.setUsername(registerDTO.getUsername());
        newUser.setEmail(registerDTO.getEmail());
        newUser.setPhoneNumber(registerDTO.getPhoneNumber());
        newUser.setPassword(encoder.encode(registerDTO.getPassword()));
        newUser.setAuthProvider(AuthProvider.LOCAL);
        newUser.setRole(Role.USER);
        newUser.setAccountEnabled(true);

        userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User registered successfully"));
    }

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