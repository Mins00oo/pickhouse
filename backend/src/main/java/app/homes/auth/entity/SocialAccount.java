package app.homes.auth.entity;

import app.homes.global.jpa.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 소셜 신원. (provider, provider_user_id)가 한 계정에 1:1로 대응(모델 1).
 */
@Getter
@Entity
@Table(name = "social_account",
        uniqueConstraints = @UniqueConstraint(name = "uk_social_provider_uid",
                columnNames = {"provider", "provider_user_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    /** KAKAO / APPLE */
    @Column(name = "provider", length = 20, nullable = false)
    private String provider;

    @Column(name = "provider_user_id", length = 255, nullable = false)
    private String providerUserId;

    public static SocialAccount create(String userId, String provider, String providerUserId) {
        SocialAccount account = new SocialAccount();
        account.userId = userId;
        account.provider = provider;
        account.providerUserId = providerUserId;
        return account;
    }

    public void reassignTo(String newUserId) {
        this.userId = newUserId;
    }
}
