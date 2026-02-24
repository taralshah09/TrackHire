package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.AppliedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppliedJobRepository extends JpaRepository<AppliedJob, Long> {

    // Check if user has applied to a specific job with type
    boolean existsByUserIdAndJobIdAndJobType(Long userId, Long jobId, String jobType);

    // Find applied job by user, job ID, and type
    Optional<AppliedJob> findByUserIdAndJobIdAndJobType(Long userId, Long jobId, String jobType);

    // Get all applied jobs for a user
    Page<AppliedJob> findByUserIdOrderByAppliedAtDesc(Long userId, Pageable pageable);

    // Get applied jobs by status (multiple statuses)
    @Query("SELECT a FROM AppliedJob a WHERE a.user.id = :userId AND a.status IN :statuses ORDER BY a.appliedAt DESC")
    Page<AppliedJob> findByUserIdAndStatusIn(Long userId, List<AppliedJob.ApplicationStatus> statuses, Pageable pageable);

    // Count applied jobs for user
    long countByUserId(Long userId);

    // Count applied jobs this week for user
    @Query("SELECT COUNT(a) FROM AppliedJob a WHERE a.user.id = :userId AND a.appliedAt >= :weekAgo")
    long countByUserIdAndAppliedAtAfter(Long userId, LocalDateTime weekAgo);

    // Count by status for user
    long countByUserIdAndStatus(Long userId, AppliedJob.ApplicationStatus status);

    // Delete applied job by type
    void deleteByUserIdAndJobIdAndJobType(Long userId, Long jobId, String jobType);
}