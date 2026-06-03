package app.pickhouse.residence;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.JsonMapConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.house.dto.MaintenanceCodes;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.house.dto.MeterReadingsDto;
import app.pickhouse.photo.PhotoLinker;
import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.residence.dto.UpdateResidenceRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidenceService {

    private final ResidenceRepository residences;
    private final JsonListConverter conv;
    private final JsonMapConverter mapConv;
    private final PhotoLinker photoLinker;
    private final PhotoRepository photos;

    @Transactional(readOnly = true)
    public List<ResidenceDto> list(UUID userId) {
        return residences.findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(userId)
            .stream().map(r -> ResidenceDto.from(r, conv, mapConv, residencePhotoIds(r.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public ResidenceDto get(UUID userId, UUID id) {
        Residence r = findOwned(userId, id);
        return ResidenceDto.from(r, conv, mapConv, residencePhotoIds(r.getId()));
    }

    @Transactional
    public ResidenceDto create(UUID userId, CreateResidenceRequest req) {
        Instant now = Instant.now();
        MeterReadingsDto m = req.meterReadings();
        UUID residenceId = req.id() != null ? req.id() : UUID.randomUUID();
        if (req.id() != null && residences.existsById(req.id())) {
            throw new ApiException(ErrorCode.CONFLICT, "residence id already exists");
        }
        Residence r = Residence.builder()
            .id(residenceId).userId(userId)
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
            .nickname(req.nickname()).visitedAt(req.visitedAt()).contractedAt(req.contractedAt())
            .roomType(req.roomType()).floorType(req.floorType()).direction(req.direction())
            .maintenanceIncludesJson(conv.toJson(MaintenanceCodes.toStrings(req.maintenanceIncludes())))
            .utilityEstimatesJson(mapConv.toJson(req.utilityEstimates()))
            .fullOption(req.fullOption())
            .contractStartDate(req.contractStartDate())
            .contractEndDate(req.contractEndDate())
            .contractPhotoId(req.contractPhotoId())
            .moveInPhotoIdsJson(conv.toJson(uuidStrings(req.moveInPhotoIds())))
            .meterElectricity(m != null ? m.electricity() : null)
            .meterWater(m != null ? m.water() : null)
            .meterGas(m != null ? m.gas() : null)
            .meterRecordedAt(m != null ? m.recordedAt() : null)
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);
        linkPhotos(userId, r.getId(), req.moveInPhotoIds(), req.contractPhotoId());
        return ResidenceDto.from(r, conv, mapConv, List.of());
    }

    private static List<String> uuidStrings(List<UUID> ids) {
        if (ids == null) return null;
        List<String> out = new ArrayList<>(ids.size());
        for (UUID id : ids) out.add(id.toString());
        return out;
    }

    private void linkPhotos(UUID userId, UUID residenceId, List<UUID> moveInPhotoIds, UUID contractPhotoId) {
        List<UUID> all = new ArrayList<>();
        if (moveInPhotoIds != null) all.addAll(moveInPhotoIds);
        if (contractPhotoId != null && !all.contains(contractPhotoId)) all.add(contractPhotoId);
        if (!all.isEmpty()) {
            photoLinker.linkToResidence(userId, all, residenceId);
        }
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
            .nickname(req.nickname() != null ? req.nickname() : r.getNickname())
            .visitedAt(req.visitedAt() != null ? req.visitedAt() : r.getVisitedAt())
            .contractedAt(req.contractedAt() != null ? req.contractedAt() : r.getContractedAt())
            .roomType(req.roomType() != null ? req.roomType() : r.getRoomType())
            .floorType(req.floorType() != null ? req.floorType() : r.getFloorType())
            .direction(req.direction() != null ? req.direction() : r.getDirection())
            .maintenanceIncludesJson(req.maintenanceIncludes() != null
                ? conv.toJson(MaintenanceCodes.toStrings(req.maintenanceIncludes())) : r.getMaintenanceIncludesJson())
            .utilityEstimatesJson(req.utilityEstimates() != null
                ? mapConv.toJson(req.utilityEstimates()) : r.getUtilityEstimatesJson())
            .fullOption(req.fullOption() != null ? req.fullOption() : r.getFullOption())
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
        return ResidenceDto.from(updated, conv, mapConv, residencePhotoIds(updated.getId()));
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

    private List<UUID> residencePhotoIds(UUID residenceId) {
        return photos.findByResidenceIdAndDeletedAtIsNullOrderByCreatedAtAsc(residenceId)
            .stream()
            .map(Photo::getId)
            .toList();
    }
}
