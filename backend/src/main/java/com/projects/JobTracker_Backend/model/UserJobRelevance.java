package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_job_relevance", indexes = {
        @Index(name = "idx_user_job_rel_user", columnList = "user_id"),
        @Index(name = "idx_user_job_rel_job", columnList = "job_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserJobRelevance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "relevance_score", precision = 5, scale = 2)
    private BigDecimal relevanceScore;

    @Column(name = "match_details", columnDefinition = "jsonb")
    private String matchDetails;

    @UpdateTimestamp
    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;
}
