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

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

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
}
