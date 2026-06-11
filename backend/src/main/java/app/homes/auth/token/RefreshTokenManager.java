package app.homes.auth.token;

import app.homes.auth.entity.RefreshToken;
import app.homes.auth.repository.RefreshTokenRepository;
import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import app.homes.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * refresh token 발급/회전. 클라이언트에는 원문을 주고 DB에는 SHA-256 해시만 저장한다.
 * 기기당 1행: 같은 (user, device)면 회전(update), 없으면 발급(insert).
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenManager {

    private static final Duration TTL = Duration.ofDays(90);
    private static final int TOKEN_BYTES = 32; // 256-bit

    private final RefreshTokenRepository repository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public String issue(String userId, String deviceId) {
        String rawToken = generateRawToken();
        String tokenHash = sha256(rawToken);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime expiresAt = now.plus(TTL);
        var existing = repository.findByUserIdAndDeviceId(userId, deviceId);

        boolean active = userRepository.findById(userId)
                .map(user -> user.isActive())
                .orElse(false);
        if (!active) {
            throw new CustomException(ErrorCode.LOGIN_CONFLICT);
        }

        try {
            existing.ifPresentOrElse(
                    token -> token.rotate(tokenHash, expiresAt, now),
                    () -> repository.save(
                            RefreshToken.issue(userId, deviceId, tokenHash, expiresAt, now)
                    )
            );
            repository.flush();
        } catch (ObjectOptimisticLockingFailureException | DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.LOGIN_CONFLICT);
        }

        return rawToken;
    }

    public String rotate(RefreshToken token) {
        String rawToken = generateRawToken();
        String tokenHash = sha256(rawToken);
        LocalDateTime now = LocalDateTime.now(clock);
        token.rotate(tokenHash, now.plus(TTL), now);
        repository.flush();
        return rawToken;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
