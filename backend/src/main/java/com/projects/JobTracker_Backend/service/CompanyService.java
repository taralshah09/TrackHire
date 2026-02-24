package com.projects.JobTracker_Backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projects.JobTracker_Backend.dto.CompanyDTO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CompanyService {

    private List<String> availableCompanies = new ArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        loadCompanies();
    }

    private void loadCompanies() {
        try {
            // available_companies.json is in the root directory relative to where the backend runs
            // In development, the root is usually d:\JobTracker
            File file = new File("../available_companies.json");
            if (!file.exists()) {
                log.warn("available_companies.json not found at {}, checking absolute path", file.getAbsolutePath());
                file = new File("d:/JobTracker/available_companies.json");
            }

            if (file.exists()) {
                log.info("Loading companies from: {}", file.getAbsolutePath());
                List<CompanyDTO> dtos = objectMapper.readValue(file, new TypeReference<List<CompanyDTO>>() {});
                if (dtos != null) {
                    availableCompanies = dtos.stream()
                            .filter(d -> d != null && d.getCompany() != null)
                            .map(CompanyDTO::getCompany)
                            .map(String::trim)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());
                    log.info("Successfully loaded {} unique companies", availableCompanies.size());
                }
            } else {
                log.error("available_companies.json NOT FOUND at expected locations. Paths checked: ../available_companies.json and d:/JobTracker/available_companies.json");
            }
        } catch (Exception e) {
            log.error("FATAL ERROR loading available_companies.json: {}", e.getMessage(), e);
        }
    }

    public List<String> getAvailableCompanies() {
        return availableCompanies != null ? availableCompanies : new ArrayList<>();
    }

    public boolean isValidCompany(String companyName) {
        return availableCompanies.contains(companyName.trim());
    }
}
