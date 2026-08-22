package com.ayuchat.dto;

import com.ayuchat.domain.ChatMessage;
import java.util.Map;

public record MessagePreviewDto(
        String id,
        String type,
        Map<String, String> content,
        String sender_id,
        String created_at) {

    public static MessagePreviewDto from(ChatMessage message) {
        return new MessagePreviewDto(
                message.getId(),
                message.getType(),
                Map.of("text", message.getText()),
                message.getSenderId(),
                message.getCreatedAt().toString());
    }
}
