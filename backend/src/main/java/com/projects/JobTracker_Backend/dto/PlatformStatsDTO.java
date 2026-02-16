package com.projects.JobTracker_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDTO {
    private Long totalJobs;
    private Long totalActiveJobs;
    private Long totalCompanies;
    private Map<String, Long> jobsByCategory;
    private Map<String, Long> jobsByEmploymentType;
}