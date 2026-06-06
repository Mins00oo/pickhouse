package app.pickhouse.domain.photo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "photos")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;
    @Column(name = "house_id", columnDefinition = "CHAR(36)") private UUID houseId;

    @Column(name = "object_key", nullable = false) private String objectKey;
    @Column(name = "remote_url", nullable = false) private String remoteUrl;
    @Column(name = "content_type") private String contentType;
    @Column(name = "taken_at") private Instant takenAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; }

    public void linkToHouse(UUID houseId) {
        if (this.houseId != null) {
            throw new IllegalStateException("photo already linked: " + this.id);
        }
        this.houseId = houseId;
    }
}
