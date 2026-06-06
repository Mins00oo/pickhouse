package app.pickhouse.domain.user.controller;

import app.pickhouse.domain.user.dto.response.UserResponse;
import app.pickhouse.domain.user.service.UserService;
import app.pickhouse.global.security.CurrentUserId;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@CurrentUserId UUID userId) {
        return userService.getSelf(userId);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(@CurrentUserId UUID userId) {
        userService.softDeleteSelf(userId);
        return ResponseEntity.noContent().build();
    }
}
