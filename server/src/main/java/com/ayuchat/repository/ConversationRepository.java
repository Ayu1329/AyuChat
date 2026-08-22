package com.ayuchat.repository;

import com.ayuchat.domain.Conversation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, String> {

    Optional<Conversation> findByUserLowIdAndUserHighId(String userLowId, String userHighId);
}
