package app.pickhouse.domain.myplace.dto.request;

import app.pickhouse.domain.myplace.entity.PlaceType;
import app.pickhouse.domain.myplace.entity.TransportMode;
import app.pickhouse.global.address.AddressDto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateMyPlaceRequest(
    AddressDto address,
    @NotNull PlaceType placeType,
    @Size(max = 100) String label,
    @NotNull TransportMode transport,
    Boolean isPrimary,
    UUID id
) {}
