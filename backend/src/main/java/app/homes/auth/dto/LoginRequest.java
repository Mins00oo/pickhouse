package app.homes.auth.dto;

import app.homes.auth.oauth.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 소셜 로그인 요청.
 * - displayName: 애플 최초 로그인 시 클라이언트가 전달(애플 이름은 토큰에 없고 최초 1회만 제공됨). 그 외엔 무시 가능.
 */
public record LoginRequest(
        @NotNull OAuthProvider provider,
        @NotBlank @Size(max = 8192) String idToken,
        @NotBlank @Size(max = 255) String deviceId,
        @Size(max = 50) String displayName
) {
}
