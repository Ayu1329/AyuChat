package com.ayuchat.controller;

import com.ayuchat.dto.ConversationDto;
import com.ayuchat.dto.ConversationListResponse;
import com.ayuchat.dto.MarkConversationReadRequest;
import com.ayuchat.dto.MessageDto;
import com.ayuchat.dto.MessageListResponse;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.OpenDirectConversationRequest;
import com.ayuchat.dto.SendMessageRequest;
import com.ayuchat.dto.SendMessageResult;
import com.ayuchat.service.ConversationService;
import com.ayuchat.support.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping("/conversations")
    public ConversationListResponse listConversations() {
        return conversationService.listConversations(CurrentUser.requireUserId());
    }

    @PostMapping("/conversations/direct")
    @ResponseStatus(HttpStatus.OK)
    public ConversationDto openDirectConversation(
            @Valid @RequestBody OpenDirectConversationRequest request) {
        return conversationService.openDirectConversation(
                CurrentUser.requireUserId(), request.peer_id());
    }

    @PostMapping("/conversations/{conversationId}/read")
    public OkResponse markRead(
            @PathVariable String conversationId,
            @RequestBody(required = false) MarkConversationReadRequest request) {
        return conversationService.markRead(
                CurrentUser.requireUserId(), conversationId, request);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable String conversationId, @Valid @RequestBody SendMessageRequest request) {
        SendMessageResult result =
                conversationService.sendMessage(
                        CurrentUser.requireUserId(), conversationId, request);
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.message());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public MessageListResponse listMessages(
            @PathVariable String conversationId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Long before_seq,
            @RequestParam(required = false) Long after_seq) {
        return conversationService.listMessages(
                CurrentUser.requireUserId(), conversationId, limit, before_seq, after_seq);
    }
}
