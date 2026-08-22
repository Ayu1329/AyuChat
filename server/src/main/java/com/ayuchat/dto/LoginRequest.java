package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String country_code,
        @NotBlank String phone,
        @NotBlank String password) {}
