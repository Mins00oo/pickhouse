package app.pickhouse.auth.dto;

import app.pickhouse.domain.user.User;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String email, String nickname, Instant createdAt) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getNickname(), u.getCreatedAt());
    }
}
