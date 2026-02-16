package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.model.AppliedJob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplyJobRequestDTO {
    private AppliedJob.ApplicationStatus status = AppliedJob.ApplicationStatus.APPLIED;
}