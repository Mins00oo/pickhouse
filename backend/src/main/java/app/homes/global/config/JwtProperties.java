package app.homes.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * jwt.secret              — HMAC256 서명 비밀키 (homes-secrets.properties)
 * jwt.access-token.expires — access token 만료(예: PT30M)
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        AccessToken accessToken
) {
    public record AccessToken(Duration expires) {
    }
}
