package app.pickhouse.house.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PromoteToResidenceRequest(
    @NotBlank @Size(max = 100) String name,
    @NotNull LocalDate contractStartDate,
    @NotNull LocalDate contractEndDate,
    String eraLabel,
    Boolean isFavorite,
    Boolean isCurrent,
    String landlordMemo,
    MeterReadingsDto meterReadings,
    List<UUID> moveInPhotoIds,
    UUID contractPhotoId
) {}
