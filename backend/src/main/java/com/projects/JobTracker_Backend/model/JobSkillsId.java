package com.projects.JobTracker_Backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobSkillsId implements Serializable {
    private Long jobId;
    private String skill;
}
