package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SendMessageRequest(
        @NotBlank String type,
        @NotNull Map<String, Object> content,
        @NotBlank String client_msg_id) {}
