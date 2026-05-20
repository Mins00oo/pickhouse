package app.pickhouse.security;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtKeyProviderTest {

    @Test
    void loads_rsa_keys_from_pem() throws Exception {
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
        Resource privResource = mock(Resource.class);
        when(privResource.getInputStream())
            .thenReturn(new ByteArrayInputStream(privatePem.getBytes(StandardCharsets.UTF_8)));
        Resource pubResource = mock(Resource.class);
        when(pubResource.getInputStream())
            .thenReturn(new ByteArrayInputStream(publicPem.getBytes(StandardCharsets.UTF_8)));
        when(loader.getResource("classpath:test-priv.pem")).thenReturn(privResource);
        when(loader.getResource("classpath:test-pub.pem")).thenReturn(pubResource);

        JwtProperties props = new JwtProperties(
            "https://test.pickhouse.app",
            1800L, 2592000L,
            "classpath:test-priv.pem", "classpath:test-pub.pem"
        );
        JwtKeyProvider provider = new JwtKeyProvider(props, loader);
        provider.init();

        assertThat(provider.privateKey()).isNotNull();
        assertThat(provider.publicKey()).isNotNull();
        assertThat(provider.privateKey().getAlgorithm()).isEqualTo("RSA");
        assertThat(provider.publicKey().getAlgorithm()).isEqualTo("RSA");
    }
}
