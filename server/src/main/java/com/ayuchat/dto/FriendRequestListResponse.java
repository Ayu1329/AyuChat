package com.ayuchat.dto;

import java.util.List;

public record FriendRequestListResponse(List<FriendRequestDto> items, String next_cursor) {}
