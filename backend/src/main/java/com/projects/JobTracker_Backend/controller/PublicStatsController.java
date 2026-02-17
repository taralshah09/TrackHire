package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.PlatformStatsDTO;
import com.projects.JobTracker_Backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@CrossOrigin("http://localhost:5173")
public class PublicStatsController {

    private final JobService jobService;

    /**
     * GET /api/public/stats
     * Get platform statistics for landing page
     */
    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsDTO> getPlatformStats() {
        PlatformStatsDTO stats = jobService.getPlatformStats();
        return ResponseEntity.ok(stats);
    }
}