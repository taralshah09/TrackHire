package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.JobDTO;
import com.projects.JobTracker_Backend.dto.PlatformStatsDTO;
import com.projects.JobTracker_Backend.model.Job;
import com.projects.JobTracker_Backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/jobs")
@RequiredArgsConstructor
@CrossOrigin("http://localhost:5173")
public class PublicJobController {

    private final JobService jobService;

    /**
     * GET /api/public/jobs/featured
     * Get 10 featured jobs for landing page
     */
    @GetMapping("/featured")
    public ResponseEntity<Page<JobDTO>> getFeaturedJobs(
            @RequestParam(required = false) Job.JobCategory category
    ) {
        Page<JobDTO> jobs = jobService.getFeaturedJobs(category, 10);
        return ResponseEntity.ok(jobs);
    }
}