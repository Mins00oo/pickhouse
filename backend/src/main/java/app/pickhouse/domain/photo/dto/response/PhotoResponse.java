package app.pickhouse.domain.photo.dto.response;

import app.pickhouse.domain.photo.entity.Photo;

import java.time.Instant;
import java.util.UUID;

public record PhotoResponse(
    UUID id,
    UUID houseId,
    String remoteUrl,
    Instant takenAt,
    Instant createdAt
) {
    public static PhotoResponse from(Photo p) {
        return new PhotoResponse(
            p.getId(),
            p.getHouseId(),
            p.getRemoteUrl(),
            p.getTakenAt(),
            p.getCreatedAt()
        );
    }
}
