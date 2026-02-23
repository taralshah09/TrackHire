package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.JobPreferencesDTO;
import com.projects.JobTracker_Backend.dto.SaveJobPreferencesRequest;
import com.projects.JobTracker_Backend.exception.ResourceNotFoundException;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.model.UserJobPreferences;
import com.projects.JobTracker_Backend.repository.UserJobPreferencesRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class JobPreferencesService {

    private final UserJobPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    /**
     * GET preferences for a user. Returns a default empty preferences object
     * if none exist yet, so the frontend always gets a valid response.
     */
    @Transactional(readOnly = true)
    public JobPreferencesDTO getPreferences(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .map(this::toDTO)
                .orElse(emptyDTO(userId));
    }

    /**
     * Upsert (create or update) preferences for a user.
     * Completely replaces jobTitles and skills arrays on each save.
     */
    @Transactional
    public JobPreferencesDTO savePreferences(Long userId, SaveJobPreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        UserJobPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserJobPreferences p = new UserJobPreferences();
                    p.setUser(user);
                    return p;
                });

        if (request.getJobTitles() != null) {
            prefs.getJobTitles().clear();
            prefs.getJobTitles().addAll(request.getJobTitles());
        }
        if (request.getSkills() != null) {
            prefs.getSkills().clear();
            prefs.getSkills().addAll(request.getSkills());
        }
        if (request.getRoleTypes() != null) {
            prefs.getRoleTypes().clear();
            prefs.getRoleTypes().addAll(request.getRoleTypes());
        }
        if (request.getEmailEnabled() != null) {
            prefs.setEmailEnabled(request.getEmailEnabled());
        }

        UserJobPreferences saved = preferencesRepository.save(prefs);
        return toDTO(saved);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private JobPreferencesDTO toDTO(UserJobPreferences p) {
        return new JobPreferencesDTO(
                p.getUser().getId(),
                new ArrayList<>(p.getJobTitles()),
                new ArrayList<>(p.getSkills()),
                new ArrayList<>(p.getRoleTypes()),
                p.getEmailEnabled(),
                p.getUpdatedAt()
        );
    }

    private JobPreferencesDTO emptyDTO(Long userId) {
        return new JobPreferencesDTO(userId, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), true, null);
    }
}
