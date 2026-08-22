package com.ayuchat.dto;

public record ConversationDto(
        String id,
        String type,
        UserSummaryDto peer,
        MessagePreviewDto last_message,
        int unread_count,
        String updated_at) {}
