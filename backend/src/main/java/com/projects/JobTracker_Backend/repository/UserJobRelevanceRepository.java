package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.UserJobRelevance;
import com.projects.JobTracker_Backend.model.UserJobRelevanceId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserJobRelevanceRepository extends JpaRepository<UserJobRelevance, UserJobRelevanceId> {

    /**
     * Returns the top N precomputed relevance entries for a user, ordered by score descending.
     * Only returns entries for active jobs. No scoring at query time.
     */
    @Query("SELECT r FROM UserJobRelevance r JOIN FETCH r.job j " +
           "WHERE r.userId = :userId AND j.isActive = true " +
           "ORDER BY r.score DESC")
    List<UserJobRelevance> findTopJobsForUser(@Param("userId") Long userId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM UserJobRelevance r WHERE r.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
