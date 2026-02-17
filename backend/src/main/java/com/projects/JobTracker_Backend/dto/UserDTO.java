package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String phoneNumber;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private Boolean accountEnabled;
    private Boolean accountLocked;
    private AuthProvider authProvider;
    private Role role;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserProfileDTO profile;
}