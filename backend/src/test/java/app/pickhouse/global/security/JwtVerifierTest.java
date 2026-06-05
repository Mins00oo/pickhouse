package app.pickhouse.global.security;

import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtVerifierTest {

    private JwtKeyProvider keys;
    private JwtProperties props;
    private JwtIssuer issuer;
    private JwtVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        keys = TestJwtKeys.loadedProvider();
        props = TestJwtKeys.properties();
        issuer = new JwtIssuer(keys, props);
        verifier = new JwtVerifier(keys, props);
    }

    @Test
    void verifies_valid_access_token() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "x@y.com");

        JwtVerifier.VerifiedClaims c = verifier.verifyAccess(token);

        assertThat(c.userId()).isEqualTo(userId);
        assertThat(c.type()).isEqualTo("access");
        assertThat(c.email()).isEqualTo("x@y.com");
    }

    @Test
    void verifies_valid_refresh_token_and_extracts_jti() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        String token = issuer.issueRefreshToken(userId, jti);

        JwtVerifier.VerifiedClaims c = verifier.verifyRefresh(token);

        assertThat(c.userId()).isEqualTo(userId);
        assertThat(c.type()).isEqualTo("refresh");
        assertThat(c.jti()).isEqualTo(jti);
    }

    @Test
    void rejects_refresh_token_when_calling_verifyAccess() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueRefreshToken(userId, UUID.randomUUID());

        assertThatThrownBy(() -> verifier.verifyAccess(token))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.INVALID_TOKEN);
    }

    @Test
    void rejects_access_token_when_calling_verifyRefresh() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "x@y.com");

        assertThatThrownBy(() -> verifier.verifyRefresh(token))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejects_garbage_token() {
        assertThatThrownBy(() -> verifier.verifyAccess("garbage.token.string"))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.INVALID_TOKEN);
    }

    @Test
    void rejects_empty_token() {
        assertThatThrownBy(() -> verifier.verifyAccess(""))
            .isInstanceOf(BusinessException.class);
    }
}
