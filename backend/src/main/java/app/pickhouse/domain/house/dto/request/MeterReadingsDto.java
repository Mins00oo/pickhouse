package app.pickhouse.domain.house.dto.request;

import java.time.LocalDate;

public record MeterReadingsDto(
    Integer electricity,
    Integer water,
    Integer gas,
    LocalDate recordedAt
) {}
