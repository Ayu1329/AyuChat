package com.ayuchat.service;

import com.ayuchat.config.AyuChatProperties;
import com.ayuchat.config.JwtProperties;
import com.ayuchat.config.SmsProperties;
import com.ayuchat.domain.AuthErrorCode;
import com.ayuchat.domain.RefreshToken;
import com.ayuchat.domain.SmsCode;
import com.ayuchat.domain.SmsScene;
import com.ayuchat.domain.User;
import com.ayuchat.domain.VerifyToken;
import com.ayuchat.dto.LoginResponse;
import com.ayuchat.dto.OkResponse;
import com.ayuchat.dto.RegisterResponse;
import com.ayuchat.dto.SmsSendResponse;
import com.ayuchat.dto.SmsVerifyResponse;
import com.ayuchat.dto.UserDto;
import com.ayuchat.exception.AuthException;
import com.ayuchat.repository.RefreshTokenRepository;
import com.ayuchat.repository.SmsCodeRepository;
import com.ayuchat.repository.UserRepository;
import com.ayuchat.repository.VerifyTokenRepository;
import com.ayuchat.security.JwtService;
import com.ayuchat.support.AuthValidation;
import com.ayuchat.support.UserPresentation;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final SmsCodeRepository smsCodeRepository;
    private final VerifyTokenRepository verifyTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SmsProperties smsProperties;
    private final JwtProperties jwtProperties;
    private final AyuChatProperties ayuChatProperties;

    public AuthService(
            UserRepository userRepository,
            SmsCodeRepository smsCodeRepository,
            VerifyTokenRepository verifyTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            SmsProperties smsProperties,
            JwtProperties jwtProperties,
            AyuChatProperties ayuChatProperties) {
        this.userRepository = userRepository;
        this.smsCodeRepository = smsCodeRepository;
        this.verifyTokenRepository = verifyTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.smsProperties = smsProperties;
        this.jwtProperties = jwtProperties;
        this.ayuChatProperties = ayuChatProperties;
    }

    @Transactional
    public SmsSendResponse sendSms(String countryCode, String phone, SmsScene scene) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);

        boolean exists = userRepository.existsByCountryCodeAndPhone(cc, normalizedPhone);
        if (scene == SmsScene.REGISTER && exists) {
            throw new AuthException(AuthErrorCode.PHONE_ALREADY_REGISTERED, "该手机号已注册");
        }
        if (scene == SmsScene.RESET_PASSWORD && !exists) {
            throw new AuthException(AuthErrorCode.PHONE_NOT_FOUND, "该手机号未注册");
        }

        Instant retryAfter =
                Instant.now().minusSeconds(smsProperties.retryAfterSeconds());
        smsCodeRepository
                .findTopByCountryCodeAndPhoneAndSceneAndCreatedAtAfterOrderByCreatedAtDesc(
                        cc, normalizedPhone, scene, retryAfter)
                .ifPresent(
                        recent -> {
                            throw new AuthException(
                                    AuthErrorCode.SMS_RATE_LIMIT, "发送过于频繁，请稍后再试");
                        });

        String code = generateSmsCode();
        SmsCode smsCode = new SmsCode();
        smsCode.setCountryCode(cc);
        smsCode.setPhone(normalizedPhone);
        smsCode.setScene(scene);
        smsCode.setCode(code);
        smsCode.setExpiresAt(Instant.now().plusSeconds(smsProperties.codeExpiresSeconds()));
        smsCodeRepository.save(smsCode);

        if (smsProperties.mockEnabled()) {
            log.info(
                    "SMS mock [{}] {} {} code={}",
                    scene,
                    cc,
                    normalizedPhone,
                    code);
        } else {
            // TODO: 接入真实短信通道
            log.info("SMS sent [{}] {} {}", scene, cc, normalizedPhone);
        }

        return new SmsSendResponse(true, (int) smsProperties.retryAfterSeconds());
    }

    @Transactional
    public SmsVerifyResponse verifySms(String countryCode, String phone, SmsScene scene, String code) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);

        SmsCode smsCode =
                smsCodeRepository
                        .findTopByCountryCodeAndPhoneAndSceneOrderByCreatedAtDesc(
                                cc, normalizedPhone, scene)
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.INVALID_CODE, "验证码错误或已过期"));

        if (smsCode.getExpiresAt().isBefore(Instant.now()) || !smsCode.getCode().equals(code)) {
            throw new AuthException(AuthErrorCode.INVALID_CODE, "验证码错误或已过期");
        }

        VerifyToken verifyToken = new VerifyToken();
        verifyToken.setToken("vt_" + UUID.randomUUID().toString().replace("-", ""));
        verifyToken.setCountryCode(cc);
        verifyToken.setPhone(normalizedPhone);
        verifyToken.setScene(scene);
        verifyToken.setExpiresAt(
                Instant.now().plusSeconds(ayuChatProperties.verifyTokenExpiresSeconds()));
        verifyTokenRepository.save(verifyToken);

        return new SmsVerifyResponse(
                verifyToken.getToken(), ayuChatProperties.verifyTokenExpiresSeconds());
    }

    @Transactional
    public RegisterResponse register(
            String countryCode, String phone, String verifyTokenValue, String password) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);
        AuthValidation.validatePassword(password);

        VerifyToken verifyToken = consumeVerifyToken(verifyTokenValue, cc, normalizedPhone, SmsScene.REGISTER);

        if (userRepository.existsByCountryCodeAndPhone(cc, normalizedPhone)) {
            throw new AuthException(AuthErrorCode.PHONE_ALREADY_REGISTERED, "该手机号已注册");
        }

        User user = new User();
        user.setCountryCode(cc);
        user.setPhone(normalizedPhone);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        verifyToken.setUsed(true);
        verifyTokenRepository.save(verifyToken);

        return new RegisterResponse(toUserDto(user));
    }

    @Transactional(readOnly = true)
    public LoginResponse login(String countryCode, String phone, String password) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);

        User user =
                userRepository
                        .findByCountryCodeAndPhone(cc, normalizedPhone)
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.INVALID_CREDENTIALS, "账号或密码错误"));

        if (user.isDisabled()) {
            throw new AuthException(AuthErrorCode.ACCOUNT_DISABLED, "账号已被禁用");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS, "账号或密码错误");
        }

        return buildLoginResponse(user);
    }

    @Transactional
    public OkResponse resetPassword(
            String countryCode, String phone, String verifyTokenValue, String password) {
        String cc = AuthValidation.normalizeCountryCode(countryCode);
        String normalizedPhone = AuthValidation.normalizePhone(phone);
        AuthValidation.validatePassword(password);

        VerifyToken verifyToken =
                consumeVerifyToken(verifyTokenValue, cc, normalizedPhone, SmsScene.RESET_PASSWORD);

        User user =
                userRepository
                        .findByCountryCodeAndPhone(cc, normalizedPhone)
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.PHONE_NOT_FOUND, "该手机号未注册"));

        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        verifyToken.setUsed(true);
        verifyTokenRepository.save(verifyToken);

        revokeRefreshTokens(user.getId());

        return new OkResponse(true);
    }

    @Transactional
    public OkResponse logout(String userId) {
        revokeRefreshTokens(userId);
        return new OkResponse(true);
    }

    @Transactional
    public LoginResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken =
                refreshTokenRepository
                        .findByToken(refreshTokenValue)
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.UNAUTHORIZED, "refresh_token 无效"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException(AuthErrorCode.UNAUTHORIZED, "refresh_token 已过期");
        }

        User user =
                userRepository
                        .findById(refreshToken.getUserId())
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.UNAUTHORIZED, "用户不存在"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildLoginResponse(user);
    }

    private LoginResponse buildLoginResponse(User user) {
        String accessToken = jwtService.createAccessToken(user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setToken("rt_" + UUID.randomUUID().toString().replace("-", ""));
        refreshToken.setExpiresAt(
                Instant.now().plusSeconds(jwtProperties.refreshTokenExpiresSeconds()));
        refreshTokenRepository.save(refreshToken);

        return new LoginResponse(
                accessToken,
                jwtProperties.accessTokenExpiresSeconds(),
                refreshToken.getToken(),
                toUserDto(user));
    }

    private VerifyToken consumeVerifyToken(
            String tokenValue, String countryCode, String phone, SmsScene scene) {
        VerifyToken verifyToken =
                verifyTokenRepository
                        .findByToken(tokenValue)
                        .orElseThrow(
                                () ->
                                        new AuthException(
                                                AuthErrorCode.INVALID_VERIFY_TOKEN,
                                                "验证凭证无效或已过期"));

        if (verifyToken.isUsed()
                || verifyToken.getExpiresAt().isBefore(Instant.now())
                || !verifyToken.getCountryCode().equals(countryCode)
                || !verifyToken.getPhone().equals(phone)
                || verifyToken.getScene() != scene) {
            throw new AuthException(AuthErrorCode.INVALID_VERIFY_TOKEN, "验证凭证无效或已过期");
        }
        return verifyToken;
    }

    private void revokeRefreshTokens(String userId) {
        refreshTokenRepository.findAll().stream()
                .filter(rt -> rt.getUserId().equals(userId) && !rt.isRevoked())
                .forEach(
                        rt -> {
                            rt.setRevoked(true);
                            refreshTokenRepository.save(rt);
                        });
    }

    private String generateSmsCode() {
        if (smsProperties.mockEnabled()) {
            return smsProperties.mockCode();
        }
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private UserDto toUserDto(User user) {
        return UserPresentation.toDto(user);
    }
}
