package app.homes.auth.entity;

import app.homes.global.jpa.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 기기당 1행. 회전 시 token_hash/expires_at/last_used_at UPDATE. 원문은 저장하지 않고 해시만.
 */
@Getter
@Entity
@Table(name = "refresh_token", uniqueConstraints = {
        @UniqueConstraint(name = "uk_refresh_user_device", columnNames = {"user_id", "device_id"}),
        @UniqueConstraint(name = "uk_refresh_token_hash", columnNames = "token_hash"),
        @UniqueConstraint(name = "uk_refresh_previous_token_hash", columnNames = "previous_token_hash")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "token_hash", length = 255, nullable = false)
    private String tokenHash;

    @Column(name = "previous_token_hash", length = 255)
    private String previousTokenHash;

    @Column(name = "previous_token_expires_at")
    private LocalDateTime previousTokenExpiresAt;

    @Column(name = "device_id", length = 255, nullable = false)
    private String deviceId;

    @Column(name = "device_label", length = 255)
    private String deviceLabel;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "last_used_at", nullable = false)
    private LocalDateTime lastUsedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    /** 새 기기 발급(insert) */
    public static RefreshToken issue(
            String userId,
            String deviceId,
            String tokenHash,
            LocalDateTime expiresAt,
            LocalDateTime now
    ) {
        RefreshToken token = new RefreshToken();
        token.userId = userId;
        token.deviceId = deviceId;
        token.tokenHash = tokenHash;
        token.expiresAt = expiresAt;
        token.lastUsedAt = now;
        return token;
    }

    /** 같은 기기 재로그인/재발급 시 회전(update) */
    public void rotate(String tokenHash, LocalDateTime expiresAt, LocalDateTime now) {
        this.previousTokenHash = this.tokenHash;
        this.previousTokenExpiresAt = this.expiresAt;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.lastUsedAt = now;
    }

    public boolean isExpired(LocalDateTime now) {
        return !expiresAt.isAfter(now);
    }

    public boolean isPreviousTokenValidAt(LocalDateTime now) {
        return previousTokenHash != null
                && previousTokenExpiresAt != null
                && previousTokenExpiresAt.isAfter(now);
    }
}
