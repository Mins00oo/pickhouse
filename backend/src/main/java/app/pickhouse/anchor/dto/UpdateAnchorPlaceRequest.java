package app.pickhouse.anchor.dto;

import app.pickhouse.domain.anchor.AnchorType;
import app.pickhouse.domain.anchor.TransportMode;
import app.pickhouse.house.dto.AddressDto;
import jakarta.validation.constraints.Size;

public record UpdateAnchorPlaceRequest(
    AddressDto address,
    AnchorType anchorType,
    @Size(max = 100) String label,
    TransportMode transport,
    Boolean isPrimary
) {}
