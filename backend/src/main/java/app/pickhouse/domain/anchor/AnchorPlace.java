package app.pickhouse.domain.anchor;

import app.pickhouse.domain.common.Address;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "anchor_places")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AnchorPlace {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;

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
    @Column(name = "anchor_type", nullable = false)
    private AnchorType anchorType;

    @Column(length = 100) private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportMode transport;

    @Column(name = "is_primary", nullable = false) private boolean isPrimary;

    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; this.updatedAt = now; }
    public void touch(Instant now) { this.updatedAt = now; }
    public void clearPrimary(Instant now) { this.isPrimary = false; this.updatedAt = now; }
}
