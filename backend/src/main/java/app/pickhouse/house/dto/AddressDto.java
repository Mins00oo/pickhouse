package app.pickhouse.house.dto;

import app.pickhouse.domain.common.Address;

import java.math.BigDecimal;

public record AddressDto(
    String roadAddress,
    String jibunAddress,
    String zonecode,
    BigDecimal latitude,
    BigDecimal longitude,
    String detail
) {
    public static AddressDto from(Address a) {
        if (a == null) return null;
        return new AddressDto(
            a.getRoadAddress(), a.getJibunAddress(), a.getZonecode(),
            a.getLatitude(), a.getLongitude(), a.getDetail()
        );
    }

    public Address toEntity() {
        return Address.builder()
            .roadAddress(roadAddress)
            .jibunAddress(jibunAddress)
            .zonecode(zonecode)
            .latitude(latitude)
            .longitude(longitude)
            .detail(detail)
            .build();
    }
}
