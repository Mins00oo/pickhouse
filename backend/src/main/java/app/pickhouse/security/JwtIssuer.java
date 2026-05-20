package app.pickhouse.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtIssuer {

    private final JwtKeyProvider keys;
    private final JwtProperties props;

    public String issueAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return JWT.create()
            .withIssuer(props.issuer())
            .withSubject(userId.toString())
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(props.accessTokenTtlSeconds())))
            .withClaim("type", "access")
            .withClaim("email", email)
            .sign(Algorithm.RSA256(keys.publicKey(), keys.privateKey()));
    }

    public String issueRefreshToken(UUID userId, UUID jti) {
        Instant now = Instant.now();
        return JWT.create()
            .withIssuer(props.issuer())
            .withSubject(userId.toString())
            .withJWTId(jti.toString())
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(props.refreshTokenTtlSeconds())))
            .withClaim("type", "refresh")
            .sign(Algorithm.RSA256(keys.publicKey(), keys.privateKey()));
    }
}
