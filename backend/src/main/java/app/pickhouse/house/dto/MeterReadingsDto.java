package app.pickhouse.house.dto;

import java.time.LocalDate;

public record MeterReadingsDto(
    Integer electricity,
    Integer water,
    Integer gas,
    LocalDate recordedAt
) {}
