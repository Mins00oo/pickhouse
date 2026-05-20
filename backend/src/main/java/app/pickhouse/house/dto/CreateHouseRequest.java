package app.pickhouse.house.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateHouseRequest(
    AddressDto address,
    @NotNull DealType dealType,
    @Min(0) int deposit,
    @Min(0) int rent,
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
