package com.ayuchat.service;

import com.ayuchat.domain.ChatErrorCode;
import com.ayuchat.domain.ChatMessage;
import com.ayuchat.domain.Conversation;
import com.ayuchat.domain.ConversationParticipant;
import com.ayuchat.domain.User;
import com.ayuchat.dto.ConversationDto;
import com.ayuchat.dto.ConversationListResponse;
import com.ayuchat.dto.MarkConversationReadRequest;
import com.ayuchat.dto.MessageContentDto;
import com.ayuchat.dto.MessageDto;
import com.ayuchat.dto.MessageListResponse;
import com.ayuchat.dto.MessagePreviewDto;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.SendMessageRequest;
import com.ayuchat.dto.SendMessageResult;
import com.ayuchat.exception.ChatException;
import com.ayuchat.ws.WsEventPublisher;
import com.ayuchat.repository.ChatMessageRepository;
import com.ayuchat.repository.ConversationParticipantRepository;
import com.ayuchat.repository.ConversationRepository;
import com.ayuchat.repository.FriendshipRepository;
import com.ayuchat.repository.UserRepository;
import com.ayuchat.support.UserPresentation;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Collections;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {

    private static final int MESSAGE_MAX_LENGTH = 4000;
    private static final int DEFAULT_MESSAGE_LIMIT = 30;
    private static final int MAX_MESSAGE_LIMIT = 100;

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final WsEventPublisher wsEventPublisher;

    public ConversationService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            ChatMessageRepository messageRepository,
            FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            WsEventPublisher wsEventPublisher) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.wsEventPublisher = wsEventPublisher;
    }

    @Transactional(readOnly = true)
    public ConversationListResponse listConversations(String currentUserId) {
        List<ConversationParticipant> memberships =
                participantRepository.findByUserId(currentUserId);

        List<ConversationDto> items = new ArrayList<>();
        for (ConversationParticipant membership : memberships) {
            Conversation conversation =
                    conversationRepository.findById(membership.getConversationId()).orElse(null);
            if (conversation == null) {
                continue;
            }
            items.add(toDto(conversation, membership, currentUserId));
        }

        items.sort(
                Comparator.comparing(
                                (ConversationDto item) -> Instant.parse(item.updated_at()))
                        .reversed());

        return new ConversationListResponse(items, null);
    }

    @Transactional
    public ConversationDto openDirectConversation(String currentUserId, String peerId) {
        if (currentUserId.equals(peerId)) {
            throw new ChatException(ChatErrorCode.CANNOT_ADD_SELF, "不能与自己发起聊天");
        }

        requireUser(peerId);
        requireFriendship(currentUserId, peerId);

        String userLowId = minId(currentUserId, peerId);
        String userHighId = maxId(currentUserId, peerId);

        Conversation conversation =
                conversationRepository
                        .findByUserLowIdAndUserHighId(userLowId, userHighId)
                        .orElseGet(
                                () -> {
                                    Conversation created = new Conversation();
                                    created.setType("direct");
                                    created.setUserLowId(userLowId);
                                    created.setUserHighId(userHighId);
                                    created.setUpdatedAt(Instant.now());
                                    conversationRepository.save(created);

                                    createParticipant(created.getId(), userLowId);
                                    createParticipant(created.getId(), userHighId);
                                    return created;
                                });

        ConversationParticipant membership =
                participantRepository
                        .findByConversationIdAndUserId(conversation.getId(), currentUserId)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.CONVERSATION_NOT_FOUND,
                                                "会话不存在"));

        return toDto(conversation, membership, currentUserId);
    }

    @Transactional
    public OkResponse markRead(
            String currentUserId, String conversationId, MarkConversationReadRequest request) {
        Conversation conversation = requireConversationForUser(conversationId, currentUserId);
        ConversationParticipant membership =
                requireMembership(conversation.getId(), currentUserId);

        long readSeq =
                request != null && request.read_seq() != null
                        ? request.read_seq()
                        : messageRepository.maxSeq(conversation.getId());

        membership.setLastReadSeq(readSeq);
        membership.setUnreadCount(0);
        participantRepository.save(membership);
        return new OkResponse(true);
    }

    @Transactional
    public SendMessageResult sendMessage(
            String currentUserId, String conversationId, SendMessageRequest request) {
        Conversation conversation = requireConversationForUser(conversationId, currentUserId);
        requireFriendship(currentUserId, conversation.peerIdFor(currentUserId));

        Optional<ChatMessage> existing =
                messageRepository.findByConversationIdAndClientMsgId(
                        conversationId, request.client_msg_id());
        if (existing.isPresent()) {
            return new SendMessageResult(MessageDto.from(existing.get()), false);
        }

        if (!"text".equals(request.type())) {
            throw new ChatException(ChatErrorCode.INVALID_MESSAGE_CONTENT, "仅支持文本消息");
        }

        MessageContentDto content = MessageContentDto.fromMap(request.content());
        String text = content.text() == null ? "" : content.text().trim();
        if (text.isEmpty()) {
            throw new ChatException(ChatErrorCode.INVALID_MESSAGE_CONTENT, "消息内容不能为空");
        }
        if (text.length() > MESSAGE_MAX_LENGTH) {
            throw new ChatException(ChatErrorCode.MESSAGE_TOO_LONG, "消息内容过长");
        }

        long nextSeq = messageRepository.maxSeq(conversationId) + 1;
        Instant now = Instant.now();

        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setSenderId(currentUserId);
        message.setType("text");
        message.setText(text);
        message.setClientMsgId(request.client_msg_id());
        message.setSeq(nextSeq);
        message.setCreatedAt(now);
        messageRepository.save(message);

        conversation.setUpdatedAt(now);
        conversationRepository.save(conversation);

        MessageDto messageDto = MessageDto.from(message);

        String peerId = conversation.peerIdFor(currentUserId);
        participantRepository
                .findByConversationIdAndUserId(conversationId, peerId)
                .ifPresent(
                        peerMembership -> {
                            peerMembership.setUnreadCount(peerMembership.getUnreadCount() + 1);
                            participantRepository.save(peerMembership);
                        });

        wsEventPublisher.publishMessageNew(peerId, messageDto);

        return new SendMessageResult(messageDto, true);
    }

    @Transactional(readOnly = true)
    public MessageListResponse listMessages(
            String currentUserId,
            String conversationId,
            Integer limit,
            Long beforeSeq,
            Long afterSeq) {
        requireConversationForUser(conversationId, currentUserId);

        int pageSize = normalizeLimit(limit);

        if (beforeSeq != null && afterSeq != null) {
            throw new ChatException(ChatErrorCode.INVALID_MESSAGE_CONTENT, "不能同时指定 before_seq 与 after_seq");
        }

        if (afterSeq != null) {
            List<ChatMessage> messages =
                    messageRepository.findByConversationIdAndSeqGreaterThanOrderBySeqAsc(
                            conversationId, afterSeq, PageRequest.of(0, pageSize + 1));
            boolean hasMore = messages.size() > pageSize;
            List<ChatMessage> page = hasMore ? messages.subList(0, pageSize) : messages;
            List<MessageDto> items = page.stream().map(MessageDto::from).toList();
            return new MessageListResponse(items, hasMore);
        }

        if (beforeSeq != null) {
            List<ChatMessage> messages =
                    messageRepository.findByConversationIdAndSeqLessThanOrderBySeqDesc(
                            conversationId, beforeSeq, PageRequest.of(0, pageSize + 1));
            boolean hasMore = messages.size() > pageSize;
            List<ChatMessage> page = hasMore ? messages.subList(0, pageSize) : messages;
            Collections.reverse(page);
            List<MessageDto> items = page.stream().map(MessageDto::from).toList();
            return new MessageListResponse(items, hasMore);
        }

        List<ChatMessage> messages =
                messageRepository.findByConversationIdOrderBySeqAsc(conversationId);
        if (messages.size() <= pageSize) {
            List<MessageDto> items = messages.stream().map(MessageDto::from).toList();
            return new MessageListResponse(items, false);
        }

        List<ChatMessage> page = messages.subList(messages.size() - pageSize, messages.size());
        List<MessageDto> items = page.stream().map(MessageDto::from).toList();
        return new MessageListResponse(items, true);
    }

    private static int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_MESSAGE_LIMIT;
        }
        if (limit < 1) {
            return DEFAULT_MESSAGE_LIMIT;
        }
        return Math.min(limit, MAX_MESSAGE_LIMIT);
    }

    private ConversationDto toDto(
            Conversation conversation, ConversationParticipant membership, String currentUserId) {
        User peerUser = requireUser(conversation.peerIdFor(currentUserId));
        MessagePreviewDto lastMessage =
                messageRepository
                        .findTopByConversationIdOrderBySeqDesc(conversation.getId())
                        .map(MessagePreviewDto::from)
                        .orElse(null);

        return new ConversationDto(
                conversation.getId(),
                conversation.getType(),
                UserPresentation.toSummary(peerUser),
                lastMessage,
                membership.getUnreadCount(),
                conversation.getUpdatedAt().toString());
    }

    private Conversation requireConversationForUser(String conversationId, String currentUserId) {
        Conversation conversation =
                conversationRepository
                        .findById(conversationId)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.CONVERSATION_NOT_FOUND,
                                                "会话不存在"));

        if (!conversation.involves(currentUserId)) {
            throw new ChatException(ChatErrorCode.FORBIDDEN, "无权访问该会话");
        }

        return conversation;
    }

    private ConversationParticipant requireMembership(String conversationId, String userId) {
        return participantRepository
                .findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(
                        () ->
                                new ChatException(
                                        ChatErrorCode.FORBIDDEN, "无权访问该会话"));
    }

    private void requireFriendship(String userId, String peerId) {
        if (!friendshipRepository.existsByUserIdAndFriendUserId(userId, peerId)) {
            throw new ChatException(ChatErrorCode.NOT_FRIENDS, "仅好友之间可以发送消息");
        }
    }

    private User requireUser(String userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(
                        () -> new ChatException(ChatErrorCode.USER_NOT_FOUND, "用户不存在"));
    }

    private void createParticipant(String conversationId, String userId) {
        ConversationParticipant participant = new ConversationParticipant();
        participant.setConversationId(conversationId);
        participant.setUserId(userId);
        participant.setUnreadCount(0);
        participant.setLastReadSeq(0);
        participantRepository.save(participant);
    }

    private static String minId(String a, String b) {
        return a.compareTo(b) <= 0 ? a : b;
    }

    private static String maxId(String a, String b) {
        return a.compareTo(b) >= 0 ? a : b;
    }
}
