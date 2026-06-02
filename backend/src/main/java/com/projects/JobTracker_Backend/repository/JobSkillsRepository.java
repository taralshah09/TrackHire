package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.JobSkills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobSkillsRepository extends JpaRepository<JobSkills, Long> {

    List<JobSkills> findByJobId(Long jobId);
}
