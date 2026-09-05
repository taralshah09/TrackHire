package com.projects.JobTracker_Backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/** Finishes a brand-new Google signup once the person has picked a username. */
@Getter
@Setter
public class GoogleCompleteDTO {

    @NotBlank(message = "Sign-in session is required")
    private String signupToken;

    @NotBlank(message = "Username is required")
    private String username;
}
