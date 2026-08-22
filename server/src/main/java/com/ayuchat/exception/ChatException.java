package com.ayuchat.exception;

import com.ayuchat.domain.ChatErrorCode;

public class ChatException extends RuntimeException {

    private final ChatErrorCode code;

    public ChatException(ChatErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ChatErrorCode getCode() {
        return code;
    }
}
