package app.pickhouse.domain.photo;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoDomainTest {

    private static Photo newPhoto(Instant now) {
        return Photo.builder()
            .id(UUID.randomUUID())
            .userId(UUID.randomUUID())
            .houseId(UUID.randomUUID())
            .objectKey("users/x/photos/y.jpg")
            .remoteUrl("https://photos.example/x.jpg")
            .createdAt(now)
            .build();
    }

    @Test
    void newly_built_photo_has_no_deletedAt() {
        Photo p = newPhoto(Instant.now());
        assertThat(p.getDeletedAt()).isNull();
    }

    @Test
    void softDelete_sets_deletedAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Photo p = newPhoto(t0);

        p.softDelete(t1);

        assertThat(p.getDeletedAt()).isEqualTo(t1);
    }

    @Test
    void softDelete_does_not_alter_createdAt() {
        Instant t0 = Instant.parse("2026-05-20T00:00:00Z");
        Instant t1 = t0.plusSeconds(60);
        Photo p = newPhoto(t0);

        p.softDelete(t1);

        assertThat(p.getCreatedAt()).isEqualTo(t0);
    }
}
