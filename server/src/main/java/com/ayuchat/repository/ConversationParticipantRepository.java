package com.ayuchat.repository;

import com.ayuchat.domain.ConversationParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipant, String> {

    List<ConversationParticipant> findByUserId(String userId);

    Optional<ConversationParticipant> findByConversationIdAndUserId(
            String conversationId, String userId);
}
