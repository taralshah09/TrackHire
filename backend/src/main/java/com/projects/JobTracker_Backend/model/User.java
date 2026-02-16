package com.projects.JobTracker_Backend.model;

import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.List;


@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phoneNumber;

    private String password; // nullable for OAuth users

    private Boolean emailVerified = false;
    private Boolean phoneVerified = false;
    private Boolean accountEnabled = true;
    private Boolean accountLocked = false;

    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    private Integer failedLoginAttempts = 0;
    private LocalDateTime lastLoginAt;
    private LocalDateTime passwordChangedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<OAuthAccount> oauthAccounts;
}
