package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
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

class KakaoIdTokenVerifierTest {

    private MockWebServer server;
    private KeyPair keyPair;
    private OAuthProperties props;
    private KakaoIdTokenVerifier verifier;

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
        String jwks = "{\"keys\":[{\"kty\":\"RSA\",\"kid\":\"kk1\",\"alg\":\"RS256\",\"n\":\""
            + n + "\",\"e\":\"" + e + "\"}]}";
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));

        props = new OAuthProperties(
            new OAuthProperties.Apple("", ""),
            new OAuthProperties.Kakao(server.url("/jwks").toString(), "https://kauth.kakao.com", "kakao-app-key"));
        verifier = new KakaoIdTokenVerifier(new KakaoApiClient(props), props);
    }

    @AfterEach
    void tearDown() throws Exception { server.shutdown(); }

    @Test
    void verifies_valid_kakao_token() {
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("kakao-app-key")
            .withSubject("12345")
            .withClaim("email", "u@kakao.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);
        assertThat(u.providerId()).isEqualTo("12345");
        assertThat(u.email()).isEqualTo("u@kakao.com");
    }

    @Test
    void accepts_not_before_within_clock_skew() {
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("kakao-app-key")
            .withSubject("12345")
            .withClaim("email", "u@kakao.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withNotBefore(Date.from(Instant.now().plusSeconds(30)))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);

        assertThat(u.providerId()).isEqualTo("12345");
        assertThat(u.email()).isEqualTo("u@kakao.com");
    }

    @Test
    void rejects_invalid_signature() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair other = gen.generateKeyPair();
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("kakao-app-key")
            .withSubject("12345")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) other.getPublic(), (RSAPrivateKey) other.getPrivate()));
        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(ApiException.class);
    }

    @Test
    void rejects_wrong_audience() {
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("other-app-key")
            .withSubject("12345")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        assertThatThrownBy(() -> verifier.verify(token))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Kakao ID token invalid");
    }
}
