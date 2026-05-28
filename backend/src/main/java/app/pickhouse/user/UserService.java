package app.pickhouse.user;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.auth.dto.UserDto;
import app.pickhouse.domain.auth.RefreshTokenRepository;
import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final AccountProperties accountProps;

    @Transactional(readOnly = true)
    public UserDto getSelf(UUID userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "user not found"));
        return UserDto.from(user);
    }

    @Transactional
    public void softDeleteSelf(UUID userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "user not found"));
        if (user.getDeletedAt() != null) return;
        Instant now = Instant.now();
        Instant purgeAfter = now.plus(Duration.ofDays(accountProps.gracePeriodDays()));
        user.softDelete(now, purgeAfter);
        refreshTokens.revokeAllForUser(userId);
    }
}
