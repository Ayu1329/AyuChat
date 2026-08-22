package com.ayuchat.dto;

import com.ayuchat.domain.ChatMessage;
import java.util.Map;

public record MessageDto(
        String id,
        String conversation_id,
        String sender_id,
        String type,
        Map<String, String> content,
        String client_msg_id,
        long seq,
        String created_at) {

    public static MessageDto from(ChatMessage message) {
        return new MessageDto(
                message.getId(),
                message.getConversationId(),
                message.getSenderId(),
                message.getType(),
                Map.of("text", message.getText()),
                message.getClientMsgId(),
                message.getSeq(),
                message.getCreatedAt().toString());
    }
}
