package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_skills")
@IdClass(JobSkillsId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobSkills {

    @Id
    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Id
    @Column(name = "skill", nullable = false)
    private String skill;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
