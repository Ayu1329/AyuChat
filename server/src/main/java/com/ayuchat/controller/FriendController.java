package com.ayuchat.controller;

import com.ayuchat.dto.AcceptFriendResponse;
import com.ayuchat.dto.FriendListResponse;
import com.ayuchat.dto.FriendRequestListResponse;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.SendFriendRequest;
import com.ayuchat.dto.SendFriendRequestResponse;
import com.ayuchat.dto.UserSummaryDto;
import com.ayuchat.service.FriendService;
import com.ayuchat.support.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @PostMapping("/friends/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public SendFriendRequestResponse sendRequest(@Valid @RequestBody SendFriendRequest request) {
        return friendService.sendRequest(
                CurrentUser.requireUserId(),
                request.country_code(),
                request.phone(),
                request.message());
    }

    @GetMapping("/friends/requests/incoming")
    public FriendRequestListResponse listIncoming() {
        return friendService.listIncoming(CurrentUser.requireUserId());
    }

    @PostMapping("/friends/requests/{requestId}/accept")
    public AcceptFriendResponse acceptRequest(@PathVariable String requestId) {
        return friendService.acceptRequest(CurrentUser.requireUserId(), requestId);
    }

    @PostMapping("/friends/requests/{requestId}/reject")
    public OkResponse rejectRequest(@PathVariable String requestId) {
        return friendService.rejectRequest(CurrentUser.requireUserId(), requestId);
    }

    @GetMapping("/friends")
    public FriendListResponse listFriends() {
        return friendService.listFriends(CurrentUser.requireUserId());
    }

    @DeleteMapping("/friends/{friendUserId}")
    public OkResponse removeFriend(@PathVariable String friendUserId) {
        return friendService.removeFriend(CurrentUser.requireUserId(), friendUserId);
    }

    @GetMapping("/users/lookup")
    public UserSummaryDto lookupUser(
            @RequestParam String country_code, @RequestParam String phone) {
        return friendService.lookupUser(country_code, phone);
    }
}
