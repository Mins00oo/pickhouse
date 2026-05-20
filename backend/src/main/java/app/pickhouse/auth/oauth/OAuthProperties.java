package app.pickhouse.auth.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.oauth")
public record OAuthProperties(Apple apple, Kakao kakao) {
    public record Apple(String audience, String jwksUrl) {}
    public record Kakao(String jwksUrl, String issuer, String audience) {}
}
