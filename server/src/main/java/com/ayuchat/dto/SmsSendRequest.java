package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SmsSendRequest(
        @NotBlank(message = "country_code 不能为空")
                @Pattern(regexp = "\\+86", message = "仅支持 +86")
                String country_code,
        @NotBlank(message = "phone 不能为空") String phone,
        @NotBlank(message = "scene 不能为空")
                @Pattern(regexp = "register|reset_password", message = "scene 非法")
                String scene) {}
