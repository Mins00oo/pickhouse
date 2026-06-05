package app.pickhouse.domain.myplace.dto.response;

import app.pickhouse.domain.myplace.entity.MyPlace;
import app.pickhouse.domain.myplace.entity.PlaceType;
import app.pickhouse.domain.myplace.entity.TransportMode;
import app.pickhouse.global.address.AddressDto;

import java.time.Instant;
import java.util.UUID;

public record MyPlaceResponse(
    UUID id,
    PlaceType placeType,
    String label,
    AddressDto address,
    TransportMode transport,
    boolean isPrimary,
    Instant createdAt,
    Instant updatedAt
) {
    public static MyPlaceResponse from(MyPlace a) {
        return new MyPlaceResponse(
            a.getId(),
            a.getPlaceType(),
            a.getLabel(),
            AddressDto.from(a.getAddress()),
            a.getTransport(),
            a.isPrimary(),
            a.getCreatedAt(),
            a.getUpdatedAt()
        );
    }
}
