package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    // Find by category
    Page<Job> findByJobCategoryAndIsActiveTrue(Job.JobCategory category, Pageable pageable);

    // Find all active jobs
    Page<Job> findByIsActiveTrue(Pageable pageable);

    // Find by external ID (for deduplication)
    Optional<Job> findByExternalId(String externalId);

    // Search across all jobs
    @Query("SELECT j FROM Job j WHERE j.isActive = true " +
            "AND (LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchJobs(String keyword, Pageable pageable);

    // Search within category
    @Query("SELECT j FROM Job j WHERE j.isActive = true " +
            "AND j.jobCategory = :category " +
            "AND (LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchJobsByCategory(String keyword, Job.JobCategory category, Pageable pageable);
}