package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_job_relevance",
    indexes = {
        @Index(name = "idx_relevance_user_score", columnList = "user_id, score DESC"),
        @Index(name = "idx_relevance_job",        columnList = "job_id")
    }
)
@IdClass(UserJobRelevanceId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserJobRelevance {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", insertable = false, updatable = false)
    private Job job;

    @Column(name = "score", nullable = false)
    private Short score;

    @Column(name = "reasons", columnDefinition = "jsonb")
    private String reasons;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
