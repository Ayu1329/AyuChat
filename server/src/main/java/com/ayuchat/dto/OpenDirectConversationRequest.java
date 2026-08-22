package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;

public record OpenDirectConversationRequest(@NotBlank String peer_id) {}
