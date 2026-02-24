package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.SavedJob;
import com.projects.JobTracker_Backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    // Check if user has saved a specific job with type
    @Query("SELECT COUNT(s) > 0 FROM SavedJob s WHERE s.user.id = :userId AND s.job.id = :jobId AND TYPE(s.job) = :jobType")
    boolean existsByUserIdAndJobIdAndJobType(Long userId, Long jobId, Class<?> jobType);

    // Find saved job by user, job ID, and type
    @Query("SELECT s FROM SavedJob s WHERE s.user.id = :userId AND s.job.id = :jobId AND TYPE(s.job) = :jobType")
    Optional<SavedJob> findByUserIdAndJobIdAndJobType(Long userId, Long jobId, Class<?> jobType);

    // Get all saved jobs for a user
    Page<SavedJob> findByUserId(Long userId, Pageable pageable);

    // Get all saved jobs for a user (default sort)
    Page<SavedJob> findByUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    // Count saved jobs for user
    long countByUserId(Long userId);

    // Count saved jobs this week for user
    @Query("SELECT COUNT(s) FROM SavedJob s WHERE s.user.id = :userId AND s.savedAt >= :weekAgo")
    long countByUserIdAndSavedAtAfter(Long userId, LocalDateTime weekAgo);

    // Delete saved job by type
    @Modifying
    @Query("DELETE FROM SavedJob s WHERE s.user.id = :userId AND s.job.id = :jobId AND TYPE(s.job) = :jobType")
    void deleteByUserIdAndJobIdAndJobType(Long userId, Long jobId, Class<?> jobType);

    // Generic check for existence
    boolean existsByUserIdAndJobId(Long userId, Long jobId);
}