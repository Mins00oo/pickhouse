package app.pickhouse.house.dto;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.JsonMapConverter;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.Direction;
import app.pickhouse.domain.house.FloorType;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.MaintenanceUtility;
import app.pickhouse.domain.house.RoomType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record HouseDto(
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
    public static HouseDto from(House h, JsonListConverter conv, JsonMapConverter mapConv) {
        return from(h, conv, mapConv, List.of());
    }

    public static HouseDto from(House h, JsonListConverter conv, JsonMapConverter mapConv, List<UUID> photoIds) {
        return new HouseDto(
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
