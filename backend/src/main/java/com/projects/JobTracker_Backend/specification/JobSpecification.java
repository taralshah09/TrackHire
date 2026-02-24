package com.projects.JobTracker_Backend.specification;

import com.projects.JobTracker_Backend.model.Job;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class JobSpecification {

    public static <T> Specification<T> filterJobs(
            List<String> keywords,
            List<?> categories,
            List<String> locations,
            List<?> employmentTypes,
            List<?> experienceLevels,
            Boolean isRemote,
            Integer minSalary,
            Integer maxSalary,
            List<String> companies,
            List<?> sources,
            List<String> positions,
            List<String> skills
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter active jobs
            predicates.add(criteriaBuilder.isTrue(root.get("isActive")));

            // Keywords (OR within keywords, searches title, description, company)
            if (keywords != null && !keywords.isEmpty()) {
                List<Predicate> keywordPredicates = new ArrayList<>();
                for (String keyword : keywords) {
                    String likePattern = "%" + keyword.toLowerCase() + "%";
                    Predicate titleMatch = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("title")), likePattern);
                    Predicate descMatch = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("description")), likePattern);
                    Predicate companyMatch = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("company")), likePattern);

                    keywordPredicates.add(criteriaBuilder.or(titleMatch, descMatch, companyMatch));
                }
                predicates.add(criteriaBuilder.or(keywordPredicates.toArray(new Predicate[0])));
            }

            // Categories (OR within categories)
            if (categories != null && !categories.isEmpty()) {
                predicates.add(root.get("jobCategory").in(categories));
            }

            // Locations (OR within locations, case-insensitive partial match)
            if (locations != null && !locations.isEmpty()) {
                List<Predicate> locationPredicates = new ArrayList<>();
                for (String location : locations) {
                    locationPredicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("location")),
                            "%" + location.toLowerCase() + "%"));
                }
                predicates.add(criteriaBuilder.or(locationPredicates.toArray(new Predicate[0])));
            }

            // Employment Types (OR within employment types)
            if (employmentTypes != null && !employmentTypes.isEmpty()) {
                predicates.add(root.get("employmentType").in(employmentTypes));
            }

            // Experience Levels (OR within experience levels)
            if (experienceLevels != null && !experienceLevels.isEmpty()) {
                predicates.add(root.get("experienceLevel").in(experienceLevels));
            }

            // Remote filter
            if (isRemote != null) {
                predicates.add(criteriaBuilder.equal(root.get("isRemote"), isRemote));
            }

            // Salary filters
            if (minSalary != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("maxSalary"), minSalary));
            }
            if (maxSalary != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("minSalary"), maxSalary));
            }

            // Companies (OR within companies, case-insensitive partial match)
            if (companies != null && !companies.isEmpty()) {
                List<Predicate> companyPredicates = new ArrayList<>();
                for (String company : companies) {
                    companyPredicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("company")),
                            "%" + company.toLowerCase() + "%"));
                }
                predicates.add(criteriaBuilder.or(companyPredicates.toArray(new Predicate[0])));
            }

            // Sources (OR within sources)
            if (sources != null && !sources.isEmpty()) {
                predicates.add(root.get("source").in(sources));
            }

            // Positions (OR within positions)
            if (positions != null && !positions.isEmpty()) {
                List<Predicate> positionPredicates = new ArrayList<>();
                for (String position : positions) {
                    positionPredicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("title")),
                            "%" + position.trim().toLowerCase() + "%"));
                }
                predicates.add(criteriaBuilder.or(positionPredicates.toArray(new Predicate[0])));
            }

            // Skills (OR within skills)
            if (skills != null && !skills.isEmpty()) {
                List<Predicate> skillPredicates = new ArrayList<>();
                for (String skill : skills) {
                    String likePattern = "%" + skill.trim().toLowerCase() + "%";
                    Predicate titleMatch = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("title")), likePattern);
                    Predicate descMatch = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("description")), likePattern);
                    skillPredicates.add(criteriaBuilder.or(titleMatch, descMatch));
                }
                predicates.add(criteriaBuilder.or(skillPredicates.toArray(new Predicate[0])));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}