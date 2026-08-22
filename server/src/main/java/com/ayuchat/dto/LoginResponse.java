package com.ayuchat.dto;

public record LoginResponse(
        String access_token,
        long expires_in,
        String refresh_token,
        UserDto user) {}
