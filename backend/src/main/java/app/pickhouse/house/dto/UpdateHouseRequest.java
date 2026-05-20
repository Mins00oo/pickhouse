package app.pickhouse.house.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateHouseRequest(
    AddressDto address,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    LocalDate availableFrom,
    Integer stationDistance,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    @Min(1) @Max(5) Integer waterPressure,
    @Min(1) @Max(5) Integer sunlight,
    @Min(1) @Max(5) Integer noise,
    @Min(1) @Max(5) Integer insulation,
    @Min(1) @Max(5) Integer ventilation,
    @Min(1) @Max(5) Integer moisture,
    @Min(1) @Max(5) Integer neighborhood,
    @Min(1) @Max(5) Integer firstImpression,
    String memo
) {}
