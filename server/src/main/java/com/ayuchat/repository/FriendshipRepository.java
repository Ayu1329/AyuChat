package com.ayuchat.repository;

import com.ayuchat.domain.Friendship;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendshipRepository extends JpaRepository<Friendship, String> {

    boolean existsByUserIdAndFriendUserId(String userId, String friendUserId);

    void deleteByUserIdAndFriendUserId(String userId, String friendUserId);

    List<Friendship> findByUserIdOrderBySinceDesc(String userId);
}
