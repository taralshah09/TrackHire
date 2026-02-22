package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.UserJobPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserJobPreferencesRepository extends JpaRepository<UserJobPreferences, Long> {

    /**
     * Looks up the preferences for a given user ID.
     * Uses a JOIN FETCH to eagerly load jobTitles and skills collections
     * in a single query round-trip.
     */
    @Query("SELECT p FROM UserJobPreferences p " +
           "LEFT JOIN FETCH p.jobTitles " +
           "LEFT JOIN FETCH p.skills " +
           "LEFT JOIN FETCH p.roleTypes " +
           "WHERE p.user.id = :userId")
    Optional<UserJobPreferences> findByUserId(@Param("userId") Long userId);

    boolean existsByUserId(Long userId);
}
