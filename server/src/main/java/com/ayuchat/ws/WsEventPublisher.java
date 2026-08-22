package com.ayuchat.ws;

import com.ayuchat.dto.FriendDto;
import com.ayuchat.dto.FriendRequestDto;
import com.ayuchat.dto.MessageDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WsEventPublisher {

    private final WebSocketSessionRegistry registry;
    private final WsEnvelope envelope;
    private final ObjectMapper objectMapper;

    public WsEventPublisher(
            WebSocketSessionRegistry registry,
            WsEnvelope envelope,
            ObjectMapper objectMapper) {
        this.registry = registry;
        this.envelope = envelope;
        this.objectMapper = objectMapper;
    }

    public void publishMessageNew(String userId, MessageDto message) {
        Map<String, Object> payload = Map.of("message", objectMapper.convertValue(message, Map.class));
        registry.sendToUser(userId, envelope.of("message.new", payload));
    }

    public void publishFriendRequest(String userId, FriendRequestDto request) {
        Map<String, Object> payload = Map.of("request", objectMapper.convertValue(request, Map.class));
        registry.sendToUser(userId, envelope.of("friend.request", payload));
    }

    public void publishFriendAccepted(String userId, FriendDto friend) {
        Map<String, Object> payload = Map.of("friend", objectMapper.convertValue(friend, Map.class));
        registry.sendToUser(userId, envelope.of("friend.accepted", payload));
    }

    public void publishFriendDeleted(String userId, String deletedFriendUserId) {
        Map<String, Object> payload = Map.of("user_id", deletedFriendUserId);
        registry.sendToUser(userId, envelope.of("friend.deleted", payload));
    }
}
