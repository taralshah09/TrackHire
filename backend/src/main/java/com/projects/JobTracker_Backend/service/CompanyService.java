package com.projects.JobTracker_Backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projects.JobTracker_Backend.dto.CompanyDTO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
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
            ClassPathResource resource = new ClassPathResource("available_companies.json");
            if (resource.exists()) {
                log.info("Loading companies from classpath: {}", resource.getPath());
                try (InputStream inputStream = resource.getInputStream()) {
                    List<CompanyDTO> dtos = objectMapper.readValue(inputStream, new TypeReference<List<CompanyDTO>>() {
                    });
                    if (dtos != null) {
                        availableCompanies = dtos.stream()
                                .filter(d -> d != null && d.getCompany() != null)
                                .map(CompanyDTO::getCompany)
                                .map(String::trim)
                                .distinct()
                                .sorted()
                                .collect(Collectors.toList());
                        log.info("Successfully loaded {} unique companies from classpath", availableCompanies.size());
                    }
                }
            } else {
                log.error("available_companies.json NOT FOUND in classpath resources.");
            }
        } catch (Exception e) {
            log.error("FATAL ERROR loading available_companies.json from classpath: {}", e.getMessage(), e);
        }
    }

    public List<String> getAvailableCompanies() {
        return availableCompanies != null ? availableCompanies : new ArrayList<>();
    }

    public boolean isValidCompany(String companyName) {
        if (companyName == null)
            return false;
        return availableCompanies.contains(companyName.trim());
    }
}
