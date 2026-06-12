package app.homes.user.dto;

import java.time.LocalDateTime;

public record UserProfileResponse(
        String nickname,
        LocalDateTime createdAt
) {
}
