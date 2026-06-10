package app.homes.house.entity;

import app.homes.global.jpa.BaseTimeEntity;
import app.homes.house.photo.entity.Photo;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 집. 값 컬럼 + 좌표 + 코드 컬럼(코드값 직접 저장). 코드 컬럼은 CMCD를 참조하는 규약(물리 FK 없음).
 */
@Getter
@Entity
@Table(name = "house")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class House extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    // 주소 (주소 API 결과)
    @Column(name = "road_address", length = 255)
    private String roadAddress;

    @Column(name = "jibun_address", length = 255)
    private String jibunAddress;

    @Column(name = "zipcode", length = 10)
    private String zipcode;

    @Column(name = "detail_address", length = 255)
    private String detailAddress;

    // 좌표
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // 거래 / 금액 (원 단위)
    @Column(name = "deal_type", length = 20)
    private String dealType;        // HOUSE_DEAL_TYPE

    @Column(name = "deposit")
    private Long deposit;

    @Column(name = "monthly_rent")
    private Long monthlyRent;

    @Column(name = "sale_price")
    private Long salePrice;         // 매매 시에만

    @Column(name = "maintenance_fee")
    private Long maintenanceFee;

    // 스펙
    @Column(name = "exclusive_area", precision = 7, scale = 2)
    private BigDecimal exclusiveArea;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "room_type", length = 20)
    private String roomType;        // HOUSE_ROOM_TYPE

    @Column(name = "house_type", length = 20)
    private String houseType;       // HOUSE_TYPE

    @Column(name = "elevator", length = 1)
    private String elevator;        // HOUSE_ELEVATOR (Y/N)

    @Column(name = "water_pressure", length = 20)
    private String waterPressure;   // HOUSE_WATER

    @Column(name = "sunshine", length = 20)
    private String sunshine;        // HOUSE_SUNSHINE

    @Column(name = "full_option", length = 1)
    private String fullOption;      // HOUSE_FULL_OPTION (Y/N)

    // 기타
    @Column(name = "move_in_date")
    private LocalDate moveInDate;

    @Column(name = "alias", length = 100)
    private String alias;

    @Column(name = "memo", length = 2000)
    private String memo;

    // 사진(자식). 집 삭제 시 사진 row도 cascade 삭제 — 단, 스토리지 파일 삭제는 PhotoService가 별도 처리
    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();
}
