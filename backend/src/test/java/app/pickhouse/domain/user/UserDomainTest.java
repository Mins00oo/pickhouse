package app.pickhouse.domain.user;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserDomainTest {

    @Test
    void softDelete_sets_deletedAt_purgeAfter_and_updatedAt() {
        Instant now = Instant.parse("2026-05-20T00:00:00Z");
        Instant purge = now.plusSeconds(30L * 24 * 3600);
        User u = User.builder()
            .id(UUID.randomUUID())
            .email("a@b.com")
            .nickname("alice")
            .createdAt(now)
            .updatedAt(now)
            .build();

        u.softDelete(now, purge);

        assertThat(u.getDeletedAt()).isEqualTo(now);
        assertThat(u.getPurgeAfter()).isEqualTo(purge);
        assertThat(u.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    void updateProfile_updates_nickname_and_updatedAt_when_nickname_not_null() {
        Instant initial = Instant.parse("2026-05-20T00:00:00Z");
        Instant later = initial.plusSeconds(60);
        User u = User.builder()
            .id(UUID.randomUUID())
            .nickname("alice")
            .createdAt(initial)
            .updatedAt(initial)
            .build();

        u.updateProfile("bob", later);

        assertThat(u.getNickname()).isEqualTo("bob");
        assertThat(u.getUpdatedAt()).isEqualTo(later);
    }

    @Test
    void updateProfile_keeps_nickname_when_input_is_null_but_still_bumps_updatedAt() {
        Instant initial = Instant.parse("2026-05-20T00:00:00Z");
        Instant later = initial.plusSeconds(60);
        User u = User.builder()
            .id(UUID.randomUUID())
            .nickname("alice")
            .createdAt(initial)
            .updatedAt(initial)
            .build();

        u.updateProfile(null, later);

        assertThat(u.getNickname()).isEqualTo("alice");
        assertThat(u.getUpdatedAt()).isEqualTo(later);
    }
}
