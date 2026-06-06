package app.pickhouse.domain.user.dto.response;

import app.pickhouse.domain.user.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(UUID id, String email, String nickname, Instant createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname(), u.getCreatedAt());
    }
}
