package app.pickhouse.domain.residence;

import app.pickhouse.domain.common.Address;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.Direction;
import app.pickhouse.domain.house.FloorType;
import app.pickhouse.domain.house.RoomType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "residences")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Residence {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;
    @Column(name = "source_house_id", columnDefinition = "CHAR(36)") private UUID sourceHouseId;

    @Column(nullable = false, length = 100) private String name;
    @Column(name = "era_label", length = 100) private String eraLabel;
    @Column(name = "is_favorite", nullable = false) private boolean isFavorite;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "roadAddress",  column = @Column(name = "address_road_address")),
        @AttributeOverride(name = "jibunAddress", column = @Column(name = "address_jibun_address")),
        @AttributeOverride(name = "zonecode",     column = @Column(name = "address_zonecode")),
        @AttributeOverride(name = "latitude",     column = @Column(name = "address_latitude")),
        @AttributeOverride(name = "longitude",    column = @Column(name = "address_longitude")),
        @AttributeOverride(name = "detail",       column = @Column(name = "address_detail"))
    })
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(name = "deal_type")
    private DealType dealType;

    @Column private Integer deposit;
    @Column private Integer rent;
    @Column(name = "maintenance_fee") private Integer maintenanceFee;
    @Column private BigDecimal area;
    @Column(name = "built_year") private Integer builtYear;
    @Column private Integer floor;
    @Column(name = "total_floor") private Integer totalFloor;

    @Column private Integer rooms;
    @Column private Integer bathrooms;
    @Column(name = "has_balcony") private Boolean hasBalcony;
    @Column(name = "has_elevator") private Boolean hasElevator;
    @Column(name = "has_parking") private Boolean hasParking;

    @Column(name = "options_json", columnDefinition = "json") private String optionsJson;
    @Column(name = "security_json", columnDefinition = "json") private String securityJson;
    @Column private String garbage;

    @JdbcTypeCode(SqlTypes.TINYINT) @Column(name = "water_pressure") private Integer waterPressure;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer sunlight;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer noise;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer insulation;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer ventilation;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer moisture;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column private Integer neighborhood;
    @JdbcTypeCode(SqlTypes.TINYINT) @Column(name = "first_impression") private Integer firstImpression;

    @Column(columnDefinition = "TEXT") private String memo;

    // ── 집 추가 위저드 신규 필드 (House와 동일) ──
    @Column(length = 100) private String nickname;
    @Column(name = "visited_at") private Instant visitedAt;
    @Column(name = "contracted_at") private Instant contractedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type")
    private RoomType roomType;

    @Enumerated(EnumType.STRING)
    @Column(name = "floor_type")
    private FloorType floorType;

    @Enumerated(EnumType.STRING)
    @Column
    private Direction direction;

    @Column(name = "maintenance_includes_json", columnDefinition = "json") private String maintenanceIncludesJson;
    @Column(name = "utility_estimates_json", columnDefinition = "json") private String utilityEstimatesJson;
    @Column(name = "full_option") private Boolean fullOption;

    @Column(name = "contract_start_date", nullable = false) private LocalDate contractStartDate;
    @Column(name = "contract_end_date", nullable = false) private LocalDate contractEndDate;
    @Column(name = "landlord_memo", columnDefinition = "TEXT") private String landlordMemo;
    @Column(name = "is_current", nullable = false) private boolean isCurrent;

    @Column(name = "move_in_photo_ids_json", columnDefinition = "json") private String moveInPhotoIdsJson;
    @Column(name = "contract_photo_id", columnDefinition = "CHAR(36)") private UUID contractPhotoId;

    @Column(name = "meter_electricity") private Integer meterElectricity;
    @Column(name = "meter_water") private Integer meterWater;
    @Column(name = "meter_gas") private Integer meterGas;
    @Column(name = "meter_recorded_at") private LocalDate meterRecordedAt;

    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; this.updatedAt = now; }
    public void touch(Instant now) { this.updatedAt = now; }
    public void makeCurrent(Instant now) { this.isCurrent = true; this.updatedAt = now; }
    public void unsetCurrent(Instant now) { this.isCurrent = false; this.updatedAt = now; }
}
