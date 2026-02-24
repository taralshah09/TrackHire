package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.model.UserPreferredCompany;
import com.projects.JobTracker_Backend.repository.UserPreferredCompanyRepository;
import com.projects.JobTracker_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final UserPreferredCompanyRepository preferenceRepository;
    private final UserRepository userRepository;
    private final CompanyService companyService;

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
    }
}
