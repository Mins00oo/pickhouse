package app.pickhouse.domain.house.service;

import app.pickhouse.global.json.JsonListConverter;
import app.pickhouse.global.json.JsonMapConverter;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.global.address.Address;
import app.pickhouse.domain.house.entity.House;
import app.pickhouse.domain.house.repository.HouseRepository;
import app.pickhouse.domain.house.support.MaintenanceCodes;
import app.pickhouse.domain.photo.entity.Photo;
import app.pickhouse.domain.photo.repository.PhotoRepository;
import app.pickhouse.domain.house.dto.request.CreateHouseRequest;
import app.pickhouse.domain.house.dto.response.HouseResponse;
import app.pickhouse.domain.house.dto.request.UpdateHouseRequest;
import app.pickhouse.domain.photo.service.PhotoLinker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houses;
    private final JsonListConverter conv;
    private final JsonMapConverter mapConv;
    private final PhotoLinker photoLinker;
    private final PhotoRepository photos;

    @Transactional(readOnly = true)
    public List<HouseResponse> list(UUID userId) {
        return houses.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
            .stream().map(h -> HouseResponse.from(h, conv, mapConv, housePhotoIds(h.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public HouseResponse get(UUID userId, UUID id) {
        House h = findOwned(userId, id);
        return HouseResponse.from(h, conv, mapConv, housePhotoIds(h.getId()));
    }

    @Transactional
    public HouseResponse create(UUID userId, CreateHouseRequest req) {
        Instant now = Instant.now();
        UUID houseId = req.id() != null ? req.id() : UUID.randomUUID();
        if (req.id() != null && houses.existsById(req.id())) {
            throw new BusinessException(ErrorCode.HOUSE_ID_ALREADY_EXISTS);
        }
        House h = House.builder()
            .id(houseId).userId(userId)
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
            .nickname(req.nickname()).visitedAt(req.visitedAt()).contractedAt(req.contractedAt())
            .roomType(req.roomType()).floorType(req.floorType()).direction(req.direction())
            .maintenanceIncludesJson(conv.toJson(MaintenanceCodes.toStrings(req.maintenanceIncludes())))
            .utilityEstimatesJson(mapConv.toJson(req.utilityEstimates()))
            .fullOption(req.fullOption())
            .createdAt(now).updatedAt(now)
            .build();
        houses.save(h);
        if (req.photoIds() != null && !req.photoIds().isEmpty()) {
            photoLinker.linkToHouse(userId, req.photoIds(), h.getId());
        }
        return HouseResponse.from(h, conv, mapConv, req.photoIds() != null ? req.photoIds() : List.of());
    }

    @Transactional
    public HouseResponse update(UUID userId, UUID id, UpdateHouseRequest req) {
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
            .nickname(req.nickname() != null ? req.nickname() : h.getNickname())
            .visitedAt(req.visitedAt() != null ? req.visitedAt() : h.getVisitedAt())
            .contractedAt(req.contractedAt() != null ? req.contractedAt() : h.getContractedAt())
            .roomType(req.roomType() != null ? req.roomType() : h.getRoomType())
            .floorType(req.floorType() != null ? req.floorType() : h.getFloorType())
            .direction(req.direction() != null ? req.direction() : h.getDirection())
            .maintenanceIncludesJson(req.maintenanceIncludes() != null
                ? conv.toJson(MaintenanceCodes.toStrings(req.maintenanceIncludes())) : h.getMaintenanceIncludesJson())
            .utilityEstimatesJson(req.utilityEstimates() != null
                ? mapConv.toJson(req.utilityEstimates()) : h.getUtilityEstimatesJson())
            .fullOption(req.fullOption() != null ? req.fullOption() : h.getFullOption())
            .updatedAt(now)
            .build();
        houses.save(updated);
        return HouseResponse.from(updated, conv, mapConv, housePhotoIds(updated.getId()));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        House h = findOwned(userId, id);
        h.softDelete(Instant.now());
    }

    private House findOwned(UUID userId, UUID id) {
        return houses.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.HOUSE_NOT_FOUND));
    }

    private List<UUID> housePhotoIds(UUID houseId) {
        return photos.findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(houseId)
            .stream()
            .map(Photo::getId)
            .toList();
    }
}
