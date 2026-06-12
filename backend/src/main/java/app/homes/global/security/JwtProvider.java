package app.homes.global.security;

import app.homes.global.config.JwtProperties;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * 자체 JWT(access token) 발급/검증. HS256 대칭키 서명.
 */
@Component
public class JwtProvider {

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final long accessExpiresSeconds;

    public JwtProvider(JwtProperties properties) {
        this.algorithm = Algorithm.HMAC256(properties.secret());
        this.verifier = JWT.require(algorithm).build();
        this.accessExpiresSeconds = properties.accessToken().expires().getSeconds();
    }

    public String issueAccessToken(String userId) {
        Instant now = Instant.now();
        return JWT.create()
                .withSubject(userId)
                .withIssuedAt(now)
                .withExpiresAt(now.plusSeconds(accessExpiresSeconds))
                .sign(algorithm);
    }

    /** 검증 실패 시 com.auth0.jwt.exceptions.JWTVerificationException 을 던진다. */
    public String verifyAndGetUserId(String token) {
        return verifier.verify(token).getSubject();
    }
}
