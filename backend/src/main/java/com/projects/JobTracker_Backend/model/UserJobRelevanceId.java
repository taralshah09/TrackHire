package com.projects.JobTracker_Backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserJobRelevanceId implements Serializable {
    private Long userId;
    private Long jobId;
}
