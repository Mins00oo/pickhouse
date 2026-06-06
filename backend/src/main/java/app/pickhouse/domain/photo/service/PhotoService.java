package app.pickhouse.domain.photo.service;

import app.pickhouse.domain.house.repository.HouseRepository;
import app.pickhouse.domain.photo.dto.response.PhotoResponse;
import app.pickhouse.domain.photo.entity.Photo;
import app.pickhouse.domain.photo.repository.PhotoRepository;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.global.storage.LocalStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final LocalStorageService storage;
    private final PhotoRepository photos;
    private final HouseRepository houses;

    @Transactional(readOnly = true)
    public List<PhotoResponse> listForHouse(UUID userId, UUID houseId) {
        houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.HOUSE_NOT_FOUND));
        return photos.findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(houseId)
            .stream().map(PhotoResponse::from).toList();
    }

    @Transactional
    public PhotoResponse upload(UUID userId, MultipartFile file, UUID houseId, Instant takenAt) {
        return upload(userId, null, file, houseId, takenAt);
    }

    @Transactional
    public PhotoResponse upload(UUID userId, UUID requestedPhotoId, MultipartFile file,
                                UUID houseId, Instant takenAt) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PHOTO_FILE_REQUIRED);
        }
        if (houseId != null) {
            houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.HOUSE_NOT_FOUND));
        }

        UUID photoId = requestedPhotoId != null ? requestedPhotoId : UUID.randomUUID();
        if (requestedPhotoId != null && photos.existsById(requestedPhotoId)) {
            throw new BusinessException(ErrorCode.PHOTO_ID_ALREADY_EXISTS);
        }
        LocalStorageService.Stored stored;
        try {
            stored = storage.save(file.getInputStream(), file.getSize(),
                file.getContentType(), photoId);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.PHOTO_UPLOAD_FAILED);
        }

        Photo p = Photo.builder()
            .id(photoId)
            .userId(userId)
            .houseId(houseId)
            .objectKey(stored.objectKey())
            .remoteUrl(stored.remoteUrl())
            .contentType(file.getContentType())
            .takenAt(takenAt)
            .createdAt(Instant.now())
            .build();
        photos.save(p);
        return PhotoResponse.from(p);
    }
}
