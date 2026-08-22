package com.ayuchat.dto;

import java.util.List;

public record MessageListResponse(List<MessageDto> items, boolean has_more) {}
