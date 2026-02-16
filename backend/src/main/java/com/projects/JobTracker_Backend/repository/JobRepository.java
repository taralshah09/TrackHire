package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    // Find by category
    Page<Job> findByJobCategoryAndIsActiveTrue(Job.JobCategory category, Pageable pageable);

    // Find all active jobs
    Page<Job> findByIsActiveTrue(Pageable pageable);

    // Find by external ID (for deduplication)
    Optional<Job> findByExternalId(String externalId);

    Optional<Job> findById(Long id);
    // Statistics queries
    @Query("SELECT COUNT(j) FROM Job j WHERE j.isActive = true")
    long countActiveJobs();

    @Query("SELECT COUNT(DISTINCT j.company) FROM Job j WHERE j.isActive = true")
    long countDistinctCompanies();

    @Query("SELECT j.jobCategory, COUNT(j) FROM Job j WHERE j.isActive = true GROUP BY j.jobCategory")
    List<Object[]> countJobsByCategory();

    @Query("SELECT j.employmentType, COUNT(j) FROM Job j WHERE j.isActive = true GROUP BY j.employmentType")
    List<Object[]> countJobsByEmploymentType();
}