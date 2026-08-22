package com.ayuchat.controller;

import com.ayuchat.dto.UpdateProfileRequest;
import com.ayuchat.dto.UserDto;
import com.ayuchat.service.UserService;
import com.ayuchat.support.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDto getProfile() {
        return userService.getProfile(CurrentUser.requireUserId());
    }

    @PatchMapping("/me")
    public UserDto updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(CurrentUser.requireUserId(), request);
    }
}
