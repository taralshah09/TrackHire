package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.JobPreferencesDTO;
import com.projects.JobTracker_Backend.dto.SaveJobPreferencesRequest;
import com.projects.JobTracker_Backend.service.JobPreferencesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
@Slf4j
public class JobPreferencesController {

    private final JobPreferencesService jobPreferencesService;

    /**
     * GET /api/preferences/{userId}
     * Returns the user's saved email/job preferences.
     * Creates a default empty response if none exist yet.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<JobPreferencesDTO> getPreferences(@PathVariable Long userId) {
        JobPreferencesDTO dto = jobPreferencesService.getPreferences(userId);
        return ResponseEntity.ok(dto);
    }

    /**
     * PUT /api/preferences/{userId}
     * Creates or fully replaces the user's job preferences.
     * Idempotent — safe to call multiple times.
     */
    @PutMapping("/{userId}")
    public ResponseEntity<JobPreferencesDTO> savePreferences(
            @PathVariable Long userId,
            @RequestBody SaveJobPreferencesRequest request) {
        log.info(">>> PUT /api/preferences/{} — request: titles={}, skills={}, roleTypes={}, emailEnabled={}",
                userId, request.getJobTitles(), request.getSkills(), request.getRoleTypes(), request.getEmailEnabled());
        JobPreferencesDTO dto = jobPreferencesService.savePreferences(userId, request);
        log.info("<<< PUT /api/preferences/{} — saved OK: titles={}, skills={}, roleTypes={}",
                userId, dto.getJobTitles(), dto.getSkills(), dto.getRoleTypes());
        return ResponseEntity.ok(dto);
    }
}
