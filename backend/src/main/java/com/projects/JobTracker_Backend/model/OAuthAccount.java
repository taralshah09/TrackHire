package com.projects.JobTracker_Backend.model;

import com.projects.JobTracker_Backend.enums.AuthProvider;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "oauth_accounts")
public class OAuthAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    @Column(name = "provider_user_id")
    private String providerUserId;

    private String accessToken; // Consider encrypting
    private String refreshToken; // Consider encrypting
    private LocalDateTime tokenExpiresAt;

    private LocalDateTime linkedAt;
}
