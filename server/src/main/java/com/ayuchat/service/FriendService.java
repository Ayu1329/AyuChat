package com.ayuchat.service;

import com.ayuchat.domain.ChatErrorCode;
import com.ayuchat.domain.FriendRequest;
import com.ayuchat.domain.FriendRequestStatus;
import com.ayuchat.domain.Friendship;
import com.ayuchat.domain.User;
import com.ayuchat.dto.AcceptFriendResponse;
import com.ayuchat.dto.FriendDto;
import com.ayuchat.dto.FriendListResponse;
import com.ayuchat.dto.FriendRequestDto;
import com.ayuchat.dto.FriendRequestListResponse;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.SendFriendRequestResponse;
import com.ayuchat.dto.UserSummaryDto;
import com.ayuchat.exception.ChatException;
import com.ayuchat.repository.FriendRequestRepository;
import com.ayuchat.repository.FriendshipRepository;
import com.ayuchat.repository.UserRepository;
import com.ayuchat.support.AuthValidation;
import com.ayuchat.support.UserPresentation;
import com.ayuchat.ws.WsEventPublisher;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendService {

    private static final int MESSAGE_MAX_LENGTH = 100;

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final WsEventPublisher wsEventPublisher;

    public FriendService(
            UserRepository userRepository,
            FriendRequestRepository friendRequestRepository,
            FriendshipRepository friendshipRepository,
            WsEventPublisher wsEventPublisher) {
        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
        this.wsEventPublisher = wsEventPublisher;
    }

    @Transactional
    public SendFriendRequestResponse sendRequest(
            String currentUserId, String countryCode, String phone, String message) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);
        String normalizedMessage = normalizeMessage(message);

        User currentUser = requireUser(currentUserId);
        User target =
                userRepository
                        .findByCountryCodeAndPhone(cc, normalizedPhone)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.USER_NOT_FOUND, "用户不存在"));

        if (target.getId().equals(currentUserId)) {
            throw new ChatException(ChatErrorCode.CANNOT_ADD_SELF, "不能添加自己为好友");
        }

        if (friendshipRepository.existsByUserIdAndFriendUserId(currentUserId, target.getId())) {
            throw new ChatException(ChatErrorCode.ALREADY_FRIENDS, "你们已经是好友了");
        }

        var existingOutgoing =
                friendRequestRepository.findByFromUserIdAndToUserIdAndStatus(
                        currentUserId, target.getId(), FriendRequestStatus.PENDING);
        if (existingOutgoing.isPresent()) {
            return new SendFriendRequestResponse(
                    toDto(existingOutgoing.get(), currentUser, target));
        }

        if (friendRequestRepository.existsByToUserIdAndFromUserIdAndStatus(
                target.getId(), currentUserId, FriendRequestStatus.PENDING)) {
            throw new ChatException(
                    ChatErrorCode.FRIEND_REQUEST_PENDING, "对方已向你发送好友申请，请在会话列表中处理");
        }

        FriendRequest request = new FriendRequest();
        request.setFromUserId(currentUserId);
        request.setToUserId(target.getId());
        request.setMessage(normalizedMessage);
        request.setStatus(FriendRequestStatus.PENDING);
        request.setCreatedAt(Instant.now());
        friendRequestRepository.save(request);

        FriendRequestDto dto = toDto(request, currentUser, target);
        wsEventPublisher.publishFriendRequest(target.getId(), dto);

        return new SendFriendRequestResponse(dto);
    }

    @Transactional(readOnly = true)
    public FriendRequestListResponse listIncoming(String currentUserId) {
        List<FriendRequest> requests =
                friendRequestRepository.findByToUserIdAndStatusOrderByCreatedAtDesc(
                        currentUserId, FriendRequestStatus.PENDING);

        Map<String, User> usersById = loadUsers(requests, currentUserId);
        User currentUser = usersById.get(currentUserId);

        List<FriendRequestDto> items = new ArrayList<>();
        for (FriendRequest request : requests) {
            User fromUser = usersById.get(request.getFromUserId());
            if (fromUser == null) {
                continue;
            }
            items.add(toDto(request, fromUser, currentUser));
        }

        return new FriendRequestListResponse(items, null);
    }

    @Transactional
    public AcceptFriendResponse acceptRequest(String currentUserId, String requestId) {
        FriendRequest request =
                friendRequestRepository
                        .findById(requestId)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.FRIEND_REQUEST_NOT_FOUND,
                                                "好友申请不存在"));

        if (!request.getToUserId().equals(currentUserId)) {
            throw new ChatException(ChatErrorCode.FORBIDDEN, "无权处理该好友申请");
        }
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ChatException(ChatErrorCode.FRIEND_REQUEST_NOT_FOUND, "好友申请已处理");
        }

        User friendUser = requireUser(request.getFromUserId());
        User currentUser = requireUser(currentUserId);
        Instant since = Instant.now();

        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        createFriendshipIfAbsent(currentUserId, friendUser.getId(), since);
        createFriendshipIfAbsent(friendUser.getId(), currentUserId, since);

        FriendDto friendForAccepter =
                new FriendDto(UserPresentation.toSummary(friendUser), since.toString());
        FriendDto friendForRequester =
                new FriendDto(UserPresentation.toSummary(currentUser), since.toString());
        wsEventPublisher.publishFriendAccepted(friendUser.getId(), friendForRequester);
        wsEventPublisher.publishFriendAccepted(currentUserId, friendForAccepter);

        return new AcceptFriendResponse(true, friendForAccepter);
    }

    @Transactional
    public OkResponse rejectRequest(String currentUserId, String requestId) {
        FriendRequest request =
                friendRequestRepository
                        .findById(requestId)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.FRIEND_REQUEST_NOT_FOUND,
                                                "好友申请不存在"));

        if (!request.getToUserId().equals(currentUserId)) {
            throw new ChatException(ChatErrorCode.FORBIDDEN, "无权处理该好友申请");
        }
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ChatException(ChatErrorCode.FRIEND_REQUEST_NOT_FOUND, "好友申请已处理");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
        return new OkResponse(true);
    }

    @Transactional(readOnly = true)
    public FriendListResponse listFriends(String currentUserId) {
        List<Friendship> friendships =
                friendshipRepository.findByUserIdOrderBySinceDesc(currentUserId);

        List<FriendDto> items = new ArrayList<>();
        for (Friendship friendship : friendships) {
            User friendUser = userRepository.findById(friendship.getFriendUserId()).orElse(null);
            if (friendUser == null) {
                continue;
            }
            items.add(
                    new FriendDto(
                            UserPresentation.toSummary(friendUser),
                            friendship.getSince().toString()));
        }

        return new FriendListResponse(items);
    }

    @Transactional
    public OkResponse removeFriend(String currentUserId, String friendUserId) {
        if (currentUserId.equals(friendUserId)) {
            throw new ChatException(ChatErrorCode.CANNOT_ADD_SELF, "不能删除自己");
        }
        if (!friendshipRepository.existsByUserIdAndFriendUserId(currentUserId, friendUserId)) {
            throw new ChatException(ChatErrorCode.NOT_FRIENDS, "你们不是好友");
        }

        friendshipRepository.deleteByUserIdAndFriendUserId(currentUserId, friendUserId);
        friendshipRepository.deleteByUserIdAndFriendUserId(friendUserId, currentUserId);

        wsEventPublisher.publishFriendDeleted(currentUserId, friendUserId);
        wsEventPublisher.publishFriendDeleted(friendUserId, currentUserId);

        return new OkResponse(true);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto lookupUser(String countryCode, String phone) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);

        User user =
                userRepository
                        .findByCountryCodeAndPhone(cc, normalizedPhone)
                        .orElseThrow(
                                () ->
                                        new ChatException(
                                                ChatErrorCode.USER_NOT_FOUND, "用户不存在"));

        return UserPresentation.toSummary(user);
    }

    private void createFriendshipIfAbsent(String userId, String friendUserId, Instant since) {
        if (friendshipRepository.existsByUserIdAndFriendUserId(userId, friendUserId)) {
            return;
        }
        Friendship friendship = new Friendship();
        friendship.setUserId(userId);
        friendship.setFriendUserId(friendUserId);
        friendship.setSince(since);
        friendshipRepository.save(friendship);
    }

    private User requireUser(String userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(
                        () -> new ChatException(ChatErrorCode.USER_NOT_FOUND, "用户不存在"));
    }

    private Map<String, User> loadUsers(List<FriendRequest> requests, String currentUserId) {
        List<String> userIds = new ArrayList<>();
        userIds.add(currentUserId);
        for (FriendRequest request : requests) {
            userIds.add(request.getFromUserId());
            userIds.add(request.getToUserId());
        }

        return userRepository.findAllById(userIds.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private FriendRequestDto toDto(FriendRequest request, User fromUser, User toUser) {
        return new FriendRequestDto(
                request.getId(),
                UserPresentation.toSummary(fromUser),
                UserPresentation.toSummary(toUser),
                request.getMessage() == null ? "" : request.getMessage(),
                request.getStatus().toApiValue(),
                request.getCreatedAt().toString());
    }

    private String normalizeMessage(String message) {
        if (message == null) {
            return "";
        }
        String trimmed = message.trim();
        if (trimmed.length() > MESSAGE_MAX_LENGTH) {
            throw new ChatException(ChatErrorCode.INVALID_MESSAGE, "验证消息不能超过 100 字");
        }
        return trimmed;
    }
}
