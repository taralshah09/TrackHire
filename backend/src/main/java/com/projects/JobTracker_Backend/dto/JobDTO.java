package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.model.BaseJob;
import com.projects.JobTracker_Backend.model.FulltimeJobs;
import com.projects.JobTracker_Backend.model.InternJobs;
import com.projects.JobTracker_Backend.model.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.Hibernate;

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
    private String countryCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User-specific fields (populated when user is authenticated)
    private Boolean isSaved;
    private Boolean isApplied;
    private String applicationStatus;
    private LocalDateTime appliedAt;
    private Boolean isFollowed;



public static JobDTO fromEntity(BaseJob baseJob) {
    if (baseJob == null) return null;

    // Unwrap Hibernate proxy before instanceof checks
    BaseJob unproxied = (BaseJob) Hibernate.unproxy(baseJob);

    if (unproxied instanceof Job) {
        return fromEntity((Job) unproxied);
    } else if (unproxied instanceof InternJobs) {
        return fromEntity((InternJobs) unproxied);
    } else if (unproxied instanceof FulltimeJobs) {
        return fromEntity((FulltimeJobs) unproxied);
    }

    throw new IllegalArgumentException("Unknown job type: " + unproxied.getClass());
    }
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
                .countryCode(job.getCountryCode())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .isSaved(false)
                .isApplied(false)
                .isFollowed(false)
                .build();
    }

    public static JobDTO fromEntity(InternJobs job) {
        return JobDTO.builder()
                .id(job.getId())
                .externalId(job.getExternalId())
                .jobCategory(job.getJobCategory() != null ? Job.JobCategory.valueOf(job.getJobCategory().name()) : null)
                .source(job.getSource() != null ? Job.Source.valueOf(job.getSource().name()) : null)
                .company(job.getCompany())
                .companyLogo(job.getCompanyLogo())
                .title(job.getTitle())
                .location(job.getLocation())
                .department(job.getDepartment())
                .employmentType(job.getEmploymentType() != null ? Job.EmploymentType.valueOf(job.getEmploymentType().name()) : null)
                .description(job.getDescription())
                .applyUrl(job.getApplyUrl())
                .postedAt(job.getPostedAt())
                .isRemote(job.getIsRemote())
                .experienceLevel(job.getExperienceLevel() != null ? Job.ExperienceLevel.valueOf(job.getExperienceLevel().name()) : null)
                .minSalary(job.getMinSalary())
                .maxSalary(job.getMaxSalary())
                .isActive(job.getIsActive())
                .countryCode(job.getCountryCode())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .isSaved(false)
                .isApplied(false)
                .isFollowed(false)
                .build();
    }

    public static JobDTO fromEntity(FulltimeJobs job) {
        return JobDTO.builder()
                .id(job.getId())
                .externalId(job.getExternalId())
                .jobCategory(job.getJobCategory() != null ? Job.JobCategory.valueOf(job.getJobCategory().name()) : null)
                .source(job.getSource() != null ? Job.Source.valueOf(job.getSource().name()) : null)
                .company(job.getCompany())
                .companyLogo(job.getCompanyLogo())
                .title(job.getTitle())
                .location(job.getLocation())
                .department(job.getDepartment())
                .employmentType(job.getEmploymentType() != null ? Job.EmploymentType.valueOf(job.getEmploymentType().name()) : null)
                .description(job.getDescription())
                .applyUrl(job.getApplyUrl())
                .postedAt(job.getPostedAt())
                .isRemote(job.getIsRemote())
                .experienceLevel(job.getExperienceLevel() != null ? Job.ExperienceLevel.valueOf(job.getExperienceLevel().name()) : null)
                .minSalary(job.getMinSalary())
                .maxSalary(job.getMaxSalary())
                .isActive(job.getIsActive())
                .countryCode(job.getCountryCode())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .isSaved(false)
                .isApplied(false)
                .isFollowed(false)
                .build();
    }
}