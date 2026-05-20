package app.pickhouse.photo.dto;

import app.pickhouse.domain.photo.Photo;

import java.time.Instant;
import java.util.UUID;

public record PhotoDto(
    UUID id,
    UUID houseId,
    UUID residenceId,
    String remoteUrl,
    Instant takenAt,
    Instant createdAt
) {
    public static PhotoDto from(Photo p) {
        return new PhotoDto(
            p.getId(),
            p.getHouseId(),
            p.getResidenceId(),
            p.getRemoteUrl(),
            p.getTakenAt(),
            p.getCreatedAt()
        );
    }
}
