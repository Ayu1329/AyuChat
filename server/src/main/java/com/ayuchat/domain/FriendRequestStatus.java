package com.ayuchat.domain;

public enum FriendRequestStatus {
    PENDING,
    ACCEPTED,
    REJECTED;

    public String toApiValue() {
        return name().toLowerCase();
    }
}
