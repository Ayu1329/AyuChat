package com.ayuchat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendFriendRequest(
        @NotBlank(message = "请输入国家码") String country_code,
        @NotBlank(message = "请输入手机号") String phone,
        @Size(max = 100, message = "验证消息不能超过 100 字") String message) {}
