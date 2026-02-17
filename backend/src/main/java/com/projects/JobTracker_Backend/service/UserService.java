package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.dto.CreateUserRequest;
import com.projects.JobTracker_Backend.dto.UpdateUserRequest;
import com.projects.JobTracker_Backend.dto.UserDTO;

import java.util.List;

public interface UserService {

    UserDTO getUserById(Long id);

    UserDTO getUserByUsername(String username);

    List<UserDTO> getAllUsers();

    UserDTO createUser(CreateUserRequest request);

    UserDTO updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);
}
