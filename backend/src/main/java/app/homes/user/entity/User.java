package app.homes.user.entity;

import app.homes.global.jpa.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    private static final long RECOVERY_DAYS = 30;
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_LEFT = "LEFT";

    /** UUID 문자열 (CHAR(36) 대신 VARCHAR(36)으로 매핑 — Hibernate validate 호환) */
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "nickname", length = 50)
    private String nickname;

    /** 코드: USER_STATUS (ACTIVE/LEFT) */
    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "withdraw_at")
    private LocalDateTime withdrawAt;

    @Column(name = "delete_scheduled_at")
    private LocalDateTime deleteScheduledAt;

    /** 최초 가입 시 생성. UUID는 도메인에서 직접 할당. status는 ACTIVE. */
    public static User create(String nickname) {
        User user = new User();
        user.id = UUID.randomUUID().toString();
        user.nickname = nickname;
        user.status = STATUS_ACTIVE;
        return user;
    }

    public boolean isActive() {
        return STATUS_ACTIVE.equals(status);
    }

    public boolean isLeft() {
        return STATUS_LEFT.equals(status);
    }

    /** 탈퇴했지만 아직 복구 가능 기간(삭제 예정일 이전)인지 */
    public boolean isWithinRecoverable(LocalDateTime now) {
        return isLeft()
                && deleteScheduledAt != null
                && deleteScheduledAt.isAfter(now);
    }

    public boolean isRecoveryExpired(LocalDateTime now) {
        return isLeft()
                && deleteScheduledAt != null
                && !deleteScheduledAt.isAfter(now);
    }

    /** 복구 가능 기간 내 재로그인 시 복원 */
    public void reactivate() {
        this.status = STATUS_ACTIVE;
        this.withdrawAt = null;
        this.deleteScheduledAt = null;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    /** 회원탈퇴 — LEFT로 전환하고 복구 가능 기간(삭제 예정일시)을 설정 */
    public void withdraw(LocalDateTime now) {
        this.status = STATUS_LEFT;
        this.withdrawAt = now;
        this.deleteScheduledAt = now.plusDays(RECOVERY_DAYS);
    }
}
