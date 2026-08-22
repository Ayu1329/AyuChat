package com.ayuchat.repository;

import com.ayuchat.domain.FriendRequest;
import com.ayuchat.domain.FriendRequestStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, String> {

    List<FriendRequest> findByToUserIdAndStatusOrderByCreatedAtDesc(
            String toUserId, FriendRequestStatus status);

    Optional<FriendRequest> findByFromUserIdAndToUserIdAndStatus(
            String fromUserId, String toUserId, FriendRequestStatus status);

    boolean existsByFromUserIdAndToUserIdAndStatus(
            String fromUserId, String toUserId, FriendRequestStatus status);

    boolean existsByToUserIdAndFromUserIdAndStatus(
            String toUserId, String fromUserId, FriendRequestStatus status);
}
