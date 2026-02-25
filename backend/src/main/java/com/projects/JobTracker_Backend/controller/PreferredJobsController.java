package com.projects.JobTracker_Backend.controller;

import com.projects.JobTracker_Backend.dto.JobDTO;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.repository.UserRepository;
import com.projects.JobTracker_Backend.service.JobService;
import com.projects.JobTracker_Backend.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/jobs/preferred")
@RequiredArgsConstructor
public class PreferredJobsController {

    private final JobService jobService;
    private final PreferenceService preferenceService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<JobDTO>> getPreferredJobs(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String locations,
            @RequestParam(required = false) String skills,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> preferredCompanies = preferenceService.getUserPreferredCompanies(user.getId());

        Pageable pageable = PageRequest.of(page, size);

        Page<JobDTO> jobs = jobService.getPreferredJobs(
                type, preferredCompanies, 
                position, company, locations, skills,
                pageable, user);
        return ResponseEntity.ok(jobs);
    }
}
