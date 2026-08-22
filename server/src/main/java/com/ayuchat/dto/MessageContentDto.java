package com.ayuchat.dto;

import java.util.Map;

public record MessageContentDto(String text) {

    public static MessageContentDto fromMap(Map<String, Object> content) {
        if (content == null) {
            return new MessageContentDto("");
        }
        Object text = content.get("text");
        return new MessageContentDto(text == null ? "" : String.valueOf(text));
    }
}
