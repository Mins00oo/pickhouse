package app.pickhouse.anchor.dto;

import app.pickhouse.domain.anchor.AnchorPlace;
import app.pickhouse.domain.anchor.AnchorType;
import app.pickhouse.domain.anchor.TransportMode;
import app.pickhouse.house.dto.AddressDto;

import java.time.Instant;
import java.util.UUID;

public record AnchorPlaceDto(
    UUID id,
    AnchorType anchorType,
    String label,
    AddressDto address,
    TransportMode transport,
    boolean isPrimary,
    Instant createdAt,
    Instant updatedAt
) {
    public static AnchorPlaceDto from(AnchorPlace a) {
        return new AnchorPlaceDto(
            a.getId(),
            a.getAnchorType(),
            a.getLabel(),
            AddressDto.from(a.getAddress()),
            a.getTransport(),
            a.isPrimary(),
            a.getCreatedAt(),
            a.getUpdatedAt()
        );
    }
}
