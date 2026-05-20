package app.pickhouse.residence;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.house.dto.MeterReadingsDto;
import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.residence.dto.UpdateResidenceRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidenceService {

    private final ResidenceRepository residences;
    private final JsonListConverter conv;

    @Transactional(readOnly = true)
    public List<ResidenceDto> list(UUID userId) {
        return residences.findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(userId)
            .stream().map(r -> ResidenceDto.from(r, conv)).toList();
    }

    @Transactional(readOnly = true)
    public ResidenceDto get(UUID userId, UUID id) {
        return ResidenceDto.from(findOwned(userId, id), conv);
    }

    @Transactional
    public ResidenceDto create(UUID userId, CreateResidenceRequest req) {
        Instant now = Instant.now();
        MeterReadingsDto m = req.meterReadings();
        Residence r = Residence.builder()
            .id(UUID.randomUUID()).userId(userId)
            .name(req.name())
            .eraLabel(req.eraLabel())
            .isFavorite(Boolean.TRUE.equals(req.isFavorite()))
            .isCurrent(Boolean.TRUE.equals(req.isCurrent()))
            .address(req.address() != null ? req.address().toEntity() : null)
            .dealType(req.dealType()).deposit(req.deposit()).rent(req.rent())
            .maintenanceFee(req.maintenanceFee())
            .area(req.area()).builtYear(req.builtYear())
            .floor(req.floor()).totalFloor(req.totalFloor())
            .rooms(req.rooms()).bathrooms(req.bathrooms())
            .hasBalcony(req.hasBalcony()).hasElevator(req.hasElevator()).hasParking(req.hasParking())
            .optionsJson(conv.toJson(req.options())).securityJson(conv.toJson(req.security()))
            .garbage(req.garbage())
            .waterPressure(req.waterPressure()).sunlight(req.sunlight())
            .noise(req.noise()).insulation(req.insulation())
            .ventilation(req.ventilation()).moisture(req.moisture())
            .neighborhood(req.neighborhood()).firstImpression(req.firstImpression())
            .memo(req.memo()).landlordMemo(req.landlordMemo())
            .contractStartDate(req.contractStartDate())
            .contractEndDate(req.contractEndDate())
            .contractPhotoId(req.contractPhotoId())
            .meterElectricity(m != null ? m.electricity() : null)
            .meterWater(m != null ? m.water() : null)
            .meterGas(m != null ? m.gas() : null)
            .meterRecordedAt(m != null ? m.recordedAt() : null)
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);
        return ResidenceDto.from(r, conv);
    }

    @Transactional
    public ResidenceDto update(UUID userId, UUID id, UpdateResidenceRequest req) {
        Residence r = findOwned(userId, id);
        Instant now = Instant.now();
        MeterReadingsDto m = req.meterReadings();
        Residence updated = r.toBuilder()
            .name(req.name() != null ? req.name() : r.getName())
            .eraLabel(req.eraLabel() != null ? req.eraLabel() : r.getEraLabel())
            .isFavorite(req.isFavorite() != null ? req.isFavorite() : r.isFavorite())
            .isCurrent(req.isCurrent() != null ? req.isCurrent() : r.isCurrent())
            .address(req.address() != null ? req.address().toEntity() : r.getAddress())
            .dealType(req.dealType() != null ? req.dealType() : r.getDealType())
            .deposit(req.deposit() != null ? req.deposit() : r.getDeposit())
            .rent(req.rent() != null ? req.rent() : r.getRent())
            .maintenanceFee(req.maintenanceFee() != null ? req.maintenanceFee() : r.getMaintenanceFee())
            .area(req.area() != null ? req.area() : r.getArea())
            .builtYear(req.builtYear() != null ? req.builtYear() : r.getBuiltYear())
            .floor(req.floor() != null ? req.floor() : r.getFloor())
            .totalFloor(req.totalFloor() != null ? req.totalFloor() : r.getTotalFloor())
            .rooms(req.rooms() != null ? req.rooms() : r.getRooms())
            .bathrooms(req.bathrooms() != null ? req.bathrooms() : r.getBathrooms())
            .hasBalcony(req.hasBalcony() != null ? req.hasBalcony() : r.getHasBalcony())
            .hasElevator(req.hasElevator() != null ? req.hasElevator() : r.getHasElevator())
            .hasParking(req.hasParking() != null ? req.hasParking() : r.getHasParking())
            .optionsJson(req.options() != null ? conv.toJson(req.options()) : r.getOptionsJson())
            .securityJson(req.security() != null ? conv.toJson(req.security()) : r.getSecurityJson())
            .garbage(req.garbage() != null ? req.garbage() : r.getGarbage())
            .waterPressure(req.waterPressure() != null ? req.waterPressure() : r.getWaterPressure())
            .sunlight(req.sunlight() != null ? req.sunlight() : r.getSunlight())
            .noise(req.noise() != null ? req.noise() : r.getNoise())
            .insulation(req.insulation() != null ? req.insulation() : r.getInsulation())
            .ventilation(req.ventilation() != null ? req.ventilation() : r.getVentilation())
            .moisture(req.moisture() != null ? req.moisture() : r.getMoisture())
            .neighborhood(req.neighborhood() != null ? req.neighborhood() : r.getNeighborhood())
            .firstImpression(req.firstImpression() != null ? req.firstImpression() : r.getFirstImpression())
            .memo(req.memo() != null ? req.memo() : r.getMemo())
            .landlordMemo(req.landlordMemo() != null ? req.landlordMemo() : r.getLandlordMemo())
            .contractStartDate(req.contractStartDate() != null ? req.contractStartDate() : r.getContractStartDate())
            .contractEndDate(req.contractEndDate() != null ? req.contractEndDate() : r.getContractEndDate())
            .contractPhotoId(req.contractPhotoId() != null ? req.contractPhotoId() : r.getContractPhotoId())
            .meterElectricity(m != null && m.electricity() != null ? m.electricity() : r.getMeterElectricity())
            .meterWater(m != null && m.water() != null ? m.water() : r.getMeterWater())
            .meterGas(m != null && m.gas() != null ? m.gas() : r.getMeterGas())
            .meterRecordedAt(m != null && m.recordedAt() != null ? m.recordedAt() : r.getMeterRecordedAt())
            .updatedAt(now)
            .build();
        residences.save(updated);
        return ResidenceDto.from(updated, conv);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Residence r = findOwned(userId, id);
        r.softDelete(Instant.now());
    }

    private Residence findOwned(UUID userId, UUID id) {
        return residences.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "residence not found"));
    }
}
