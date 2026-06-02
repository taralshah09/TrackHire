package com.projects.JobTracker_Backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projects.JobTracker_Backend.dto.ForYouJobDTO;
import com.projects.JobTracker_Backend.dto.JobDTO;
import com.projects.JobTracker_Backend.dto.RelevanceReasonsDTO;
import com.projects.JobTracker_Backend.model.UserJobRelevance;
import com.projects.JobTracker_Backend.repository.UserJobRelevanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForYouService {

    private static final int FOR_YOU_LIMIT = 50;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final UserJobRelevanceRepository relevanceRepository;

    @Transactional(readOnly = true)
    public List<ForYouJobDTO> getForYouFeed(Long userId) {
        List<UserJobRelevance> entries = relevanceRepository.findTopJobsForUser(
                userId,
                PageRequest.of(0, FOR_YOU_LIMIT)
        );

        return entries.stream()
                .map(this::toForYouJobDTO)
                .collect(Collectors.toList());
    }

    private ForYouJobDTO toForYouJobDTO(UserJobRelevance relevance) {
        return ForYouJobDTO.builder()
                .job(JobDTO.fromEntity(relevance.getJob()))
                .score(relevance.getScore() != null ? relevance.getScore().intValue() : 0)
                .reasons(parseReasons(relevance.getReasons()))
                .build();
    }

    private RelevanceReasonsDTO parseReasons(String reasonsJson) {
        if (reasonsJson == null || reasonsJson.isBlank()) {
            return null;
        }
        try {
            return MAPPER.readValue(reasonsJson, RelevanceReasonsDTO.class);
        } catch (Exception e) {
            log.warn("Failed to parse relevance reasons JSON: {}", e.getMessage());
            return null;
        }
    }
}
