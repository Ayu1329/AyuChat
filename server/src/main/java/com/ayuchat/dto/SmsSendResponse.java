package com.ayuchat.dto;

public record SmsSendResponse(boolean ok, int retry_after) {}
