package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.InternJobs;
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
public interface InternJobRepository extends JpaRepository<InternJobs, Long>, JpaSpecificationExecutor<InternJobs> {

    // Find by category
    Page<InternJobs> findByJobCategoryAndIsActiveTrue(InternJobs.JobCategory category, Pageable pageable);

    // Find all active jobs
    Page<InternJobs> findByIsActiveTrue(Pageable pageable);

    // Find by external ID (for deduplication)
    Optional<InternJobs> findByExternalId(String externalId);

    Optional<InternJobs> findById(Long id);
    // Statistics queries
    @Query("SELECT COUNT(j) FROM InternJobs j WHERE j.isActive = true")
    long countActiveJobs();

    @Query("SELECT COUNT(DISTINCT j.company) FROM InternJobs j WHERE j.isActive = true")
    long countDistinctCompanies();

    @Query("SELECT j.jobCategory, COUNT(j) FROM InternJobs j WHERE j.isActive = true GROUP BY j.jobCategory")
    List<Object[]> countJobsByCategory();

    @Query("SELECT j.employmentType, COUNT(j) FROM InternJobs j WHERE j.isActive = true GROUP BY j.employmentType")
    List<Object[]> countJobsByEmploymentType();

    @Query("SELECT COUNT(j) FROM InternJobs j WHERE j.isActive = true AND j.employmentType = :type")
    long countActiveByEmploymentType(@Param("type") InternJobs.EmploymentType type);
}