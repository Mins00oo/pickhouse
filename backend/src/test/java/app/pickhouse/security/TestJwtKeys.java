package app.pickhouse.security;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Test helper: builds a JwtKeyProvider backed by in-memory RSA keys, without Spring context.
 * Used across security tests (JwtIssuer, JwtVerifier, JwtAuthFilter).
 */
public final class TestJwtKeys {

    public static final String ISSUER = "https://test.pickhouse.app";
    public static final long ACCESS_TTL = 1800L;
    public static final long REFRESH_TTL = 2592000L;

    private TestJwtKeys() {}

    public static JwtProperties properties() {
        return new JwtProperties(ISSUER, ACCESS_TTL, REFRESH_TTL,
            "classpath:test-priv.pem", "classpath:test-pub.pem");
    }

    public static JwtKeyProvider loadedProvider() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair kp = gen.generateKeyPair();

        String privatePem = "-----BEGIN PRIVATE KEY-----\n"
            + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(kp.getPrivate().getEncoded())
            + "\n-----END PRIVATE KEY-----\n";
        String publicPem = "-----BEGIN PUBLIC KEY-----\n"
            + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(kp.getPublic().getEncoded())
            + "\n-----END PUBLIC KEY-----\n";

        ResourceLoader loader = mock(ResourceLoader.class);
        Resource priv = mock(Resource.class);
        when(priv.getInputStream())
            .thenReturn(new ByteArrayInputStream(privatePem.getBytes(StandardCharsets.UTF_8)));
        Resource pub = mock(Resource.class);
        when(pub.getInputStream())
            .thenReturn(new ByteArrayInputStream(publicPem.getBytes(StandardCharsets.UTF_8)));
        when(loader.getResource("classpath:test-priv.pem")).thenReturn(priv);
        when(loader.getResource("classpath:test-pub.pem")).thenReturn(pub);

        JwtKeyProvider provider = new JwtKeyProvider(properties(), loader);
        provider.init();
        return provider;
    }
}
