package com.ayuchat.repository;

import com.ayuchat.domain.VerifyToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerifyTokenRepository extends JpaRepository<VerifyToken, String> {

    Optional<VerifyToken> findByToken(String token);
}
