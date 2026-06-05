package app.pickhouse.domain.auth.oauth;

import app.pickhouse.global.exception.BusinessException;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppleIdTokenVerifierTest {

    private MockWebServer server;
    private KeyPair keyPair;
    private OAuthProperties props;
    private AppleIdTokenVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        keyPair = gen.generateKeyPair();

        String n = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getModulus().toByteArray());
        String e = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getPublicExponent().toByteArray());
        String jwks = "{\"keys\":[{\"kty\":\"RSA\",\"kid\":\"k1\",\"use\":\"sig\",\"alg\":\"RS256\",\"n\":\""
            + n + "\",\"e\":\"" + e + "\"}]}";
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));

        props = new OAuthProperties(
            new OAuthProperties.Apple("app.pickhouse.ios", server.url("/keys").toString()),
            new OAuthProperties.Kakao("", "", ""));
        verifier = new AppleIdTokenVerifier(new AppleJwksClient(props), props);
    }

    @AfterEach
    void tearDown() throws Exception { server.shutdown(); }

    @Test
    void verifies_valid_apple_id_token() {
        String token = JWT.create()
            .withIssuer("https://appleid.apple.com")
            .withAudience("app.pickhouse.ios")
            .withSubject("apple-user-123")
            .withClaim("email", "u@apple.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("k1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);
        assertThat(u.providerId()).isEqualTo("apple-user-123");
        assertThat(u.email()).isEqualTo("u@apple.com");
    }

    @Test
    void accepts_not_before_within_clock_skew() {
        String token = JWT.create()
            .withIssuer("https://appleid.apple.com")
            .withAudience("app.pickhouse.ios")
            .withSubject("apple-user-123")
            .withClaim("email", "u@apple.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withNotBefore(Date.from(Instant.now().plusSeconds(30)))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("k1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);

        assertThat(u.providerId()).isEqualTo("apple-user-123");
        assertThat(u.email()).isEqualTo("u@apple.com");
    }

    @Test
    void rejects_wrong_audience() {
        String token = JWT.create()
            .withIssuer("https://appleid.apple.com")
            .withAudience("app.someoneelse")
            .withSubject("apple-user-123")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("k1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));
        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(BusinessException.class);
    }
}
