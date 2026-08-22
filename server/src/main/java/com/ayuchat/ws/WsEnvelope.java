package com.ayuchat.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class WsEnvelope {

    private final ObjectMapper objectMapper;

    public WsEnvelope(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String of(String type) {
        return serialize(type, null);
    }

    public String of(String type, Object payload) {
        return serialize(type, payload);
    }

    private String serialize(String type, Object payload) {
        try {
            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("type", type);
            if (payload != null) {
                envelope.put("payload", payload);
            }
            return objectMapper.writeValueAsString(envelope);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize WebSocket envelope", ex);
        }
    }
}
