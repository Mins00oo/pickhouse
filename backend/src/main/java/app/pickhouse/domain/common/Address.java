package app.pickhouse.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Address {
    @Column(name = "road_address") private String roadAddress;
    @Column(name = "jibun_address") private String jibunAddress;
    @Column(name = "zonecode") private String zonecode;
    @Column(name = "latitude") private BigDecimal latitude;
    @Column(name = "longitude") private BigDecimal longitude;
    @Column(name = "detail") private String detail;
}
