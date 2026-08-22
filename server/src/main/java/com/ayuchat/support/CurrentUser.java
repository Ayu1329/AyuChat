package com.ayuchat.support;

import com.ayuchat.domain.AuthErrorCode;
import com.ayuchat.exception.AuthException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {}

    public static String requireUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new AuthException(AuthErrorCode.UNAUTHORIZED, "未登录或登录已过期");
        }
        return authentication.getPrincipal().toString();
    }
}
