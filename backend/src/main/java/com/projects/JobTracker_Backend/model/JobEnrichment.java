package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_enrichment", indexes = {
        @Index(name = "idx_job_enrichment_job", columnList = "job_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobEnrichment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "enriched_description", columnDefinition = "text")
    private String enrichedDescription;

    @Column(name = "estimated_salary_min", precision = 10, scale = 2)
    private BigDecimal estimatedSalaryMin;

    @Column(name = "estimated_salary_max", precision = 10, scale = 2)
    private BigDecimal estimatedSalaryMax;

    @Column(name = "culture_tags", columnDefinition = "jsonb")
    private String cultureTags;

    @Column(name = "ai_summary", columnDefinition = "text")
    private String aiSummary;

    @UpdateTimestamp
    @Column(name = "enriched_at")
    private LocalDateTime enrichedAt;
}
