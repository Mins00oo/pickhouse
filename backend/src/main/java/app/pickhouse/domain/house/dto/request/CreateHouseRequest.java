package app.pickhouse.domain.house.dto.request;

import app.pickhouse.domain.house.entity.DealType;
import app.pickhouse.domain.house.entity.Direction;
import app.pickhouse.domain.house.entity.FloorType;
import app.pickhouse.domain.house.entity.MaintenanceUtility;
import app.pickhouse.domain.house.entity.RoomType;
import app.pickhouse.global.address.AddressDto;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CreateHouseRequest(
    AddressDto address,
    @NotNull DealType dealType,
    @Min(0) int deposit,
    @Min(0) int rent,
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
    // 컨디션 3단계(1=나쁨,2=보통,3=좋음)
    @Min(1) @Max(3) Integer waterPressure,
    // deprecated: 앱이 향(direction)으로 대체 — 더 이상 전송하지 않음. 컬럼/필드는 보존.
    @Min(1) @Max(3) Integer sunlight,
    @Min(1) @Max(3) Integer noise,
    // deprecated: 앱 미사용. 컬럼/필드는 보존.
    @Min(1) @Max(3) Integer insulation,
    @Min(1) @Max(3) Integer ventilation,
    @Min(1) @Max(3) Integer moisture,
    // deprecated: 앱 미사용. 컬럼/필드는 보존.
    @Min(1) @Max(3) Integer neighborhood,
    // deprecated: 앱 미사용. 컬럼/필드는 보존.
    @Min(1) @Max(3) Integer firstImpression,
    String memo,
    // ── 집 추가 위저드 신규 필드 ──
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
    UUID id
) {}
