package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.PreferenceRequest;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/preferences/companies")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> savePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PreferenceRequest request) {
        
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        preferenceService.saveUserPreferredCompanies(user.getId(), request.getCompanies());
        
        return ResponseEntity.ok(Map.of("message", "Preferences saved successfully"));
    }

    @GetMapping
    public ResponseEntity<List<String>> getPreferences(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(preferenceService.getUserPreferredCompanies(user.getId()));
    }
}
