package app.pickhouse.residence.dto;

import app.pickhouse.domain.house.DealType;
import app.pickhouse.house.dto.AddressDto;
import app.pickhouse.house.dto.MeterReadingsDto;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateResidenceRequest(
    @NotBlank @Size(max = 100) String name,
    @NotNull LocalDate contractStartDate,
    @NotNull LocalDate contractEndDate,
    String eraLabel,
    Boolean isFavorite,
    Boolean isCurrent,
    AddressDto address,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
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
    String memo,
    String landlordMemo,
    MeterReadingsDto meterReadings,
    List<UUID> moveInPhotoIds,
    UUID contractPhotoId,
    UUID id
) {}
