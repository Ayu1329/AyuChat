package com.ayuchat.exception;

import com.ayuchat.domain.AuthErrorCode;

public class AuthException extends RuntimeException {

    private final AuthErrorCode code;

    public AuthException(AuthErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public AuthErrorCode getCode() {
        return code;
    }
}
