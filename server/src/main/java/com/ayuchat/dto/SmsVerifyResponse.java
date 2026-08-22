package com.ayuchat.dto;

public record SmsVerifyResponse(String verify_token, long expires_in) {}
