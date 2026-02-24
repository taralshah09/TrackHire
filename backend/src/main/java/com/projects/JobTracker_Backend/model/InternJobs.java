package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "intern_jobs", indexes = {
        @Index(name = "idx_category_active_posted", columnList = "job_category, is_active, posted_at"),
        @Index(name = "idx_active_posted", columnList = "is_active, posted_at"),
        @Index(name = "idx_company", columnList = "company"),
        @Index(name = "idx_location", columnList = "location"),
        @Index(name = "idx_employment_type", columnList = "employment_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternJobs implements BaseJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private String externalId; // ID from external API

    @Enumerated(EnumType.STRING)
    @Column(name = "job_category", nullable = false)
    private JobCategory jobCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;

    @Column(nullable = false)
    private String company;

    @Column(name = "company_logo")
    private String companyLogo;

    @Column(nullable = false, length = 500)
    private String title;

    private String location;

    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type")
    private EmploymentType employmentType;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "apply_url", nullable = false, length = 2048)
    private String applyUrl;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "is_remote")
    private Boolean isRemote = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private ExperienceLevel experienceLevel;

    @Column(name = "min_salary")
    private Integer minSalary = 0;

    @Column(name = "max_salary")
    private Integer maxSalary = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum JobCategory {
        DISCOVER,
        STARTUP_LAUNCHPAD
    }

    public enum Source {
        ADZUNA,
        SKILLCAREERHUB,
        LINKEDIN,
        INDEED,
        COMPANY_WEBSITE,
        GLASSDOOR,
        OTHER
    }

    public enum EmploymentType {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        INTERNSHIP,
        TEMPORARY,
        FREELANCE
    }

    public enum ExperienceLevel {
        ENTRY,
        JUNIOR,
        MID,
        SENIOR,
        LEAD,
        EXECUTIVE
    }
}