package app.pickhouse.anchor.dto;

import app.pickhouse.domain.anchor.AnchorType;
import app.pickhouse.domain.anchor.TransportMode;
import app.pickhouse.house.dto.AddressDto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAnchorPlaceRequest(
    AddressDto address,
    @NotNull AnchorType anchorType,
    @Size(max = 100) String label,
    @NotNull TransportMode transport,
    Boolean isPrimary,
    UUID id
) {}
