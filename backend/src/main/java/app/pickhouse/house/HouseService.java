package app.pickhouse.house;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.common.Address;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.house.dto.CreateHouseRequest;
import app.pickhouse.house.dto.HouseDto;
import app.pickhouse.house.dto.MeterReadingsDto;
import app.pickhouse.house.dto.PromoteToResidenceRequest;
import app.pickhouse.house.dto.UpdateHouseRequest;
import app.pickhouse.photo.PhotoLinker;
import app.pickhouse.residence.dto.ResidenceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houses;
    private final ResidenceRepository residences;
    private final JsonListConverter conv;
    private final PhotoLinker photoLinker;

    @Transactional(readOnly = true)
    public List<HouseDto> list(UUID userId) {
        return houses.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
            .stream().map(h -> HouseDto.from(h, conv)).toList();
    }

    @Transactional(readOnly = true)
    public HouseDto get(UUID userId, UUID id) {
        return HouseDto.from(findOwned(userId, id), conv);
    }

    @Transactional
    public HouseDto create(UUID userId, CreateHouseRequest req) {
        Instant now = Instant.now();
        House h = House.builder()
            .id(UUID.randomUUID()).userId(userId)
            .address(req.address() != null ? req.address().toEntity() : null)
            .dealType(req.dealType()).deposit(req.deposit()).rent(req.rent())
            .maintenanceFee(req.maintenanceFee())
            .area(req.area()).builtYear(req.builtYear())
            .floor(req.floor()).totalFloor(req.totalFloor())
            .availableFrom(req.availableFrom()).stationDistance(req.stationDistance())
            .rooms(req.rooms()).bathrooms(req.bathrooms())
            .hasBalcony(req.hasBalcony()).hasElevator(req.hasElevator()).hasParking(req.hasParking())
            .optionsJson(conv.toJson(req.options())).securityJson(conv.toJson(req.security()))
            .garbage(req.garbage())
            .waterPressure(req.waterPressure()).sunlight(req.sunlight())
            .noise(req.noise()).insulation(req.insulation())
            .ventilation(req.ventilation()).moisture(req.moisture())
            .neighborhood(req.neighborhood()).firstImpression(req.firstImpression())
            .memo(req.memo())
            .createdAt(now).updatedAt(now)
            .build();
        houses.save(h);
        if (req.photoIds() != null && !req.photoIds().isEmpty()) {
            photoLinker.linkToHouse(userId, req.photoIds(), h.getId());
        }
        return HouseDto.from(h, conv);
    }

    @Transactional
    public HouseDto update(UUID userId, UUID id, UpdateHouseRequest req) {
        House h = findOwned(userId, id);
        Instant now = Instant.now();
        Address newAddress = req.address() != null ? req.address().toEntity() : h.getAddress();
        House updated = h.toBuilder()
            .address(newAddress)
            .dealType(req.dealType() != null ? req.dealType() : h.getDealType())
            .deposit(req.deposit() != null ? req.deposit() : h.getDeposit())
            .rent(req.rent() != null ? req.rent() : h.getRent())
            .maintenanceFee(req.maintenanceFee() != null ? req.maintenanceFee() : h.getMaintenanceFee())
            .area(req.area() != null ? req.area() : h.getArea())
            .builtYear(req.builtYear() != null ? req.builtYear() : h.getBuiltYear())
            .floor(req.floor() != null ? req.floor() : h.getFloor())
            .totalFloor(req.totalFloor() != null ? req.totalFloor() : h.getTotalFloor())
            .availableFrom(req.availableFrom() != null ? req.availableFrom() : h.getAvailableFrom())
            .stationDistance(req.stationDistance() != null ? req.stationDistance() : h.getStationDistance())
            .rooms(req.rooms() != null ? req.rooms() : h.getRooms())
            .bathrooms(req.bathrooms() != null ? req.bathrooms() : h.getBathrooms())
            .hasBalcony(req.hasBalcony() != null ? req.hasBalcony() : h.getHasBalcony())
            .hasElevator(req.hasElevator() != null ? req.hasElevator() : h.getHasElevator())
            .hasParking(req.hasParking() != null ? req.hasParking() : h.getHasParking())
            .optionsJson(req.options() != null ? conv.toJson(req.options()) : h.getOptionsJson())
            .securityJson(req.security() != null ? conv.toJson(req.security()) : h.getSecurityJson())
            .garbage(req.garbage() != null ? req.garbage() : h.getGarbage())
            .waterPressure(req.waterPressure() != null ? req.waterPressure() : h.getWaterPressure())
            .sunlight(req.sunlight() != null ? req.sunlight() : h.getSunlight())
            .noise(req.noise() != null ? req.noise() : h.getNoise())
            .insulation(req.insulation() != null ? req.insulation() : h.getInsulation())
            .ventilation(req.ventilation() != null ? req.ventilation() : h.getVentilation())
            .moisture(req.moisture() != null ? req.moisture() : h.getMoisture())
            .neighborhood(req.neighborhood() != null ? req.neighborhood() : h.getNeighborhood())
            .firstImpression(req.firstImpression() != null ? req.firstImpression() : h.getFirstImpression())
            .memo(req.memo() != null ? req.memo() : h.getMemo())
            .updatedAt(now)
            .build();
        houses.save(updated);
        return HouseDto.from(updated, conv);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        House h = findOwned(userId, id);
        h.softDelete(Instant.now());
    }

    @Transactional
    public ResidenceDto promoteToResidence(UUID userId, UUID houseId, PromoteToResidenceRequest req) {
        House h = findOwned(userId, houseId);
        Instant now = Instant.now();
        MeterReadingsDto m = req.meterReadings();
        Residence r = Residence.builder()
            .id(UUID.randomUUID())
            .userId(userId)
            .sourceHouseId(h.getId())
            .name(req.name())
            .eraLabel(req.eraLabel())
            .isFavorite(Boolean.TRUE.equals(req.isFavorite()))
            .address(h.getAddress())
            .dealType(h.getDealType()).deposit(h.getDeposit()).rent(h.getRent())
            .maintenanceFee(h.getMaintenanceFee())
            .area(h.getArea()).builtYear(h.getBuiltYear())
            .floor(h.getFloor()).totalFloor(h.getTotalFloor())
            .rooms(h.getRooms()).bathrooms(h.getBathrooms())
            .hasBalcony(h.getHasBalcony()).hasElevator(h.getHasElevator()).hasParking(h.getHasParking())
            .optionsJson(h.getOptionsJson()).securityJson(h.getSecurityJson())
            .garbage(h.getGarbage())
            .waterPressure(h.getWaterPressure()).sunlight(h.getSunlight())
            .noise(h.getNoise()).insulation(h.getInsulation())
            .ventilation(h.getVentilation()).moisture(h.getMoisture())
            .neighborhood(h.getNeighborhood()).firstImpression(h.getFirstImpression())
            .memo(h.getMemo())
            .contractStartDate(req.contractStartDate())
            .contractEndDate(req.contractEndDate())
            .landlordMemo(req.landlordMemo())
            .isCurrent(Boolean.TRUE.equals(req.isCurrent()))
            .contractPhotoId(req.contractPhotoId())
            .moveInPhotoIdsJson(conv.toJson(uuidStrings(req.moveInPhotoIds())))
            .meterElectricity(m != null ? m.electricity() : null)
            .meterWater(m != null ? m.water() : null)
            .meterGas(m != null ? m.gas() : null)
            .meterRecordedAt(m != null ? m.recordedAt() : null)
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);
        linkResidencePhotos(userId, r.getId(), req.moveInPhotoIds(), req.contractPhotoId());
        h.markPromoted(now);
        return ResidenceDto.from(r, conv);
    }

    private static List<String> uuidStrings(List<UUID> ids) {
        if (ids == null) return null;
        List<String> out = new ArrayList<>(ids.size());
        for (UUID id : ids) out.add(id.toString());
        return out;
    }

    private void linkResidencePhotos(UUID userId, UUID residenceId, List<UUID> moveInPhotoIds, UUID contractPhotoId) {
        List<UUID> all = new ArrayList<>();
        if (moveInPhotoIds != null) all.addAll(moveInPhotoIds);
        if (contractPhotoId != null && !all.contains(contractPhotoId)) all.add(contractPhotoId);
        if (!all.isEmpty()) {
            photoLinker.linkToResidence(userId, all, residenceId);
        }
    }

    private House findOwned(UUID userId, UUID id) {
        return houses.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "house not found"));
    }
}
