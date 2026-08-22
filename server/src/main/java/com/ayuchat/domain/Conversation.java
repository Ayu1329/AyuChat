package com.ayuchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
        name = "conversations",
        uniqueConstraints =
                @UniqueConstraint(columnNames = {"user_low_id", "user_high_id"})
)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String type = "direct";

    @Column(name = "user_low_id", nullable = false)
    private String userLowId;

    @Column(name = "user_high_id", nullable = false)
    private String userHighId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUserLowId() {
        return userLowId;
    }

    public void setUserLowId(String userLowId) {
        this.userLowId = userLowId;
    }

    public String getUserHighId() {
        return userHighId;
    }

    public void setUserHighId(String userHighId) {
        this.userHighId = userHighId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String peerIdFor(String userId) {
        return userLowId.equals(userId) ? userHighId : userLowId;
    }

    public boolean involves(String userId) {
        return userLowId.equals(userId) || userHighId.equals(userId);
    }
}
