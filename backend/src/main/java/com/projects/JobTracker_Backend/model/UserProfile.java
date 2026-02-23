package com.projects.JobTracker_Backend.model;

import com.projects.JobTracker_Backend.enums.WorkType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.Set;

@Entity
@Setter
@Getter
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    private String name;
    private String profilePictureUrl;
    private Integer yearsOfExperience;
    private String currentLocation;

    @ElementCollection(targetClass = WorkType.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_work_types", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "work_type")
    @Enumerated(EnumType.STRING)
    private Set<WorkType> openToWorkTypes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill")
    private Set<String> skills;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_locations", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "location")
    private Set<String> openToLocations;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_social_links", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "platform")
    @Column(name = "url")
    private Map<String, String> socialProfileLinks;
}
