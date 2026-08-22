package com.ayuchat.controller;

import com.ayuchat.domain.SmsScene;
import com.ayuchat.dto.LoginRequest;
import com.ayuchat.dto.LoginResponse;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.RefreshTokenRequest;
import com.ayuchat.dto.RegisterRequest;
import com.ayuchat.dto.RegisterResponse;
import com.ayuchat.dto.ResetPasswordRequest;
import com.ayuchat.dto.SmsSendRequest;
import com.ayuchat.dto.SmsSendResponse;
import com.ayuchat.dto.SmsVerifyRequest;
import com.ayuchat.dto.SmsVerifyResponse;
import com.ayuchat.service.AuthService;
import com.ayuchat.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/sms/send")
    public SmsSendResponse sendSms(@Valid @RequestBody SmsSendRequest request) {
        SmsScene scene = SmsScene.fromApiValue(request.scene());
        return authService.sendSms(request.country_code(), request.phone(), scene);
    }

    @PostMapping("/sms/verify")
    public SmsVerifyResponse verifySms(@Valid @RequestBody SmsVerifyRequest request) {
        SmsScene scene = SmsScene.fromApiValue(request.scene());
        return authService.verifySms(
                request.country_code(), request.phone(), scene, request.code());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(
                request.country_code(),
                request.phone(),
                request.verify_token(),
                request.password());
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.country_code(), request.phone(), request.password());
    }

    @PostMapping("/password/reset")
    public OkResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(
                request.country_code(),
                request.phone(),
                request.verify_token(),
                request.password());
    }

    @PostMapping("/logout")
    public OkResponse logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
                    String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                String userId = jwtService.parseUserId(authorization.substring(7));
                return authService.logout(userId);
            } catch (Exception ignored) {
                // token 无效时仍返回成功，客户端会清除本地凭证
            }
        }
        return new OkResponse(true);
    }

    @PostMapping("/token/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request.refresh_token());
    }
}
