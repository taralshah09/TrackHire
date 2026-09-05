package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.enums.AuthProvider;
import com.projects.JobTracker_Backend.model.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    /** The identity lookup for a returning Google user, keyed on Google's stable {@code sub}. */
    Optional<OAuthAccount> findByProviderAndProviderUserId(AuthProvider provider, String providerUserId);

    boolean existsByUserIdAndProvider(Long userId, AuthProvider provider);
}
