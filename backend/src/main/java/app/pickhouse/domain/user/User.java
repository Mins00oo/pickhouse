package app.pickhouse.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column private String email;
    @Column private String nickname;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;
    @Column(name = "purge_after") private Instant purgeAfter;

    public void softDelete(Instant now, Instant purgeAfter) {
        this.deletedAt = now;
        this.purgeAfter = purgeAfter;
        this.updatedAt = now;
    }

    public void updateProfile(String nickname, Instant now) {
        if (nickname != null) this.nickname = nickname;
        this.updatedAt = now;
    }
}
