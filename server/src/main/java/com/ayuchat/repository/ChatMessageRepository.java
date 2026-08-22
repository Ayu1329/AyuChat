package com.ayuchat.repository;

import com.ayuchat.domain.ChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    Optional<ChatMessage> findByConversationIdAndClientMsgId(
            String conversationId, String clientMsgId);

    Optional<ChatMessage> findTopByConversationIdOrderBySeqDesc(String conversationId);

    @Query(
            "SELECT m FROM ChatMessage m WHERE m.conversationId = :conversationId"
                    + " ORDER BY m.seq ASC")
    List<ChatMessage> findByConversationIdOrderBySeqAsc(
            @Param("conversationId") String conversationId);

    List<ChatMessage> findByConversationIdAndSeqGreaterThanOrderBySeqAsc(
            String conversationId, long afterSeq, Pageable pageable);

    List<ChatMessage> findByConversationIdAndSeqLessThanOrderBySeqDesc(
            String conversationId, long beforeSeq, Pageable pageable);

    @Query(
            value =
                    "SELECT COALESCE(MAX(seq), 0) FROM chat_messages WHERE conversation_id ="
                            + " :conversationId",
            nativeQuery = true)
    long maxSeq(@Param("conversationId") String conversationId);
}
