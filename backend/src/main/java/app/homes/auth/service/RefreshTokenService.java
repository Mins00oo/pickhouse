package app.homes.auth.service;

import app.homes.auth.dto.LoginResponse;
import app.homes.auth.dto.LogoutRequest;
import app.homes.auth.dto.RefreshTokenRequest;
import app.homes.auth.entity.RefreshToken;
import app.homes.auth.exception.RefreshTokenAuthenticationException;
import app.homes.auth.repository.RefreshTokenRepository;
import app.homes.auth.token.RefreshTokenManager;
import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import app.homes.global.security.JwtProvider;
import app.homes.user.entity.User;
import app.homes.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenManager refreshTokenManager;
    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final Clock clock;

    @Transactional(noRollbackFor = RefreshTokenAuthenticationException.class)
    public LoginResponse refresh(RefreshTokenRequest request) {
        String hash = RefreshTokenManager.sha256(request.refreshToken());
        LocalDateTime now = LocalDateTime.now(clock);

        RefreshToken current = refreshTokenRepository
                .findByTokenHashAndDeviceId(hash, request.deviceId())
                .orElseGet(() -> rejectOrRevokeReusedDevice(hash, request.deviceId(), now));

        if (current.isExpired(now)) {
            revokeDevice(current);
            throw new RefreshTokenAuthenticationException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = userRepository.findById(current.getUserId()).orElse(null);
        if (user == null || !user.isActive()) {
            revokeDevice(current);
            throw new RefreshTokenAuthenticationException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        try {
            String nextRefreshToken = refreshTokenManager.rotate(current);
            String nextAccessToken = jwtProvider.issueAccessToken(user.getId());
            return new LoginResponse(nextAccessToken, nextRefreshToken);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_CONFLICT);
        }
    }

    @Transactional
    public void logout(LogoutRequest request) {
        String hash = RefreshTokenManager.sha256(request.refreshToken());

        refreshTokenRepository.findByTokenHashAndDeviceId(hash, request.deviceId())
                .or(() -> refreshTokenRepository.findByPreviousTokenHashAndDeviceId(
                        hash,
                        request.deviceId()
                ))
                .ifPresent(refreshTokenRepository::delete);
    }

    private RefreshToken rejectOrRevokeReusedDevice(
            String hash,
            String deviceId,
            LocalDateTime now
    ) {
        RefreshToken reused = refreshTokenRepository
                .findByPreviousTokenHashAndDeviceId(hash, deviceId)
                .filter(token -> token.isPreviousTokenValidAt(now))
                .orElseThrow(() ->
                        new RefreshTokenAuthenticationException(ErrorCode.REFRESH_TOKEN_INVALID)
                );

        revokeDevice(reused);
        throw new RefreshTokenAuthenticationException(ErrorCode.REFRESH_TOKEN_REUSED);
    }

    private void revokeDevice(RefreshToken token) {
        refreshTokenRepository.delete(token);
        refreshTokenRepository.flush();
    }
}
