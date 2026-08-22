package com.ayuchat.support;

import com.ayuchat.domain.AuthErrorCode;
import com.ayuchat.exception.AuthException;
import java.util.regex.Pattern;

public final class AuthValidation {

    private static final String CN_COUNTRY_CODE = "+86";
    private static final Pattern CN_MOBILE = Pattern.compile("^1[3-9]\\d{9}$");
    private static final Pattern PASSWORD =
            Pattern.compile(
                    "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]{8,32}$");

    private AuthValidation() {}

    public static String normalizeCountryCode(String countryCode) {
        if (countryCode == null || !CN_COUNTRY_CODE.equals(countryCode)) {
            throw new AuthException(AuthErrorCode.INVALID_PHONE, "仅支持中国大陆手机号（+86）");
        }
        return CN_COUNTRY_CODE;
    }

    public static String normalizePhone(String phone) {
        if (phone == null || !CN_MOBILE.matcher(phone.trim()).matches()) {
            throw new AuthException(AuthErrorCode.INVALID_PHONE, "请输入有效的中国大陆手机号");
        }
        return phone.trim();
    }

    public static void validatePassword(String password) {
        if (password == null || !PASSWORD.matcher(password).matches()) {
            throw new AuthException(
                    AuthErrorCode.INVALID_PASSWORD,
                    "密码长度为 8–32 位，且需同时包含字母和数字");
        }
    }
}
