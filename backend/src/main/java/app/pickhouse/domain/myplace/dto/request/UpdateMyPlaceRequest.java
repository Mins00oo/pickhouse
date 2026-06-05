package app.pickhouse.domain.myplace.dto.request;

import app.pickhouse.domain.myplace.entity.PlaceType;
import app.pickhouse.domain.myplace.entity.TransportMode;
import app.pickhouse.global.address.AddressDto;
import jakarta.validation.constraints.Size;

public record UpdateMyPlaceRequest(
    AddressDto address,
    PlaceType placeType,
    @Size(max = 100) String label,
    TransportMode transport,
    Boolean isPrimary
) {}
