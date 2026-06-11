package app.homes.user.controller;

import app.homes.global.security.CurrentUserId;
import app.homes.user.dto.NicknameResponse;
import app.homes.user.dto.UpdateNicknameRequest;
import app.homes.user.dto.UserProfileResponse;
import app.homes.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileResponse getProfile(@CurrentUserId String userId) {
        return userService.getProfile(userId);
    }

    @PatchMapping("/me")
    public NicknameResponse updateNickname(
            @CurrentUserId String userId,
            @RequestBody @Valid UpdateNicknameRequest request
    ) {
        return userService.updateNickname(userId, request);
    }

    @DeleteMapping("/me")
    public void withdraw(@CurrentUserId String userId) {
        userService.withdraw(userId);
    }
}
