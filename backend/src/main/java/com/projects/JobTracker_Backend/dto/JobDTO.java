package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.model.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private Long id;
    private String externalId;
    private Job.JobCategory jobCategory;
    private Job.Source source;
    private String company;
    private String companyLogo;
    private String title;
    private String location;
    private String department;
    private Job.EmploymentType employmentType;
    private String description;
    private String applyUrl;
    private LocalDateTime postedAt;
    private Boolean isRemote;
    private Job.ExperienceLevel experienceLevel;
    private Integer minSalary;
    private Integer maxSalary;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User-specific fields (populated when user is authenticated)
    private Boolean isSaved;
    private Boolean isApplied;
    private String applicationStatus;
    private LocalDateTime appliedAt;

    public static JobDTO fromEntity(Job job) {
        return JobDTO.builder()
                .id(job.getId())
                .externalId(job.getExternalId())
                .jobCategory(job.getJobCategory())
                .source(job.getSource())
                .company(job.getCompany())
                .companyLogo(job.getCompanyLogo())
                .title(job.getTitle())
                .location(job.getLocation())
                .department(job.getDepartment())
                .employmentType(job.getEmploymentType())
                .description(job.getDescription())
                .applyUrl(job.getApplyUrl())
                .postedAt(job.getPostedAt())
                .isRemote(job.getIsRemote())
                .experienceLevel(job.getExperienceLevel())
                .minSalary(job.getMinSalary())
                .maxSalary(job.getMaxSalary())
                .isActive(job.getIsActive())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .isSaved(false)
                .isApplied(false)
                .build();
    }
}