package com.projects.JobTracker_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String refreshToken;
    private String username;
    private String email;
}
