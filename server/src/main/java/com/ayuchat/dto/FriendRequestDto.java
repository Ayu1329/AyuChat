package com.ayuchat.dto;

public record FriendRequestDto(
        String id,
        UserSummaryDto from_user,
        UserSummaryDto to_user,
        String message,
        String status,
        String created_at) {}
