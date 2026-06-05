package app.pickhouse.domain.photo.service;

import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.domain.photo.entity.Photo;
import app.pickhouse.domain.photo.repository.PhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PhotoLinkerTest {

    private PhotoRepository photos;
    private PhotoLinker linker;

    @BeforeEach
    void setUp() {
        photos = mock(PhotoRepository.class);
        linker = new PhotoLinker(photos);
    }

    private Photo unparented(UUID userId, UUID id) {
        return Photo.builder()
            .id(id).userId(userId)
            .objectKey(id + ".jpg").remoteUrl("https://x/" + id + ".jpg")
            .createdAt(Instant.now())
            .build();
    }

    @Test
    void linkToHouse_sets_houseId_on_each_photo() {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();
        Photo photo1 = unparented(userId, p1);
        Photo photo2 = unparented(userId, p2);
        when(photos.findByIdInAndUserIdAndDeletedAtIsNull(any(), eq(userId)))
            .thenReturn(List.of(photo1, photo2));

        linker.linkToHouse(userId, List.of(p1, p2), houseId);

        assertThat(photo1.getHouseId()).isEqualTo(houseId);
        assertThat(photo2.getHouseId()).isEqualTo(houseId);
    }

    @Test
    void linkToHouse_with_empty_list_is_noop() {
        UUID userId = UUID.randomUUID();
        linker.linkToHouse(userId, List.of(), UUID.randomUUID());
        linker.linkToHouse(userId, null, UUID.randomUUID());
    }

    @Test
    void linkToHouse_throws_when_some_photos_not_found() {
        UUID userId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();
        when(photos.findByIdInAndUserIdAndDeletedAtIsNull(any(), eq(userId)))
            .thenReturn(List.of(unparented(userId, p1)));

        assertThatThrownBy(() -> linker.linkToHouse(userId, List.of(p1, p2), UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.PHOTO_OWNER_NOT_FOUND);
    }

    @Test
    void linkToHouse_throws_when_photo_already_linked() {
        UUID userId = UUID.randomUUID();
        UUID otherHouseId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        Photo alreadyLinked = Photo.builder()
            .id(p1).userId(userId).houseId(otherHouseId)
            .objectKey("x.jpg").remoteUrl("https://x").createdAt(Instant.now())
            .build();
        when(photos.findByIdInAndUserIdAndDeletedAtIsNull(any(), eq(userId)))
            .thenReturn(List.of(alreadyLinked));

        assertThatThrownBy(() -> linker.linkToHouse(userId, List.of(p1), UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.PHOTO_TARGET_CONFLICT);
    }

    @Test
    void linkToHouse_dedupes_input_ids() {
        UUID userId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        Photo photo = unparented(userId, p1);
        when(photos.findByIdInAndUserIdAndDeletedAtIsNull(any(), eq(userId)))
            .thenReturn(List.of(photo));

        linker.linkToHouse(userId, List.of(p1, p1), UUID.randomUUID());

        assertThat(photo.getHouseId()).isNotNull();
    }
}
