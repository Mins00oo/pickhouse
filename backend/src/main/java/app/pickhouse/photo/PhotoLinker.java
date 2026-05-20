package app.pickhouse.photo;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
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
                throw new ApiException(ErrorCode.BAD_REQUEST, e.getMessage());
            }
        }
    }

    public void linkToResidence(UUID userId, Collection<UUID> photoIds, UUID residenceId) {
        for (Photo p : loadOwnedUnique(userId, photoIds)) {
            try {
                p.linkToResidence(residenceId);
            } catch (IllegalStateException e) {
                throw new ApiException(ErrorCode.BAD_REQUEST, e.getMessage());
            }
        }
    }

    private List<Photo> loadOwnedUnique(UUID userId, Collection<UUID> photoIds) {
        if (photoIds == null || photoIds.isEmpty()) return List.of();
        Set<UUID> uniqueIds = new HashSet<>(photoIds);
        List<Photo> found = photos.findByIdInAndUserIdAndDeletedAtIsNull(uniqueIds, userId);
        if (found.size() != uniqueIds.size()) {
            throw new ApiException(ErrorCode.BAD_REQUEST,
                "some photo IDs do not exist or do not belong to user");
        }
        return found;
    }
}
