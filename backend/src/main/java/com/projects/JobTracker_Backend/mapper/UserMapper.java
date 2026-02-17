package com.projects.JobTracker_Backend.mapper;

import com.projects.JobTracker_Backend.dto.UserDTO;
import com.projects.JobTracker_Backend.dto.UserProfileDTO;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.model.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setPhoneVerified(user.getPhoneVerified());
        dto.setAccountEnabled(user.getAccountEnabled());
        dto.setAccountLocked(user.getAccountLocked());
        dto.setAuthProvider(user.getAuthProvider());
        dto.setRole(user.getRole());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getProfile() != null) {
            dto.setProfile(toProfileDTO(user.getProfile()));
        }

        return dto;
    }

    public UserProfileDTO toProfileDTO(UserProfile profile) {
        if (profile == null) {
            return null;
        }

        UserProfileDTO dto = new UserProfileDTO();
        dto.setName(profile.getName());
        dto.setProfilePictureUrl(profile.getProfilePictureUrl());
        dto.setYearsOfExperience(profile.getYearsOfExperience());
        dto.setCurrentLocation(profile.getCurrentLocation());
        dto.setOpenToWorkTypes(profile.getOpenToWorkTypes());
        dto.setSkills(profile.getSkills());
        dto.setOpenToLocations(profile.getOpenToLocations());
        dto.setSocialProfileLinks(profile.getSocialProfileLinks());

        return dto;
    }

    public UserProfile toProfileEntity(UserProfileDTO dto, User user) {
        if (dto == null) {
            return null;
        }

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setName(dto.getName());
        profile.setProfilePictureUrl(dto.getProfilePictureUrl());
        profile.setYearsOfExperience(dto.getYearsOfExperience());
        profile.setCurrentLocation(dto.getCurrentLocation());
        profile.setOpenToWorkTypes(dto.getOpenToWorkTypes());
        profile.setSkills(dto.getSkills());
        profile.setOpenToLocations(dto.getOpenToLocations());
        profile.setSocialProfileLinks(dto.getSocialProfileLinks());

        return profile;
    }

    public void updateProfileFromDTO(UserProfile profile, UserProfileDTO dto) {
        if (dto == null || profile == null) {
            return;
        }

        if (dto.getName() != null) {
            profile.setName(dto.getName());
        }
        if (dto.getProfilePictureUrl() != null) {
            profile.setProfilePictureUrl(dto.getProfilePictureUrl());
        }
        if (dto.getYearsOfExperience() != null) {
            profile.setYearsOfExperience(dto.getYearsOfExperience());
        }
        if (dto.getCurrentLocation() != null) {
            profile.setCurrentLocation(dto.getCurrentLocation());
        }
        if (dto.getOpenToWorkTypes() != null) {
            profile.setOpenToWorkTypes(dto.getOpenToWorkTypes());
        }
        if (dto.getSkills() != null) {
            profile.setSkills(dto.getSkills());
        }
        if (dto.getOpenToLocations() != null) {
            profile.setOpenToLocations(dto.getOpenToLocations());
        }
        if (dto.getSocialProfileLinks() != null) {
            profile.setSocialProfileLinks(dto.getSocialProfileLinks());
        }
    }
}