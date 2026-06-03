package app.pickhouse.residence;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.JsonMapConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.photo.PhotoLinker;
import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResidenceServiceTest {

    private ResidenceRepository residences;
    private PhotoRepository photos;
    private ResidenceService service;

    @BeforeEach
    void setUp() {
        residences = mock(ResidenceRepository.class);
        photos = mock(PhotoRepository.class);
        ObjectMapper om = new ObjectMapper();
        service = new ResidenceService(
            residences,
            new JsonListConverter(om),
            new JsonMapConverter(om),
            mock(PhotoLinker.class),
            photos
        );
    }

    @Test
    void create_uses_client_generated_id_when_present() {
        UUID userId = UUID.randomUUID();
        UUID requestedResidenceId = UUID.randomUUID();

        ResidenceDto dto = service.create(userId, minimalCreate(requestedResidenceId, List.of(), null));

        assertThat(dto.id()).isEqualTo(requestedResidenceId);
        verify(residences).save(any(Residence.class));
    }

    @Test
    void create_rejects_duplicate_client_generated_id() {
        UUID requestedResidenceId = UUID.randomUUID();
        when(residences.existsById(requestedResidenceId)).thenReturn(true);

        assertThatThrownBy(() -> service.create(
            UUID.randomUUID(),
            minimalCreate(requestedResidenceId, List.of(), null)
        ))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void get_includes_general_photo_ids_and_full_house_fields() {
        UUID userId = UUID.randomUUID();
        UUID residenceId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        Instant now = Instant.now();
        Residence residence = Residence.builder()
            .id(residenceId)
            .userId(userId)
            .name("current")
            .dealType(DealType.WOLSE)
            .deposit(1000)
            .rent(60)
            .builtYear(2018)
            .floor(3)
            .totalFloor(5)
            .rooms(1)
            .bathrooms(1)
            .waterPressure(4)
            .contractStartDate(LocalDate.of(2025, 1, 1))
            .contractEndDate(LocalDate.of(2027, 1, 1))
            .createdAt(now)
            .updatedAt(now)
            .build();
        when(residences.findByIdAndUserIdAndDeletedAtIsNull(residenceId, userId))
            .thenReturn(Optional.of(residence));
        when(photos.findByResidenceIdAndDeletedAtIsNullOrderByCreatedAtAsc(residenceId))
            .thenReturn(List.of(photo(photoId, userId, residenceId)));

        ResidenceDto dto = service.get(userId, residenceId);

        assertThat(dto.photoIds()).containsExactly(photoId);
        assertThat(dto.builtYear()).isEqualTo(2018);
        assertThat(dto.floor()).isEqualTo(3);
        assertThat(dto.waterPressure()).isEqualTo(4);
    }

    private static CreateResidenceRequest minimalCreate(
        UUID id,
        List<UUID> moveInPhotoIds,
        UUID contractPhotoId
    ) {
        return new CreateResidenceRequest(
            "current",
            LocalDate.of(2025, 1, 1),
            LocalDate.of(2027, 1, 1),
            null,
            null,
            true,
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
            // ── 위저드 신규 필드: nickname, visitedAt, contractedAt, roomType,
            //    floorType, direction, maintenanceIncludes, utilityEstimates, fullOption ──
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            moveInPhotoIds,
            contractPhotoId,
            id
        );
    }

    private static Photo photo(UUID id, UUID userId, UUID residenceId) {
        return Photo.builder()
            .id(id)
            .userId(userId)
            .residenceId(residenceId)
            .objectKey(id + ".jpg")
            .remoteUrl("http://localhost:8080/files/" + id + ".jpg")
            .createdAt(Instant.now())
            .build();
    }
}
