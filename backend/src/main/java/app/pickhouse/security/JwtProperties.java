package app.pickhouse.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.jwt")
public record JwtProperties(
    String issuer,
    long accessTokenTtlSeconds,
    long refreshTokenTtlSeconds,
    String privateKeyPath,
    String publicKeyPath
) {}
