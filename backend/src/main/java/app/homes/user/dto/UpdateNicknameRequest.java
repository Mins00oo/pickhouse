package app.homes.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateNicknameRequest(
        @NotBlank @Size(max = 50) String nickname
) {
    public UpdateNicknameRequest {
        if (nickname != null) {
            nickname = nickname.strip();
        }
    }
}
