package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SmsVerifyRequest(
        @NotBlank @Pattern(regexp = "\\+86") String country_code,
        @NotBlank String phone,
        @NotBlank @Pattern(regexp = "register|reset_password") String scene,
        @NotBlank @Size(min = 6, max = 6) String code) {}
