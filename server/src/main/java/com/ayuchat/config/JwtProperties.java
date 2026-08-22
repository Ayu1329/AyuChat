package com.ayuchat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ayuchat.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpiresSeconds,
        long refreshTokenExpiresSeconds) {}
