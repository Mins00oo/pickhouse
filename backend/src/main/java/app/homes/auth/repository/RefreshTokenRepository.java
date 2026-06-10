package app.homes.auth.repository;

import app.homes.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByUserIdAndDeviceId(String userId, String deviceId);

    void deleteByUserId(String userId);
}
