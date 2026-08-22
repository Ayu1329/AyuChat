package com.ayuchat.dto;

import java.util.List;

public record ConversationListResponse(List<ConversationDto> items, String next_cursor) {}
