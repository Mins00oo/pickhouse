package app.pickhouse.domain.myplace.service;

import app.pickhouse.domain.myplace.dto.response.MyPlaceResponse;
import app.pickhouse.domain.myplace.dto.request.CreateMyPlaceRequest;
import app.pickhouse.domain.myplace.dto.request.UpdateMyPlaceRequest;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.domain.myplace.entity.MyPlace;
import app.pickhouse.domain.myplace.repository.MyPlaceRepository;
import app.pickhouse.domain.myplace.entity.PlaceType;
import app.pickhouse.domain.myplace.entity.TransportMode;
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

class MyPlaceServiceTest {

    private MyPlaceRepository myPlaces;
    private MyPlaceService service;

    @BeforeEach
    void setUp() {
        myPlaces = mock(MyPlaceRepository.class);
        service = new MyPlaceService(myPlaces);
    }

    @Test
    void create_uses_client_generated_id_when_present() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();

        MyPlaceResponse dto = service.create(userId, create(id, PlaceType.WORKPLACE, false));

        assertThat(dto.id()).isEqualTo(id);
        verify(myPlaces).save(any(MyPlace.class));
    }

    @Test
    void create_rejects_duplicate_client_generated_id() {
        UUID id = UUID.randomUUID();
        when(myPlaces.existsById(id)).thenReturn(true);

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), create(id, PlaceType.SCHOOL, false)))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.MY_PLACE_ID_ALREADY_EXISTS);
    }

    @Test
    void create_primary_clears_other_primary_of_same_type() {
        UUID userId = UUID.randomUUID();
        UUID newId = UUID.randomUUID();
        UUID existingId = UUID.randomUUID();
        Instant now = Instant.now();
        MyPlace existing = MyPlace.builder()
            .id(existingId).userId(userId)
            .placeType(PlaceType.WORKPLACE)
            .transport(TransportMode.CAR)
            .isPrimary(true)
            .createdAt(now).updatedAt(now)
            .build();
        when(myPlaces.findByUserIdAndPlaceTypeAndIsPrimaryTrueAndDeletedAtIsNull(userId, PlaceType.WORKPLACE))
            .thenReturn(List.of(existing));

        service.create(userId, create(newId, PlaceType.WORKPLACE, true));

        assertThat(existing.isPrimary()).isFalse();
    }

    @Test
    void update_changes_fields_and_keeps_others() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        MyPlace existing = MyPlace.builder()
            .id(id).userId(userId)
            .placeType(PlaceType.SCHOOL)
            .label("학교")
            .transport(TransportMode.WALK)
            .isPrimary(false)
            .createdAt(now).updatedAt(now)
            .build();
        when(myPlaces.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.of(existing));

        MyPlaceResponse dto = service.update(userId, id,
            new UpdateMyPlaceRequest(null, null, "새 학교", null, null));

        assertThat(dto.label()).isEqualTo("새 학교");
        assertThat(dto.placeType()).isEqualTo(PlaceType.SCHOOL);
        assertThat(dto.transport()).isEqualTo(TransportMode.WALK);
    }

    @Test
    void update_unknown_for_other_user_returns_404() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(myPlaces.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(userId, id,
            new UpdateMyPlaceRequest(null, null, "x", null, null)))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.MY_PLACE_NOT_FOUND);
    }

    @Test
    void delete_unknown_for_other_user_returns_404() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(myPlaces.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(userId, id))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.MY_PLACE_NOT_FOUND);
    }

    @Test
    void delete_soft_deletes_owned() {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        MyPlace existing = MyPlace.builder()
            .id(id).userId(userId)
            .placeType(PlaceType.OTHER)
            .transport(TransportMode.CAR)
            .createdAt(now).updatedAt(now)
            .build();
        when(myPlaces.findByIdAndUserIdAndDeletedAtIsNull(id, userId)).thenReturn(Optional.of(existing));

        service.delete(userId, id);

        assertThat(existing.getDeletedAt()).isNotNull();
    }

    private static CreateMyPlaceRequest create(UUID id, PlaceType type, boolean isPrimary) {
        return new CreateMyPlaceRequest(null, type, "라벨", TransportMode.TRANSIT, isPrimary, id);
    }
}
