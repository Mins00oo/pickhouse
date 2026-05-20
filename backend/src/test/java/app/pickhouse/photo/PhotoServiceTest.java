package app.pickhouse.photo;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.photo.dto.PhotoDto;
import app.pickhouse.storage.LocalStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PhotoServiceTest {

    private LocalStorageService storage;
    private PhotoRepository photos;
    private HouseRepository houses;
    private ResidenceRepository residences;
    private PhotoService service;

    @BeforeEach
    void setUp() {
        storage = mock(LocalStorageService.class);
        photos = mock(PhotoRepository.class);
        houses = mock(HouseRepository.class);
        residences = mock(ResidenceRepository.class);
        service = new PhotoService(storage, photos, houses, residences);
    }

    private MockMultipartFile jpeg() {
        return new MockMultipartFile("file", "x.jpg", "image/jpeg", "bytes".getBytes());
    }

    @Test
    void upload_with_no_parent_saves_photo_unparented() {
        UUID userId = UUID.randomUUID();
        when(storage.save(any(), anyLong(), eq("image/jpeg"), any(UUID.class)))
            .thenReturn(new LocalStorageService.Stored("ABC.jpg", "https://api/files/ABC.jpg"));

        PhotoDto dto = service.upload(userId, jpeg(), null, null, null);

        assertThat(dto.houseId()).isNull();
        assertThat(dto.residenceId()).isNull();
        assertThat(dto.remoteUrl()).isEqualTo("https://api/files/ABC.jpg");
        ArgumentCaptor<Photo> captor = ArgumentCaptor.forClass(Photo.class);
        verify(photos).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void upload_with_houseId_validates_ownership_then_saves_with_houseId() {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId))
            .thenReturn(Optional.of(House.builder().id(houseId).userId(userId)
                .dealType(DealType.JEONSE).deposit(1).rent(0)
                .createdAt(Instant.now()).updatedAt(Instant.now()).build()));
        when(storage.save(any(), anyLong(), any(), any(UUID.class)))
            .thenReturn(new LocalStorageService.Stored("k.jpg", "url"));

        PhotoDto dto = service.upload(userId, jpeg(), houseId, null, null);

        assertThat(dto.houseId()).isEqualTo(houseId);
    }

    @Test
    void upload_with_houseId_not_owned_throws_NOT_FOUND() {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.upload(userId, jpeg(), houseId, null, null))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.NOT_FOUND);
        verify(storage, never()).save(any(), anyLong(), any(), any(UUID.class));
    }

    @Test
    void upload_with_both_houseId_and_residenceId_throws_BAD_REQUEST() {
        UUID userId = UUID.randomUUID();
        assertThatThrownBy(() -> service.upload(userId, jpeg(),
                UUID.randomUUID(), UUID.randomUUID(), null))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.BAD_REQUEST);
    }

    @Test
    void upload_with_empty_file_throws_BAD_REQUEST() {
        UUID userId = UUID.randomUUID();
        MockMultipartFile empty = new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> service.upload(userId, empty, null, null, null))
            .isInstanceOf(ApiException.class)
            .extracting(e -> ((ApiException) e).getCode())
            .isEqualTo(ErrorCode.BAD_REQUEST);
    }
}
