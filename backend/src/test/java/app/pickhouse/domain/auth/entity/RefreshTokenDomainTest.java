package app.pickhouse.domain.auth.entity;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshTokenDomainTest {

    @Test
    void newly_built_token_is_not_revoked() {
        RefreshToken t = RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .jti(UUID.randomUUID())
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(false)
            .createdAt(Instant.now())
            .build();

        assertThat(t.isRevoked()).isFalse();
    }

    @Test
    void revoke_sets_revoked_flag_to_true() {
        RefreshToken t = RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .jti(UUID.randomUUID())
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(false)
            .createdAt(Instant.now())
            .build();

        t.revoke();

        assertThat(t.isRevoked()).isTrue();
    }

    @Test
    void revoke_is_idempotent() {
        RefreshToken t = RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .jti(UUID.randomUUID())
            .expiresAt(Instant.now().plusSeconds(3600))
            .revoked(true)
            .createdAt(Instant.now())
            .build();

        t.revoke();

        assertThat(t.isRevoked()).isTrue();
    }
}
