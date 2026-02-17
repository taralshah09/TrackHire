package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.enums.WorkType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String name;
    private String profilePictureUrl;
    private Integer yearsOfExperience;
    private String currentLocation;
    private Set<WorkType> openToWorkTypes;
    private List<String> skills;
    private List<String> openToLocations;
    private Map<String, String> socialProfileLinks;
}