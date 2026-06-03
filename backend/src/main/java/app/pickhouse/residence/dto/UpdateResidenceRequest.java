package app.pickhouse.residence.dto;

import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.Direction;
import app.pickhouse.domain.house.FloorType;
import app.pickhouse.domain.house.MaintenanceUtility;
import app.pickhouse.domain.house.RoomType;
import app.pickhouse.house.dto.AddressDto;
import app.pickhouse.house.dto.MeterReadingsDto;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record UpdateResidenceRequest(
    @Size(max = 100) String name,
    LocalDate contractStartDate,
    LocalDate contractEndDate,
    String eraLabel,
    Boolean isFavorite,
    Boolean isCurrent,
    AddressDto address,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
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
    String landlordMemo,
    MeterReadingsDto meterReadings,
    UUID contractPhotoId
) {}
