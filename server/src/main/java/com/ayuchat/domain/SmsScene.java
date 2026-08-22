package com.ayuchat.domain;

public enum SmsScene {
    REGISTER,
    RESET_PASSWORD;

    public static SmsScene fromApiValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("scene is required");
        }
        switch (value) {
            case "register":
                return REGISTER;
            case "reset_password":
                return RESET_PASSWORD;
            default:
                throw new IllegalArgumentException("INVALID_SCENE");
        }
    }

    public String toApiValue() {
        return switch (this) {
            case REGISTER -> "register";
            case RESET_PASSWORD -> "reset_password";
        };
    }
}
