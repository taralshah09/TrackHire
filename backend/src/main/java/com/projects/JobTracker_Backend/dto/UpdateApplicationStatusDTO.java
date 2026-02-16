package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.model.AppliedJob;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateApplicationStatusDTO {
    @NotNull(message = "Status is required")
    private AppliedJob.ApplicationStatus status;
}