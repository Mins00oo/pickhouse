package app.pickhouse.residence.dto;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.house.dto.AddressDto;
import app.pickhouse.house.dto.MeterReadingsDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ResidenceDto(
    UUID id,
    UUID sourceHouseId,
    String name,
    String eraLabel,
    boolean isFavorite,
    boolean isCurrent,
    AddressDto address,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    LocalDate contractStartDate,
    LocalDate contractEndDate,
    String landlordMemo,
    String memo,
    MeterReadingsDto meterReadings,
    UUID contractPhotoId,
    Instant createdAt,
    Instant updatedAt
) {
    public static ResidenceDto from(Residence r, JsonListConverter conv) {
        return new ResidenceDto(
            r.getId(),
            r.getSourceHouseId(),
            r.getName(),
            r.getEraLabel(),
            r.isFavorite(),
            r.isCurrent(),
            AddressDto.from(r.getAddress()),
            r.getDealType(),
            r.getDeposit(), r.getRent(), r.getMaintenanceFee(),
            r.getArea(),
            r.getContractStartDate(), r.getContractEndDate(),
            r.getLandlordMemo(), r.getMemo(),
            buildMeterReadings(r),
            r.getContractPhotoId(),
            r.getCreatedAt(), r.getUpdatedAt()
        );
    }

    private static MeterReadingsDto buildMeterReadings(Residence r) {
        if (r.getMeterElectricity() == null && r.getMeterWater() == null
            && r.getMeterGas() == null && r.getMeterRecordedAt() == null) {
            return null;
        }
        return new MeterReadingsDto(
            r.getMeterElectricity(),
            r.getMeterWater(),
            r.getMeterGas(),
            r.getMeterRecordedAt()
        );
    }
}
