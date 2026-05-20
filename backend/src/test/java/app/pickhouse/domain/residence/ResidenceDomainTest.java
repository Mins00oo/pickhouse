package app.pickhouse.domain.residence;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ResidenceDomainTest {

    private static Residence newResidence(Instant now) {
        return Residence.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .name("망원동 자취방")
            .isFavorite(false)
            .isCurrent(false)
            .contractStartDate(LocalDate.of(2024, 3, 1))
            .contractEndDate(LocalDate.of(2026, 2, 28))
            .createdAt(now)
            .updatedAt(now)
            .build();
    }

    @Test
    void softDelete_sets_deletedAt_and_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Residence r = newResidence(t0);

        r.softDelete(t1);

        assertThat(r.getDeletedAt()).isEqualTo(t1);
        assertThat(r.getUpdatedAt()).isEqualTo(t1);
    }

    @Test
    void touch_only_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Residence r = newResidence(t0);

        r.touch(t1);

        assertThat(r.getUpdatedAt()).isEqualTo(t1);
        assertThat(r.getDeletedAt()).isNull();
    }

    @Test
    void makeCurrent_sets_isCurrent_true_and_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Residence r = newResidence(t0);

        r.makeCurrent(t1);

        assertThat(r.isCurrent()).isTrue();
        assertThat(r.getUpdatedAt()).isEqualTo(t1);
    }

    @Test
    void unsetCurrent_sets_isCurrent_false_and_bumps_updatedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Residence r = Residence.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .name("test")
            .isFavorite(false)
            .isCurrent(true)
            .contractStartDate(LocalDate.of(2024, 3, 1))
            .contractEndDate(LocalDate.of(2026, 2, 28))
            .createdAt(t0)
            .updatedAt(t0)
            .build();

        r.unsetCurrent(t1);

        assertThat(r.isCurrent()).isFalse();
        assertThat(r.getUpdatedAt()).isEqualTo(t1);
    }
}
