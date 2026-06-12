package app.homes.auth.oauth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * provider별 OIDC 설정.
 * - issuer / jwksUri : 공개값 (application.yml)
 * - audience          : client_id (카카오=REST API 키, 애플=iOS Bundle ID) — 시크릿(homes-secrets.properties)
 */
@ConfigurationProperties("oauth")
public record OAuthProperties(Provider kakao, Provider apple) {

    public record Provider(String issuer, String jwksUri, String audience) {
    }
}
