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
public class UserStatsDTO {
    private Long totalSaved;
    private Long totalApplied;
    private Map<String, Long> applicationStatusBreakdown;
    private RecentActivityDTO recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDTO {
        private Long savedThisWeek;
        private Long appliedThisWeek;
    }
}