package com.ayuchat.support;

import com.ayuchat.domain.User;
import com.ayuchat.dto.UserDto;
import com.ayuchat.dto.UserSummaryDto;

public final class UserPresentation {

    private UserPresentation() {}

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getPhone(),
                user.getCountryCode(),
                user.getName());
    }

    public static String displayName(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }
        return maskPhone(user.getPhone());
    }

    public static UserSummaryDto toSummary(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getPhone(),
                user.getCountryCode(),
                displayName(user));
    }
}
