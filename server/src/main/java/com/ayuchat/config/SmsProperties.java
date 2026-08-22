package com.ayuchat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ayuchat.sms")
public record SmsProperties(
        long codeExpiresSeconds,
        long retryAfterSeconds,
        boolean mockEnabled,
        String mockCode) {

    public SmsProperties {
        if (mockCode == null) {
            mockCode = "123456";
        }
    }
}
