package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank String country_code,
        @NotBlank String phone,
        @NotBlank String verify_token,
        @NotBlank String password) {}
