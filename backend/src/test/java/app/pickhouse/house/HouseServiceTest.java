package app.pickhouse.house;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.house.dto.CreateHouseRequest;
import app.pickhouse.house.dto.HouseDto;
import app.pickhouse.photo.PhotoLinker;
import com.fasterxml.jackson.databind.ObjectMapper;
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

class HouseServiceTest {

    private HouseRepository houses;
    private ResidenceRepository residences;
    private PhotoRepository photos;
    private PhotoLinker photoLinker;
    private HouseService service;

    @BeforeEach
    void setUp() {
        houses = mock(HouseRepository.class);
        residences = mock(ResidenceRepository.class);
        photos = mock(PhotoRepository.class);
        photoLinker = mock(PhotoLinker.class);
        service = new HouseService(houses, residences, new JsonListConverter(new ObjectMapper()), photoLinker, photos);
    }

    @Test
    void create_uses_client_generated_id_when_present() {
        UUID userId = UUID.randomUUID();
        UUID requestedHouseId = UUID.randomUUID();
        CreateHouseRequest req = minimalCreate(requestedHouseId, List.of());

        HouseDto dto = service.create(userId, req);

        assertThat(dto.id()).isEqualTo(requestedHouseId);
        verify(houses).save(any(House.class));
    }

    @Test
    void create_rejects_duplicate_client_generated_id() {
        UUID requestedHouseId = UUID.randomUUID();
        when(houses.existsById(requestedHouseId)).thenReturn(true);

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), minimalCreate(requestedHouseId, List.of())))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void get_includes_photo_ids_in_created_order() {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        UUID firstPhotoId = UUID.randomUUID();
        UUID secondPhotoId = UUID.randomUUID();
        Instant now = Instant.now();
        House house = House.builder()
            .id(houseId)
            .userId(userId)
            .dealType(DealType.WOLSE)
            .deposit(1000)
            .rent(60)
            .createdAt(now)
            .updatedAt(now)
            .build();
        when(houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)).thenReturn(Optional.of(house));
        when(photos.findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(houseId)).thenReturn(List.of(
            photo(firstPhotoId, userId, houseId),
            photo(secondPhotoId, userId, houseId)
        ));

        HouseDto dto = service.get(userId, houseId);

        assertThat(dto.photoIds()).containsExactly(firstPhotoId, secondPhotoId);
    }

    private static CreateHouseRequest minimalCreate(UUID id, List<UUID> photoIds) {
        return new CreateHouseRequest(
            null,
            DealType.WOLSE,
            1000,
            60,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            photoIds,
            id
        );
    }

    private static Photo photo(UUID id, UUID userId, UUID houseId) {
        return Photo.builder()
            .id(id)
            .userId(userId)
            .houseId(houseId)
            .objectKey(id + ".jpg")
            .remoteUrl("http://localhost:8080/files/" + id + ".jpg")
            .createdAt(Instant.now())
            .build();
    }
}
