package com.ayuchat.repository;

import com.ayuchat.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByCountryCodeAndPhone(String countryCode, String phone);

    boolean existsByCountryCodeAndPhone(String countryCode, String phone);
}
