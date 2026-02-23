package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.CreateUserRequest;
import com.projects.JobTracker_Backend.dto.UpdateUserRequest;
import com.projects.JobTracker_Backend.dto.UserDTO;
import com.projects.JobTracker_Backend.exception.DuplicateResourceException;
import com.projects.JobTracker_Backend.exception.ResourceNotFoundException;
import com.projects.JobTracker_Backend.mapper.UserMapper;
import com.projects.JobTracker_Backend.model.User;
import com.projects.JobTracker_Backend.model.UserProfile;
import com.projects.JobTracker_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "'id:' + #id")
    public UserDTO getUserById(Long id) {
        User user = userRepository.findByIdWithProfile(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return userMapper.toDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "users", key = "'username:' + #username")
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsernameWithProfile(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return userMapper.toDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public UserDTO createUser(CreateUserRequest request) {
        // Check for duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        }

        // Check for duplicate email
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        // Check for duplicate phone number
        if (request.getPhoneNumber() != null && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicateResourceException("Phone number already exists: " + request.getPhoneNumber());
        }

        // Create user entity
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Create profile if provided
        if (request.getProfile() != null) {
            UserProfile profile = userMapper.toProfileEntity(request.getProfile(), user);
            user.setProfile(profile);
        }

        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findByIdWithProfile(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Update username if provided and different
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new DuplicateResourceException("Username already exists: " + request.getUsername());
            }
            user.setUsername(request.getUsername());
        }

        // Update email if provided and different
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
            user.setEmailVerified(false); // Reset verification on email change
        }

        // Update phone number if provided and different
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
                throw new DuplicateResourceException("Phone number already exists: " + request.getPhoneNumber());
            }
            user.setPhoneNumber(request.getPhoneNumber());
            user.setPhoneVerified(false); // Reset verification on phone change
        }

        // Update profile if provided
        if (request.getProfile() != null) {
            if (user.getProfile() == null) {
                UserProfile profile = userMapper.toProfileEntity(request.getProfile(), user);
                user.setProfile(profile);
            } else {
                userMapper.updateProfileFromDTO(user.getProfile(), request.getProfile());
            }
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);
        return userMapper.toDTO(updatedUser);
    }

    @Override
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }
}