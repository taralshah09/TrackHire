package com.projects.JobTracker_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelevanceReasonsDTO {
    private List<String> skillMatches;
    private Boolean companyMatch;
    private String titleMatch;
    private Boolean roleTypeMatch;
    private String freshness;
    private Map<String, Integer> breakdown;
}
