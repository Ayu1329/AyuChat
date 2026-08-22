package com.ayuchat.repository;

import com.ayuchat.domain.SmsCode;
import com.ayuchat.domain.SmsScene;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SmsCodeRepository extends JpaRepository<SmsCode, String> {

    Optional<SmsCode> findTopByCountryCodeAndPhoneAndSceneOrderByCreatedAtDesc(
            String countryCode, String phone, SmsScene scene);

    Optional<SmsCode> findTopByCountryCodeAndPhoneAndSceneAndCreatedAtAfterOrderByCreatedAtDesc(
            String countryCode, String phone, SmsScene scene, Instant after);
}
