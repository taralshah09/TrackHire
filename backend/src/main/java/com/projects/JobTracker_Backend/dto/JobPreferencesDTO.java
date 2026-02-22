package com.projects.JobTracker_Backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobPreferencesDTO {
    private Long userId;
    private List<String> jobTitles;
    private List<String> skills;
    private List<String> roleTypes;
    private Boolean emailEnabled;
    private LocalDateTime updatedAt;
}
