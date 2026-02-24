package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavedJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Any(fetch = FetchType.LAZY)
    @AnyDiscriminator(DiscriminatorType.STRING)
    @Column(name = "job_type")
    @AnyDiscriminatorValue(discriminator = "GENERAL", entity = Job.class)
    @AnyDiscriminatorValue(discriminator = "INTERN", entity = InternJobs.class)
    @AnyDiscriminatorValue(discriminator = "FULLTIME", entity = FulltimeJobs.class)
    @AnyKeyJavaClass(Long.class)
    @JoinColumn(name = "job_id", nullable = false)
    private BaseJob job;


    @CreationTimestamp
    private LocalDateTime savedAt;
}