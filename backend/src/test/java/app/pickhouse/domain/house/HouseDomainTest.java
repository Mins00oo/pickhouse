package app.pickhouse.domain.house;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class HouseDomainTest {

    private static House newHouse(Instant now) {
        return House.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .dealType(DealType.WOLSE)
            .deposit(1000)
            .rent(50)
            .createdAt(now)
            .updatedAt(now)
            .build();
    }

    @Test
    void softDelete_sets_deletedAt_and_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        House h = newHouse(t0);

        h.softDelete(t1);

        assertThat(h.getDeletedAt()).isEqualTo(t1);
        assertThat(h.getUpdatedAt()).isEqualTo(t1);
    }

    @Test
    void markPromoted_sets_promotedAt_and_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        House h = newHouse(t0);

        h.markPromoted(t1);

        assertThat(h.getPromotedAt()).isEqualTo(t1);
        assertThat(h.getUpdatedAt()).isEqualTo(t1);
    }

    @Test
    void touch_only_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        House h = newHouse(t0);

        h.touch(t1);

        assertThat(h.getUpdatedAt()).isEqualTo(t1);
        assertThat(h.getDeletedAt()).isNull();
        assertThat(h.getPromotedAt()).isNull();
    }
}
