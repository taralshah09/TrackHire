package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.model.UserPreferredCompany;
import com.projects.JobTracker_Backend.repository.UserPreferredCompanyRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final UserPreferredCompanyRepository preferenceRepository;
    private final UserRepository userRepository;
    private final CompanyService companyService;
    private final JdbcTemplate jdbcTemplate;

    public List<String> getUserPreferredCompanies(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .stream()
                .map(UserPreferredCompany::getCompanyName)
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveUserPreferredCompanies(Long userId, List<String> companies) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete existing preferences
        preferenceRepository.deleteByUserId(userId);

        // Filter valid companies and save new ones
        List<UserPreferredCompany> newPreferences = companies.stream()
                .filter(companyService::isValidCompany)
                .distinct()
                .map(companyName -> {
                    UserPreferredCompany pref = new UserPreferredCompany();
                    pref.setUser(user);
                    pref.setCompanyName(companyName.trim());
                    return pref;
                })
                .collect(Collectors.toList());

        preferenceRepository.saveAll(newPreferences);
        triggerRelevanceRebuild(userId);
    }

    private void triggerRelevanceRebuild(Long userId) {
        try {
            jdbcTemplate.queryForObject(
                "SELECT pg_notify('user_relevance_rebuild', ?)",
                String.class,
                "{\"userId\":" + userId + "}"
            );
        } catch (Exception e) {
            log.warn("Failed to notify relevance rebuild for user {}: {}", userId, e.getMessage());
        }
    }
}
