package app.pickhouse.anchor;

import app.pickhouse.anchor.dto.AnchorPlaceDto;
import app.pickhouse.anchor.dto.CreateAnchorPlaceRequest;
import app.pickhouse.anchor.dto.UpdateAnchorPlaceRequest;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.anchor.AnchorPlace;
import app.pickhouse.domain.anchor.AnchorPlaceRepository;
import app.pickhouse.domain.anchor.AnchorType;
import app.pickhouse.domain.anchor.TransportMode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnchorPlaceServiceTest {

    private AnchorPlaceRepository anchors;
    private AnchorPlaceService service;

    @BeforeEach
    void setUp() {
        anchors = mock(AnchorPlaceRepository.class);
        service = new AnchorPlaceService(anchors);
    }

    @Test
    void create_uses_client_generated_id_when_present() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();

        AnchorPlaceDto dto = service.create(userId, create(id, AnchorType.WORKPLACE, false));

        assertThat(dto.id()).isEqualTo(id);
        verify(anchors).save(any(AnchorPlace.class));
    }

    @Test
    void create_rejects_duplicate_client_generated_id() {
        UUID id = UUID.randomUUID();
        when(anchors.existsById(id)).thenReturn(true);

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), create(id, AnchorType.SCHOOL, false)))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void create_primary_clears_other_primary_of_same_type() {
        UUID userId = UUID.randomUUID();
        UUID newId = UUID.randomUUID();
        UUID existingId = UUID.randomUUID();
        Instant now = Instant.now();
        AnchorPlace existing = AnchorPlace.builder()
            .id(existingId).userId(userId)
            .anchorType(AnchorType.WORKPLACE)
            .transport(TransportMode.CAR)
            .isPrimary(true)
            .createdAt(now).updatedAt(now)
            .build();
        when(anchors.findByUserIdAndAnchorTypeAndIsPrimaryTrueAndDeletedAtIsNull(userId, AnchorType.WORKPLACE))
            .thenReturn(List.of(existing));

        service.create(userId, create(newId, AnchorType.WORKPLACE, true));

        assertThat(existing.isPrimary()).isFalse();
    }

    @Test
    void update_changes_fields_and_keeps_others() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        AnchorPlace existing = AnchorPlace.builder()
            .id(id).userId(userId)
            .anchorType(AnchorType.SCHOOL)
            .label("학교")
            .transport(TransportMode.WALK)
            .isPrimary(false)
            .createdAt(now).updatedAt(now)
            .build();
        when(anchors.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.of(existing));

        AnchorPlaceDto dto = service.update(userId, id,
            new UpdateAnchorPlaceRequest(null, null, "새 학교", null, null));

        assertThat(dto.label()).isEqualTo("새 학교");
        assertThat(dto.anchorType()).isEqualTo(AnchorType.SCHOOL);
        assertThat(dto.transport()).isEqualTo(TransportMode.WALK);
    }

    @Test
    void update_unknown_for_other_user_returns_404() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(anchors.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(userId, id,
            new UpdateAnchorPlaceRequest(null, null, "x", null, null)))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void delete_unknown_for_other_user_returns_404() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(anchors.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(userId, id))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void delete_soft_deletes_owned() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        AnchorPlace existing = AnchorPlace.builder()
            .id(id).userId(userId)
            .anchorType(AnchorType.OTHER)
            .transport(TransportMode.CAR)
            .createdAt(now).updatedAt(now)
            .build();
        when(anchors.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.of(existing));

        service.delete(userId, id);

        assertThat(existing.getDeletedAt()).isNotNull();
    }

    private static CreateAnchorPlaceRequest create(UUID id, AnchorType type, boolean isPrimary) {
        return new CreateAnchorPlaceRequest(null, type, "라벨", TransportMode.TRANSIT, isPrimary, id);
    }
}
