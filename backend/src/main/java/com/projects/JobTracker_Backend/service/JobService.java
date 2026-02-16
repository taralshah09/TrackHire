package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.*;
import com.projects.JobTracker_Backend.model.AppliedJob;
import com.projects.JobTracker_Backend.model.Job;
import com.projects.JobTracker_Backend.model.SavedJob;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.AppliedJobRepository;
import com.projects.JobTracker_Backend.repository.JobRepository;
import com.projects.JobTracker_Backend.repository.SavedJobRepository;
import com.projects.JobTracker_Backend.specification.JobSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
    private final SavedJobRepository savedJobRepository;
    private final AppliedJobRepository appliedJobRepository;

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

        // Clean and filter keywords
        List<String> cleanedKeywords = keywords.stream()
                .map(String::trim)
                .filter(k -> !k.isEmpty())
                .collect(Collectors.toList());

        if (cleanedKeywords.isEmpty()) {
            return getAllJobs(pageable, user);
        }

        // Use specification for multi-keyword search
        Specification<Job> spec = JobSpecification.filterJobs(
                cleanedKeywords, null, null, null, null, null, null, null, null, null
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

        // Use specification for multi-keyword search with category filter
        Specification<Job> spec = JobSpecification.filterJobs(
                cleanedKeywords, List.of(category), null, null, null, null, null, null, null, null
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
            Pageable pageable,
            User user
    ) {
        Specification<Job> spec = JobSpecification.filterJobs(
                keywords, categories, locations, employmentTypes, experienceLevels,
                isRemote, minSalary, maxSalary, companies, sources
        );

        Page<Job> jobs = jobRepository.findAll(spec, pageable);
        return enrichJobsWithUserData(jobs, user);
    }

    // ================== SAVED JOBS ==================

    @Transactional
    public void saveJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        if (savedJobRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new RuntimeException("Job already saved");
        }

        SavedJob savedJob = new SavedJob();
        savedJob.setUser(user);
        savedJob.setJob(job);
        savedJobRepository.save(savedJob);
    }

    @Transactional
    public void unsaveJob(Long jobId, User user) {
        if (!savedJobRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new RuntimeException("Job not saved");
        }

        savedJobRepository.deleteByUserIdAndJobId(user.getId(), jobId);
    }

    public Page<JobDTO> getSavedJobs(Pageable pageable, User user) {
        Page<SavedJob> savedJobs = savedJobRepository.findByUserIdOrderBySavedAtDesc(user.getId(), pageable);
        return savedJobs.map(savedJob -> {
            JobDTO dto = JobDTO.fromEntity(savedJob.getJob());
            dto.setIsSaved(true);
            dto.setIsApplied(appliedJobRepository.existsByUserIdAndJobId(user.getId(), savedJob.getJob().getId()));
            if (dto.getIsApplied()) {
                appliedJobRepository.findByUserIdAndJobId(user.getId(), savedJob.getJob().getId())
                        .ifPresent(applied -> dto.setApplicationStatus(applied.getStatus().name()));
            }
            return dto;
        });
    }

    public SavedStatusDTO isJobSaved(Long jobId, User user) {
        boolean saved = savedJobRepository.existsByUserIdAndJobId(user.getId(), jobId);
        return SavedStatusDTO.builder().saved(saved).build();
    }

    // ================== APPLIED JOBS ==================

    @Transactional
    public void applyToJob(Long jobId, AppliedJob.ApplicationStatus status, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        if (appliedJobRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new RuntimeException("Already applied to this job");
        }

        AppliedJob appliedJob = new AppliedJob();
        appliedJob.setUser(user);
        appliedJob.setJob(job);
        appliedJob.setStatus(status != null ? status : AppliedJob.ApplicationStatus.APPLIED);
        appliedJobRepository.save(appliedJob);
    }

    @Transactional
    public void updateApplicationStatus(Long jobId, AppliedJob.ApplicationStatus status, User user) {
        AppliedJob appliedJob = appliedJobRepository.findByUserIdAndJobId(user.getId(), jobId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        appliedJob.setStatus(status);
        appliedJobRepository.save(appliedJob);
    }

    @Transactional
    public void removeApplication(Long jobId, User user) {
        if (!appliedJobRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new RuntimeException("Application not found");
        }

        appliedJobRepository.deleteByUserIdAndJobId(user.getId(), jobId);
    }

    public Page<JobDTO> getAppliedJobs(List<AppliedJob.ApplicationStatus> statuses,
                                       Pageable pageable, User user) {
        Page<AppliedJob> appliedJobs;

        if (statuses != null && !statuses.isEmpty()) {
            appliedJobs = appliedJobRepository.findByUserIdAndStatusIn(user.getId(), statuses, pageable);
        } else {
            appliedJobs = appliedJobRepository.findByUserIdOrderByAppliedAtDesc(user.getId(), pageable);
        }

        return appliedJobs.map(appliedJob -> {
            JobDTO dto = JobDTO.fromEntity(appliedJob.getJob());
            dto.setIsApplied(true);
            dto.setApplicationStatus(appliedJob.getStatus().name());
            dto.setIsSaved(savedJobRepository.existsByUserIdAndJobId(user.getId(), appliedJob.getJob().getId()));
            return dto;
        });
    }

    public AppliedStatusDTO isJobApplied(Long jobId, User user) {
        Optional<AppliedJob> appliedJob = appliedJobRepository.findByUserIdAndJobId(user.getId(), jobId);

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

    // ================== USER STATISTICS ==================

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

    private Page<JobDTO> enrichJobsWithUserData(Page<Job> jobs, User user) {
        return jobs.map(job -> enrichJobWithUserData(job, user));
    }

    private JobDTO enrichJobWithUserData(Job job, User user) {
        JobDTO dto = JobDTO.fromEntity(job);

        if (user != null) {
            dto.setIsSaved(savedJobRepository.existsByUserIdAndJobId(user.getId(), job.getId()));
            dto.setIsApplied(appliedJobRepository.existsByUserIdAndJobId(user.getId(), job.getId()));

            if (dto.getIsApplied()) {
                appliedJobRepository.findByUserIdAndJobId(user.getId(), job.getId())
                        .ifPresent(applied -> dto.setApplicationStatus(applied.getStatus().name()));
            }
        }

        return dto;
    }
}