package app.pickhouse.domain.photo.service;

import app.pickhouse.domain.photo.entity.Photo;
import app.pickhouse.domain.photo.repository.PhotoRepository;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PhotoLinker {

    private final PhotoRepository photos;

    public void linkToHouse(UUID userId, Collection<UUID> photoIds, UUID houseId) {
        for (Photo p : loadOwnedUnique(userId, photoIds)) {
            try {
                p.linkToHouse(houseId);
            } catch (IllegalStateException e) {
                throw new BusinessException(ErrorCode.PHOTO_TARGET_CONFLICT);
            }
        }
    }

    private List<Photo> loadOwnedUnique(UUID userId, Collection<UUID> photoIds) {
        if (photoIds == null || photoIds.isEmpty()) return List.of();
        Set<UUID> uniqueIds = new HashSet<>(photoIds);
        List<Photo> found = photos.findByIdInAndUserIdAndDeletedAtIsNull(uniqueIds, userId);
        if (found.size() != uniqueIds.size()) {
            throw new BusinessException(ErrorCode.PHOTO_OWNER_NOT_FOUND);
        }
        return found;
    }
}
