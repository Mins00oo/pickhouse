package app.pickhouse.domain.user.service;

import app.pickhouse.domain.auth.repository.RefreshTokenRepository;
import app.pickhouse.domain.user.dto.response.UserResponse;
import app.pickhouse.domain.user.entity.User;
import app.pickhouse.domain.user.repository.UserRepository;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
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
    public UserResponse getSelf(UUID userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Transactional
    public void softDeleteSelf(UUID userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (user.getDeletedAt() != null) return;
        Instant now = Instant.now();
        Instant purgeAfter = now.plus(Duration.ofDays(accountProps.gracePeriodDays()));
        user.softDelete(now, purgeAfter);
        refreshTokens.revokeAllForUser(userId);
    }
}
