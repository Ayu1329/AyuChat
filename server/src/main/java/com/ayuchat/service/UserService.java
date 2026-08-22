package com.ayuchat.service;

import com.ayuchat.domain.AuthErrorCode;
import com.ayuchat.domain.User;
import com.ayuchat.dto.UpdateProfileRequest;
import com.ayuchat.dto.UserDto;
import com.ayuchat.exception.AuthException;
import com.ayuchat.repository.UserRepository;
import com.ayuchat.support.UserPresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getProfile(String userId) {
        return UserPresentation.toDto(requireUser(userId));
    }

    @Transactional
    public UserDto updateProfile(String userId, UpdateProfileRequest request) {
        User user = requireUser(userId);
        String trimmed = request.name() == null ? null : request.name().trim();
        user.setName(trimmed == null || trimmed.isEmpty() ? null : trimmed);
        userRepository.save(user);
        return UserPresentation.toDto(user);
    }

    private User requireUser(String userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(
                        () -> new AuthException(AuthErrorCode.UNAUTHORIZED, "用户不存在"));
    }
}
