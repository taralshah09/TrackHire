package com.projects.JobTracker_Backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/** The ID token Google Identity Services hands the browser. */
@Getter
@Setter
public class GoogleSignInDTO {

    @NotBlank(message = "Google credential is required")
    private String credential;
}
