package app.pickhouse.photo;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.photo.dto.PhotoDto;
import app.pickhouse.storage.LocalStorageService;
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
    private final ResidenceRepository residences;

    /** 집에 연결된 사진을 조회한다(소유자 검증 포함). 앱에서 사진을 다시 읽어들일 때 사용. */
    @Transactional(readOnly = true)
    public List<PhotoDto> listForHouse(UUID userId, UUID houseId) {
        houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "house not found"));
        return photos.findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(houseId)
            .stream().map(PhotoDto::from).toList();
    }

    /** 거주지에 연결된 사진을 조회한다(소유자 검증 포함). */
    @Transactional(readOnly = true)
    public List<PhotoDto> listForResidence(UUID userId, UUID residenceId) {
        residences.findByIdAndUserIdAndDeletedAtIsNull(residenceId, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "residence not found"));
        return photos.findByResidenceIdAndDeletedAtIsNullOrderByCreatedAtAsc(residenceId)
            .stream().map(PhotoDto::from).toList();
    }

    @Transactional
    public PhotoDto upload(UUID userId, MultipartFile file, UUID houseId, UUID residenceId, Instant takenAt) {
        return upload(userId, null, file, houseId, residenceId, takenAt);
    }

    @Transactional
    public PhotoDto upload(UUID userId, UUID requestedPhotoId, MultipartFile file,
                           UUID houseId, UUID residenceId, Instant takenAt) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "file is required");
        }
        if (houseId != null && residenceId != null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "only one of houseId or residenceId allowed");
        }
        if (houseId != null) {
            houses.findByIdAndUserIdAndDeletedAtIsNull(houseId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "house not found"));
        }
        if (residenceId != null) {
            residences.findByIdAndUserIdAndDeletedAtIsNull(residenceId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "residence not found"));
        }

        UUID photoId = requestedPhotoId != null ? requestedPhotoId : UUID.randomUUID();
        if (requestedPhotoId != null && photos.existsById(requestedPhotoId)) {
            throw new ApiException(ErrorCode.CONFLICT, "photo id already exists");
        }
        LocalStorageService.Stored stored;
        try {
            stored = storage.save(file.getInputStream(), file.getSize(),
                file.getContentType(), photoId);
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "failed to read upload: " + e.getMessage());
        }

        Photo p = Photo.builder()
            .id(photoId)
            .userId(userId)
            .houseId(houseId)
            .residenceId(residenceId)
            .objectKey(stored.objectKey())
            .remoteUrl(stored.remoteUrl())
            .contentType(file.getContentType())
            .takenAt(takenAt)
            .createdAt(Instant.now())
            .build();
        photos.save(p);
        return PhotoDto.from(p);
    }
}
