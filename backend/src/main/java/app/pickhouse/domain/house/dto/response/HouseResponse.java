package app.pickhouse.domain.house.dto.response;

import app.pickhouse.global.json.JsonListConverter;
import app.pickhouse.global.json.JsonMapConverter;
import app.pickhouse.domain.house.entity.DealType;
import app.pickhouse.domain.house.entity.Direction;
import app.pickhouse.domain.house.entity.FloorType;
import app.pickhouse.domain.house.entity.House;
import app.pickhouse.domain.house.entity.MaintenanceUtility;
import app.pickhouse.domain.house.entity.RoomType;
import app.pickhouse.domain.house.support.MaintenanceCodes;
import app.pickhouse.global.address.AddressDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record HouseResponse(
    UUID id,
    AddressDto address,
    DealType dealType,
    int deposit,
    int rent,
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
    Integer waterPressure,
    Integer sunlight,
    Integer noise,
    Integer insulation,
    Integer ventilation,
    Integer moisture,
    Integer neighborhood,
    Integer firstImpression,
    String memo,
    String nickname,
    Instant visitedAt,
    Instant contractedAt,
    RoomType roomType,
    FloorType floorType,
    Direction direction,
    List<MaintenanceUtility> maintenanceIncludes,
    Map<String, Integer> utilityEstimates,
    Boolean fullOption,
    List<UUID> photoIds,
    Instant createdAt,
    Instant updatedAt
) {
    public static HouseResponse from(House h, JsonListConverter conv, JsonMapConverter mapConv) {
        return from(h, conv, mapConv, List.of());
    }

    public static HouseResponse from(House h, JsonListConverter conv, JsonMapConverter mapConv, List<UUID> photoIds) {
        return new HouseResponse(
            h.getId(),
            AddressDto.from(h.getAddress()),
            h.getDealType(),
            h.getDeposit(), h.getRent(), h.getMaintenanceFee(),
            h.getArea(), h.getBuiltYear(), h.getFloor(), h.getTotalFloor(),
            h.getAvailableFrom(), h.getStationDistance(),
            h.getRooms(), h.getBathrooms(),
            h.getHasBalcony(), h.getHasElevator(), h.getHasParking(),
            conv.fromJson(h.getOptionsJson()), conv.fromJson(h.getSecurityJson()),
            h.getGarbage(),
            h.getWaterPressure(), h.getSunlight(), h.getNoise(), h.getInsulation(),
            h.getVentilation(), h.getMoisture(), h.getNeighborhood(), h.getFirstImpression(),
            h.getMemo(),
            h.getNickname(), h.getVisitedAt(), h.getContractedAt(),
            h.getRoomType(), h.getFloorType(), h.getDirection(),
            MaintenanceCodes.toEnums(conv.fromJson(h.getMaintenanceIncludesJson())),
            mapConv.fromJson(h.getUtilityEstimatesJson()),
            h.getFullOption(),
            photoIds != null ? photoIds : List.of(), h.getCreatedAt(), h.getUpdatedAt()
        );
    }
}
