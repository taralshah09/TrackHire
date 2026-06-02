package com.projects.JobTracker_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForYouJobDTO {
    private JobDTO job;
    private Integer score;
    private RelevanceReasonsDTO reasons;
}
