package com.projects.JobTracker_Backend.repository;

import com.projects.JobTracker_Backend.model.UserPreferredCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface UserPreferredCompanyRepository extends JpaRepository<UserPreferredCompany, Long> {
    List<UserPreferredCompany> findByUserId(Long userId);
    
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}
