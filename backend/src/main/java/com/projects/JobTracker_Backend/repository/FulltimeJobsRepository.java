package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.FulltimeJobs;
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
public interface FulltimeJobsRepository extends JpaRepository<FulltimeJobs, Long>, JpaSpecificationExecutor<FulltimeJobs> {

    // Find by category
    Page<FulltimeJobs> findByJobCategoryAndIsActiveTrue(FulltimeJobs.JobCategory category, Pageable pageable);

    // Find all active jobs
    Page<FulltimeJobs> findByIsActiveTrue(Pageable pageable);

    // Find by external ID (for deduplication)
    Optional<FulltimeJobs> findByExternalId(String externalId);

    Optional<FulltimeJobs> findById(Long id);
    // Statistics queries
    @Query("SELECT COUNT(j) FROM FulltimeJobs j WHERE j.isActive = true")
    long countActiveJobs();

    @Query("SELECT COUNT(DISTINCT j.company) FROM FulltimeJobs j WHERE j.isActive = true")
    long countDistinctCompanies();

    @Query("SELECT j.jobCategory, COUNT(j) FROM FulltimeJobs j WHERE j.isActive = true GROUP BY j.jobCategory")
    List<Object[]> countJobsByCategory();

    @Query("SELECT j.employmentType, COUNT(j) FROM FulltimeJobs j WHERE j.isActive = true GROUP BY j.employmentType")
    List<Object[]> countJobsByEmploymentType();

    @Query("SELECT COUNT(j) FROM FulltimeJobs j WHERE j.isActive = true AND j.employmentType = :type")
    long countActiveByEmploymentType(@Param("type") FulltimeJobs.EmploymentType type);

    @Query("SELECT j FROM FulltimeJobs j WHERE j.isActive = true " +
           "ORDER BY CASE WHEN j.company IN :preferredCompanies THEN 0 ELSE 1 END, j.postedAt DESC")
    Page<FulltimeJobs> findPreferredJobs(@Param("preferredCompanies") List<String> preferredCompanies, Pageable pageable);
}