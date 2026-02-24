package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.*;
import com.projects.JobTracker_Backend.model.*;
import com.projects.JobTracker_Backend.repository.AppliedJobRepository;
import com.projects.JobTracker_Backend.repository.FulltimeJobsRepository;
import com.projects.JobTracker_Backend.repository.InternJobRepository;
import com.projects.JobTracker_Backend.repository.JobRepository;
import com.projects.JobTracker_Backend.repository.SavedJobRepository;
import com.projects.JobTracker_Backend.specification.JobSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final InternJobRepository internJobRepository;
    private final FulltimeJobsRepository fulltimeJobsRepository;
    private final SavedJobRepository savedJobRepository;
    private final AppliedJobRepository appliedJobRepository;
    private final PreferenceService preferenceService;

    // ================== PUBLIC ENDPOINTS ==================

    public Page<JobDTO> getFeaturedJobs(Job.JobCategory category, int size) {
        Pageable pageable = PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "postedAt"));
        Page<Job> jobs;

        if (category != null) {
            jobs = jobRepository.findByJobCategoryAndIsActiveTrue(category, pageable);
        } else {
            jobs = jobRepository.findByIsActiveTrue(pageable);
        }

        return jobs.map(JobDTO::fromEntity);
    }

    public PlatformStatsDTO getPlatformStats() {
        long totalJobs = jobRepository.count();
        long totalActiveJobs = jobRepository.countActiveJobs();
        long totalCompanies = jobRepository.countDistinctCompanies();

        Map<String, Long> jobsByCategory = new HashMap<>();
        List<Object[]> categoryStats = jobRepository.countJobsByCategory();
        for (Object[] stat : categoryStats) {
            jobsByCategory.put(((Job.JobCategory) stat[0]).name(), (Long) stat[1]);
        }

        Map<String, Long> jobsByEmploymentType = new HashMap<>();
        List<Object[]> employmentStats = jobRepository.countJobsByEmploymentType();
        for (Object[] stat : employmentStats) {
            if (stat[0] != null) {
                jobsByEmploymentType.put(((Job.EmploymentType) stat[0]).name(), (Long) stat[1]);
            }
        }

        return PlatformStatsDTO.builder()
                .totalJobs(totalJobs)
                .totalActiveJobs(totalActiveJobs)
                .totalCompanies(totalCompanies)
                .jobsByCategory(jobsByCategory)
                .jobsByEmploymentType(jobsByEmploymentType)
                .build();
    }

    public Map<String, Long> getEmploymentTypeCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();

        long activeInterns = internJobRepository.countActiveJobs();
        long activeFulltime = fulltimeJobsRepository.countActiveJobs();

        counts.put("ALL", activeInterns + activeFulltime);
        counts.put("INTERNSHIP", activeInterns);
        counts.put("FULL_TIME", activeFulltime);

        return counts;
    }

    // ================== PROTECTED ENDPOINTS - JOB BROWSING ==================

    public Page<JobDTO> getAllJobs(Pageable pageable, User user) {
        Page<Job> jobs = jobRepository.findByIsActiveTrue(pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    public Page<JobDTO> getJobsByCategory(Job.JobCategory category, Pageable pageable, User user) {
        Page<Job> jobs = jobRepository.findByJobCategoryAndIsActiveTrue(category, pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    public JobDTO getJobById(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        if (!job.getIsActive()) {
            throw new RuntimeException("Job is not active");
        }

        return enrichJobWithUserData(job, user);
    }

    public Page<JobDTO> searchJobs(List<String> keywords, Pageable pageable, User user) {
        if (keywords == null || keywords.isEmpty()) {
            return getAllJobs(pageable, user);
        }

        List<String> cleanedKeywords = keywords.stream()
                .map(String::trim)
                .filter(k -> !k.isEmpty())
                .collect(Collectors.toList());

        if (cleanedKeywords.isEmpty()) {
            return getAllJobs(pageable, user);
        }

        Specification<Job> spec = JobSpecification.filterJobs(
                cleanedKeywords, null, null, null, null, null, null, null, null, null, null, null
        );

        Page<Job> jobs = jobRepository.findAll(spec, pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    public Page<JobDTO> searchJobsByCategory(List<String> keywords, Job.JobCategory category,
                                             Pageable pageable, User user) {
        if (keywords == null || keywords.isEmpty()) {
            return getJobsByCategory(category, pageable, user);
        }

        List<String> cleanedKeywords = keywords.stream()
                .map(String::trim)
                .filter(k -> !k.isEmpty())
                .collect(Collectors.toList());

        if (cleanedKeywords.isEmpty()) {
            return getJobsByCategory(category, pageable, user);
        }

        Specification<Job> spec = JobSpecification.filterJobs(
                cleanedKeywords, List.of(category), null, null, null, null, null, null, null, null, null, null
        );

        Page<Job> jobs = jobRepository.findAll(spec, pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    public Page<JobDTO> filterJobs(
            List<String> keywords,
            List<Job.JobCategory> categories,
            List<String> locations,
            List<Job.EmploymentType> employmentTypes,
            List<Job.ExperienceLevel> experienceLevels,
            Boolean isRemote,
            Integer minSalary,
            Integer maxSalary,
            List<String> companies,
            List<Job.Source> sources,
            List<String> positions,
            List<String> skills,
            Pageable pageable,
            User user
    ) {
        Specification<Job> spec = JobSpecification.filterJobs(
                keywords, categories, locations, employmentTypes, experienceLevels,
                isRemote, minSalary, maxSalary, companies, sources, positions, skills
        );

        Page<Job> jobs = jobRepository.findAll(spec, pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    public Page<JobDTO> getPreferredJobs(String type, List<String> preferredCompanies, Pageable pageable, User user) {
        if (preferredCompanies == null || preferredCompanies.isEmpty()) {
            // If no preferences, return regular jobs sorted by postedAt (handled by pageable)
            if ("intern".equalsIgnoreCase(type)) {
                return internJobRepository.findByIsActiveTrue(pageable).map(job -> enrichJobWithUserData(job, user));
            } else if ("fulltime".equalsIgnoreCase(type)) {
                return fulltimeJobsRepository.findByIsActiveTrue(pageable).map(job -> enrichJobWithUserData(job, user));
            } else {
                return jobRepository.findByIsActiveTrue(pageable).map(job -> enrichJobWithUserData(job, user));
            }
        }

        if ("intern".equalsIgnoreCase(type)) {
            Page<InternJobs> jobs = internJobRepository.findPreferredJobs(preferredCompanies, pageable);
            return jobs.map(job -> enrichJobWithUserData(job, user));
        } else if ("fulltime".equalsIgnoreCase(type)) {
            Page<FulltimeJobs> jobs = fulltimeJobsRepository.findPreferredJobs(preferredCompanies, pageable);
            return jobs.map(job -> enrichJobWithUserData(job, user));
        } else {
            Page<Job> jobs = jobRepository.findPreferredJobs(preferredCompanies, pageable);
            return jobs.map(job -> enrichJobWithUserData(job, user));
        }
    }

    // ================== SAVED JOBS ==================

    // = [NEW] helper for polymorphic entity class lookup
   private Class<?> getJobEntityClass(BaseJob job) {
    // Unwrap proxy to get the real entity class
    BaseJob unproxied = (BaseJob) Hibernate.unproxy(job);

    if (unproxied instanceof InternJobs) {
        return InternJobs.class;
    } else if (unproxied instanceof FulltimeJobs) {
        return FulltimeJobs.class;
    } else if (unproxied instanceof Job) {
        return Job.class;
    }
    throw new IllegalArgumentException("Unknown job type: " + unproxied.getClass());
}

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "savedJobs", allEntries = true),
            @CacheEvict(value = "userStats", key = "#user.id")
    })
    public void saveJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        Class<?> jobClass = getJobEntityClass(job);
        if (savedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass)) {
            throw new RuntimeException("Job already saved");
        }

        SavedJob savedJob = new SavedJob();
        savedJob.setUser(user);
        savedJob.setJob(job);
        savedJobRepository.save(savedJob);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "savedJobs", allEntries = true),
            @CacheEvict(value = "userStats", key = "#user.id")
    })
    public void unsaveJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        Class<?> jobClass = getJobEntityClass(job);
        if (!savedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass)) {
            throw new RuntimeException("Job not saved");
        }

        savedJobRepository.deleteByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "savedJobs", key = "#user.id + '-' + #pageable.pageNumber")
    public Page<JobDTO> getSavedJobs(Pageable pageable, User user) {
        Page<SavedJob> savedJobs = savedJobRepository.findByUserIdOrderBySavedAtDesc(user.getId(), pageable);
        List<JobDTO> dtoList = savedJobs.getContent().stream()
                .map(savedJob -> {
                    JobDTO dto = JobDTO.fromEntity(savedJob.getJob());
                    if (dto == null) return null;

                    dto.setIsSaved(true);

                    // Note: Since savedJob.getJob() could be of any type, we need to check its actual type for the application status lookup
                    Class<?> jobClass = getJobEntityClass(savedJob.getJob());
                    dto.setIsApplied(appliedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), savedJob.getJob().getId(), jobClass));
                    if (dto.getIsApplied()) {
                        appliedJobRepository.findByUserIdAndJobIdAndJobType(user.getId(), savedJob.getJob().getId(), jobClass)
                                .ifPresent(applied -> {
                                    dto.setApplicationStatus(applied.getStatus().name());
                                    dto.setAppliedAt(applied.getAppliedAt());
                                });
                    }
                    return dto;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, savedJobs.getTotalElements());
    }

    public SavedStatusDTO isJobSaved(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
        Class<?> jobClass = getJobEntityClass(job);
        boolean saved = savedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass);
        return SavedStatusDTO.builder().saved(saved).build();
    }

    // ================== APPLICATION STATUS MANAGEMENT ==================

    /**
     * Update or create job application status
     * - If application doesn't exist: creates new application with given status
     * - If application exists: updates to new status
     * - This is a single unified endpoint for all status changes
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "appliedJobs", allEntries = true),
            @CacheEvict(value = "savedJobs", allEntries = true),
            @CacheEvict(value = "userStats", key = "#user.id")
    })
    public AppliedStatusDTO updateJobStatus(Long jobId, AppliedJob.ApplicationStatus status, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        Class<?> jobClass = getJobEntityClass(job);
        Optional<AppliedJob> existingApplication = appliedJobRepository.findByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass);

        AppliedJob appliedJob;
        if (existingApplication.isPresent()) {
            // Update existing application
            appliedJob = existingApplication.get();
            appliedJob.setStatus(status);
        } else {
            // Create new application
            appliedJob = new AppliedJob();
            appliedJob.setUser(user);
            appliedJob.setJob(job);
            appliedJob.setStatus(status);
        }

        appliedJobRepository.save(appliedJob);

        return AppliedStatusDTO.builder()
                .applied(true)
                .status(status.name())
                .build();
    }

    /**
     * Withdraw application - deletes the application record
     * Job returns to "Not Applied" state
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "appliedJobs", allEntries = true),
            @CacheEvict(value = "savedJobs", allEntries = true),
            @CacheEvict(value = "userStats", key = "#user.id")
    })
    public void withdrawApplication(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
        Class<?> jobClass = getJobEntityClass(job);
        if (!appliedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass)) {
            throw new RuntimeException("No application found to withdraw");
        }

        appliedJobRepository.deleteByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass);
    }

    /**
     * Get current application status
     * Returns applied=false if not applied
     * Returns applied=true with status if applied
     */
    public AppliedStatusDTO getJobStatus(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
        Class<?> jobClass = getJobEntityClass(job);
        Optional<AppliedJob> appliedJob = appliedJobRepository.findByUserIdAndJobIdAndJobType(user.getId(), jobId, jobClass);

        if (appliedJob.isPresent()) {
            return AppliedStatusDTO.builder()
                    .applied(true)
                    .status(appliedJob.get().getStatus().name())
                    .build();
        }

        return AppliedStatusDTO.builder()
                .applied(false)
                .build();
    }

    /**
     * Get all applied jobs with optional status filter
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "appliedJobs", key = "#user.id + '-' + #pageable.pageNumber + '-' + (#statuses != null ? #statuses.toString() : 'all')")
    public Page<JobDTO> getAppliedJobs(List<AppliedJob.ApplicationStatus> statuses,
                                       Pageable pageable, User user) {
        Page<AppliedJob> appliedJobs;

        if (statuses != null && !statuses.isEmpty()) {
            appliedJobs = appliedJobRepository.findByUserIdAndStatusIn(user.getId(), statuses, pageable);
        } else {
            appliedJobs = appliedJobRepository.findByUserIdOrderByAppliedAtDesc(user.getId(), pageable);
        }

        List<JobDTO> dtoList = appliedJobs.getContent().stream()
                .map(appliedJob -> {
                    JobDTO dto = JobDTO.fromEntity(appliedJob.getJob());
                    if (dto == null) return null;

                    dto.setIsApplied(true);
                    dto.setApplicationStatus(appliedJob.getStatus().name());
                    dto.setAppliedAt(appliedJob.getAppliedAt());

                    Class<?> jobClass = getJobEntityClass(appliedJob.getJob());
                    dto.setIsSaved(savedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), appliedJob.getJob().getId(), jobClass));
                    return dto;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, appliedJobs.getTotalElements());
    }

    // ================== USER STATISTICS ==================

    @Cacheable(value = "userStats", key = "#user.id")
    public UserStatsDTO getUserStats(User user) {
        long totalSaved = savedJobRepository.countByUserId(user.getId());
        long totalApplied = appliedJobRepository.countByUserId(user.getId());

        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
        long savedThisWeek = savedJobRepository.countByUserIdAndSavedAtAfter(user.getId(), weekAgo);
        long appliedThisWeek = appliedJobRepository.countByUserIdAndAppliedAtAfter(user.getId(), weekAgo);

        Map<String, Long> statusBreakdown = new HashMap<>();
        for (AppliedJob.ApplicationStatus status : AppliedJob.ApplicationStatus.values()) {
            long count = appliedJobRepository.countByUserIdAndStatus(user.getId(), status);
            statusBreakdown.put(status.name(), count);
        }

        return UserStatsDTO.builder()
                .totalSaved(totalSaved)
                .totalApplied(totalApplied)
                .applicationStatusBreakdown(statusBreakdown)
                .recentActivity(UserStatsDTO.RecentActivityDTO.builder()
                        .savedThisWeek(savedThisWeek)
                        .appliedThisWeek(appliedThisWeek)
                        .build())
                .build();
    }

    // ================== HELPER METHODS ==================

    private Page<JobDTO> enrichJobsWithUserData(Page<? extends BaseJob> jobs, User user) {
        List<JobDTO> dtoList = jobs.getContent().stream()
                .map(job -> enrichJobWithUserData(job, user))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return new PageImpl<>(dtoList, jobs.getPageable(), jobs.getTotalElements());
    }

    private JobDTO enrichJobWithUserData(BaseJob job, User user) {
        JobDTO dto = JobDTO.fromEntity(job);
        if (dto == null) return null;

        if (user != null) {
            Class<?> jobClass = getJobEntityClass(job);
            dto.setIsSaved(savedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), job.getId(), jobClass));
            dto.setIsApplied(appliedJobRepository.existsByUserIdAndJobIdAndJobType(user.getId(), job.getId(), jobClass));

            if (dto.getIsApplied()) {
                appliedJobRepository.findByUserIdAndJobIdAndJobType(user.getId(), job.getId(), jobClass)
                        .ifPresent(applied -> {
                            dto.setApplicationStatus(applied.getStatus().name());
                            dto.setAppliedAt(applied.getAppliedAt());
                        });
            }

            List<String> preferredCompanies = preferenceService.getUserPreferredCompanies(user.getId());
            dto.setIsFollowed(preferredCompanies.contains(job.getCompany().trim()));
        }

        return dto;
    }
}
