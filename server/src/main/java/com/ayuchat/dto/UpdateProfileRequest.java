package com.ayuchat.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(@Size(max = 32, message = "昵称不能超过 32 字") String name) {}
