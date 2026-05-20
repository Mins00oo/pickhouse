package app.pickhouse.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtIssuerTest {

    private JwtKeyProvider keys;
    private JwtProperties props;
    private JwtIssuer issuer;

    @BeforeEach
    void setUp() throws Exception {
        keys = TestJwtKeys.loadedProvider();
        props = TestJwtKeys.properties();
        issuer = new JwtIssuer(keys, props);
    }

    @Test
    void issues_access_token_with_subject_and_type_and_email() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "u@x.com");

        DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
            .withIssuer(props.issuer()).build().verify(token);

        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaim("type").asString()).isEqualTo("access");
        assertThat(decoded.getClaim("email").asString()).isEqualTo("u@x.com");
    }

    @Test
    void issues_refresh_token_with_jti_and_type() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        String token = issuer.issueRefreshToken(userId, jti);

        DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
            .withIssuer(props.issuer()).build().verify(token);

        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaim("type").asString()).isEqualTo("refresh");
        assertThat(decoded.getId()).isEqualTo(jti.toString());
    }

    @Test
    void access_token_expires_at_now_plus_ttl_within_a_few_seconds() {
        long beforeIssue = System.currentTimeMillis() / 1000;
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "u@x.com");
        long afterIssue = System.currentTimeMillis() / 1000;

        DecodedJWT decoded = JWT.decode(token);
        long expEpoch = decoded.getExpiresAt().toInstant().getEpochSecond();
        assertThat(expEpoch).isBetween(beforeIssue + TestJwtKeys.ACCESS_TTL - 1,
                                       afterIssue + TestJwtKeys.ACCESS_TTL + 1);
    }
}
