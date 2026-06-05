package app.pickhouse.domain.auth.service;

import app.pickhouse.domain.auth.dto.request.LoginRequest;
import app.pickhouse.domain.auth.dto.request.RefreshRequest;
import app.pickhouse.domain.auth.dto.response.LoginResponse;
import app.pickhouse.domain.auth.dto.response.TokenPair;
import app.pickhouse.domain.auth.entity.OAuthIdentity;
import app.pickhouse.domain.auth.entity.RefreshToken;
import app.pickhouse.domain.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.domain.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.domain.auth.repository.OAuthIdentityRepository;
import app.pickhouse.domain.auth.repository.RefreshTokenRepository;
import app.pickhouse.domain.user.dto.response.UserResponse;
import app.pickhouse.domain.user.entity.User;
import app.pickhouse.domain.user.repository.UserRepository;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.global.security.JwtIssuer;
import app.pickhouse.global.security.JwtProperties;
import app.pickhouse.global.security.JwtVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_NICKNAME = "닉네임";

    private final OAuthVerifierResolver resolver;
    private final UserRepository users;
    private final OAuthIdentityRepository identities;
    private final RefreshTokenRepository refreshTokens;
    private final JwtIssuer issuer;
    private final JwtVerifier verifier;
    private final JwtProperties jwtProps;

    @Transactional
    public LoginResponse login(LoginRequest req) {
        OAuthVerifiedUser verifiedUser = resolver.forProvider(req.provider()).verify(req.idToken());

        User user = identities.findByProviderAndProviderId(verifiedUser.provider(), verifiedUser.providerId())
            .map(identity -> users.findById(identity.getUserId()).orElseThrow(
                () -> new BusinessException(ErrorCode.USER_MISSING)))
            .orElseGet(() -> createUser(verifiedUser));

        TokenPair pair = issueTokens(user);
        return new LoginResponse(pair.accessToken(), pair.refreshToken(), UserResponse.from(user));
    }

    private User createUser(OAuthVerifiedUser verifiedUser) {
        Instant now = Instant.now();
        User user = User.builder()
            .id(UUID.randomUUID())
            .email(verifiedUser.email())
            .nickname(DEFAULT_NICKNAME)
            .createdAt(now)
            .updatedAt(now)
            .build();
        users.save(user);
        identities.save(OAuthIdentity.builder()
            .id(UUID.randomUUID())
            .userId(user.getId())
            .provider(verifiedUser.provider())
            .providerId(verifiedUser.providerId())
            .createdAt(now)
            .build());
        return user;
    }

    @Transactional
    public TokenPair refresh(RefreshRequest req) {
        JwtVerifier.VerifiedClaims claims = verifier.verifyRefresh(req.refreshToken());
        UUID jti = claims.jti();
        RefreshToken stored = refreshTokens.findByJti(jti)
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));
        if (stored.isRevoked()) {
            refreshTokens.revokeAllForUser(stored.getUserId());
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        stored.revoke();
        User user = users.findById(stored.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return issueTokens(user);
    }

    private TokenPair issueTokens(User user) {
        String access = issuer.issueAccessToken(user.getId(), user.getEmail());
        UUID jti = UUID.randomUUID();
        String refresh = issuer.issueRefreshToken(user.getId(), jti);
        Instant now = Instant.now();
        refreshTokens.save(RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(user.getId())
            .jti(jti)
            .expiresAt(now.plus(Duration.ofSeconds(jwtProps.refreshTokenTtlSeconds())))
            .revoked(false)
            .createdAt(now)
            .build());
        return new TokenPair(access, refresh);
    }
}
