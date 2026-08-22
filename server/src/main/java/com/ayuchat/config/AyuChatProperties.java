package com.ayuchat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ayuchat")
public record AyuChatProperties(long verifyTokenExpiresSeconds) {}
