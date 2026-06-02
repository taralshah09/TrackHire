package com.projects.JobTracker_Backend.dto;

import com.projects.JobTracker_Backend.model.JobSkills;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSkillDTO {

    private String skillName;

    public static JobSkillDTO fromEntity(JobSkills skill) {
        return JobSkillDTO.builder()
                .skillName(skill.getSkill())
                .build();
    }
}
