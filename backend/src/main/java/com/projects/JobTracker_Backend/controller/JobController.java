package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.*;
import com.projects.JobTracker_Backend.model.AppliedJob;
import com.projects.JobTracker_Backend.model.Job;
import com.projects.JobTracker_Backend.service.JobService;
import com.projects.JobTracker_Backend.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobController {

    private final JobService jobService;
    private final SecurityUtil securityUtil; // Inject SecurityUtil

    // ================== JOB BROWSING ==================

    /**
     * GET /api/jobs
     * Get all active jobs (paginated)
     */
    @GetMapping
    public ResponseEntity<Page<JobDTO>> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<JobDTO> jobs = jobService.getAllJobs(pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/category/{category}
     * Get jobs by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Page<JobDTO>> getJobsByCategory(
            @PathVariable Job.JobCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<JobDTO> jobs = jobService.getJobsByCategory(category, pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/{jobId}
     * Get single job details
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<JobDTO> getJobById(@PathVariable Long jobId) {
        JobDTO job = jobService.getJobById(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.ok(job);
    }

    /**
     * GET /api/jobs/search
     * Multi-keyword search across all jobs
     */
    @GetMapping("/search")
    public ResponseEntity<Page<JobDTO>> searchJobs(
            @RequestParam String keywords,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        List<String> keywordList = parseCommaSeparated(keywords);

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<JobDTO> jobs = jobService.searchJobs(keywordList, pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/search/category/{category}
     * Multi-keyword search within category
     */
    @GetMapping("/search/category/{category}")
    public ResponseEntity<Page<JobDTO>> searchJobsByCategory(
            @PathVariable Job.JobCategory category,
            @RequestParam String keywords,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        List<String> keywordList = parseCommaSeparated(keywords);

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<JobDTO> jobs = jobService.searchJobsByCategory(keywordList, category, pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/filter
     * Advanced multi-filter search
     */
    @GetMapping("/filter")
    public ResponseEntity<Page<JobDTO>> filterJobs(
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) String categories,
            @RequestParam(required = false) String locations,
            @RequestParam(required = false) String employmentTypes,
            @RequestParam(required = false) String experienceLevels,
            @RequestParam(required = false) Boolean isRemote,
            @RequestParam(required = false) Integer minSalary,
            @RequestParam(required = false) Integer maxSalary,
            @RequestParam(required = false) String companies,
            @RequestParam(required = false) String sources,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        List<String> keywordList = parseCommaSeparated(keywords);
        List<Job.JobCategory> categoryList = parseEnumList(categories, Job.JobCategory.class);
        List<String> locationList = parseCommaSeparated(locations);
        List<Job.EmploymentType> employmentTypeList = parseEnumList(employmentTypes, Job.EmploymentType.class);
        List<Job.ExperienceLevel> experienceLevelList = parseEnumList(experienceLevels, Job.ExperienceLevel.class);
        List<String> companyList = parseCommaSeparated(companies);
        List<Job.Source> sourceList = parseEnumList(sources, Job.Source.class);

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<JobDTO> jobs = jobService.filterJobs(
                keywordList, categoryList, locationList, employmentTypeList, experienceLevelList,
                isRemote, minSalary, maxSalary, companyList, sourceList, pageable, securityUtil.getCurrentUser()
        );

        return ResponseEntity.ok(jobs);
    }

    // ================== SAVED JOBS ==================

    /**
     * POST /api/jobs/{jobId}/save
     * Save a job
     */
    @PostMapping("/{jobId}/save")
    public ResponseEntity<Void> saveJob(@PathVariable Long jobId) {
        jobService.saveJob(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * DELETE /api/jobs/{jobId}/save
     * Unsave a job
     */
    @DeleteMapping("/{jobId}/save")
    public ResponseEntity<Void> unsaveJob(@PathVariable Long jobId) {
        jobService.unsaveJob(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/jobs/saved
     * Get user's saved jobs
     */
    @GetMapping("/saved")
    public ResponseEntity<Page<JobDTO>> getSavedJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<JobDTO> jobs = jobService.getSavedJobs(pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/{jobId}/is-saved
     * Check if job is saved
     */
    @GetMapping("/{jobId}/is-saved")
    public ResponseEntity<SavedStatusDTO> isJobSaved(@PathVariable Long jobId) {
        SavedStatusDTO status = jobService.isJobSaved(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.ok(status);
    }

    // ================== APPLIED JOBS ==================

    /**
     * POST /api/jobs/{jobId}/apply
     * Mark job as applied
     */
    @PostMapping("/{jobId}/apply")
    public ResponseEntity<Void> applyToJob(
            @PathVariable Long jobId,
            @RequestBody(required = false) ApplyJobRequestDTO request
    ) {
        AppliedJob.ApplicationStatus status = (request != null && request.getStatus() != null)
                ? request.getStatus()
                : AppliedJob.ApplicationStatus.APPLIED;

        jobService.applyToJob(jobId, status, securityUtil.getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * PATCH /api/jobs/{jobId}/apply/status
     * Update application status
     */
    @PatchMapping("/{jobId}/apply/status")
    public ResponseEntity<Void> updateApplicationStatus(
            @PathVariable Long jobId,
            @Valid @RequestBody UpdateApplicationStatusDTO request
    ) {
        jobService.updateApplicationStatus(jobId, request.getStatus(), securityUtil.getCurrentUser());
        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/jobs/{jobId}/apply
     * Remove applied job
     */
    @DeleteMapping("/{jobId}/apply")
    public ResponseEntity<Void> removeApplication(@PathVariable Long jobId) {
        jobService.removeApplication(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/jobs/applied
     * Get user's applied jobs with multi-status filter
     */
    @GetMapping("/applied")
    public ResponseEntity<Page<JobDTO>> getAppliedJobs(
            @RequestParam(required = false) String statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        List<AppliedJob.ApplicationStatus> statusList = parseEnumList(statuses, AppliedJob.ApplicationStatus.class);

        Pageable pageable = PageRequest.of(page, size);
        Page<JobDTO> jobs = jobService.getAppliedJobs(statusList, pageable, securityUtil.getCurrentUser());
        return ResponseEntity.ok(jobs);
    }

    /**
     * GET /api/jobs/{jobId}/is-applied
     * Check if job is applied
     */
    @GetMapping("/{jobId}/is-applied")
    public ResponseEntity<AppliedStatusDTO> isJobApplied(@PathVariable Long jobId) {
        AppliedStatusDTO status = jobService.isJobApplied(jobId, securityUtil.getCurrentUser());
        return ResponseEntity.ok(status);
    }

    // ================== USER STATISTICS ==================

    /**
     * GET /api/jobs/stats/user
     * Get user's personal job tracking stats
     */
    @GetMapping("/stats/user")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        UserStatsDTO stats = jobService.getUserStats(securityUtil.getCurrentUser());
        return ResponseEntity.ok(stats);
    }

    // ================== HELPER METHODS ==================

    private List<String> parseCommaSeparated(String input) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        return Arrays.stream(input.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private <E extends Enum<E>> List<E> parseEnumList(String input, Class<E> enumClass) {
        if (input == null || input.trim().isEmpty()) {
            return null;
        }
        return Arrays.stream(input.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> Enum.valueOf(enumClass, s.toUpperCase()))
                .collect(Collectors.toList());
    }
}