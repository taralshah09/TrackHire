package com.projects.JobTracker_Backend.model;

import com.projects.JobTracker_Backend.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One row per external identity linked to a user.
 *
 * <p>{@code providerUserId} is Google's {@code sub} — its stable subject id.
 * That, not the email, is the identity key for an already-linked account: a
 * person can change the address on their Google account, but {@code sub} never
 * changes.
 *
 * <p>The presence of a row here is the source of truth for "this user can sign
 * in with Google", not {@code User.authProvider}. A local account that links
 * Google keeps {@code authProvider = LOCAL} and its password, and can then sign
 * in either way.
 *
 * <p>There are deliberately no access/refresh token columns: the GIS ID-token
 * flow never yields Google OAuth tokens, so a column for them would only ever
 * hold null.
 */
@Getter
@Setter
@Entity
@Table(name = "oauth_accounts",
        uniqueConstraints = @UniqueConstraint(name = "uk_oauth_provider_user",
                columnNames = {"provider", "provider_user_id"}))
public class OAuthAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    @Column(name = "provider_user_id")
    private String providerUserId;

    private LocalDateTime linkedAt;
}
