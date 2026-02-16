package com.projects.JobTracker_Backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserLoginDTO {
    @NotBlank(message = "Login identifier is required")
    private String loginIdentifier; // can be username, email, or phone

    @NotBlank(message = "Password is required")
    private String password;
}
