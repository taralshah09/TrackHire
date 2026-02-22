package com.projects.JobTracker_Backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_job_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserJobPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user this preference row belongs to.
     * Unique constraint mirrors the DB-level UNIQUE on user_id.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Preferred job title keywords — e.g. ["software engineer", "backend developer"].
     * Stored in a separate collection table joined by user_id.
     */
    @ElementCollection
    @CollectionTable(
        name = "user_job_preference_titles",
        joinColumns = @JoinColumn(name = "preference_id")
    )
    @Column(name = "title")
    private List<String> jobTitles = new ArrayList<>();

    /**
     * Preferred skills — e.g. ["Java", "Docker", "AWS"].
     */
    @ElementCollection
    @CollectionTable(
        name = "user_job_preference_skills",
        joinColumns = @JoinColumn(name = "preference_id")
    )
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    /**
     * Desired role types — e.g. ["Intern", "Full-time", "Contract"].
     */
    @ElementCollection
    @CollectionTable(
        name = "user_job_preference_role_types",
        joinColumns = @JoinColumn(name = "preference_id")
    )
    @Column(name = "role_type")
    private List<String> roleTypes = new ArrayList<>();

    /**
     * Whether the user wants to receive email digests.
     * Set to false to unsubscribe without deleting preferences.
     */
    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
