package app.pickhouse.auth;

import app.pickhouse.auth.dto.*;
import app.pickhouse.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.auth.RefreshToken;
import app.pickhouse.domain.auth.RefreshTokenRepository;
import app.pickhouse.domain.user.*;
import app.pickhouse.security.JwtIssuer;
import app.pickhouse.security.JwtProperties;
import app.pickhouse.security.JwtVerifier;
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
        OAuthVerifiedUser v = resolver.forProvider(req.provider()).verify(req.idToken());

        User user = identities.findByProviderAndProviderId(v.provider(), v.providerId())
            .map(id -> users.findById(id.getUserId()).orElseThrow(
                () -> new ApiException(ErrorCode.INTERNAL_ERROR, "user missing for oauth identity")))
            .orElseGet(() -> createUser(v));

        TokenPair pair = issueTokens(user);
        return new LoginResponse(pair.accessToken(), pair.refreshToken(), UserDto.from(user));
    }

    private User createUser(OAuthVerifiedUser v) {
        Instant now = Instant.now();
        User u = User.builder()
            .id(UUID.randomUUID())
            .email(v.email())
            .nickname(DEFAULT_NICKNAME)
            .createdAt(now)
            .updatedAt(now)
            .build();
        users.save(u);
        identities.save(OAuthIdentity.builder()
            .id(UUID.randomUUID())
            .userId(u.getId())
            .provider(v.provider())
            .providerId(v.providerId())
            .createdAt(now)
            .build());
        return u;
    }

    @Transactional
    public TokenPair refresh(RefreshRequest req) {
        JwtVerifier.VerifiedClaims claims = verifier.verifyRefresh(req.refreshToken());
        UUID jti = claims.jti();
        RefreshToken stored = refreshTokens.findByJti(jti)
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN, "refresh token unknown"));
        if (stored.isRevoked()) {
            refreshTokens.revokeAllForUser(stored.getUserId());
            throw new ApiException(ErrorCode.INVALID_TOKEN, "refresh token reused");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.INVALID_TOKEN, "refresh token expired");
        }
        stored.revoke();
        User user = users.findById(stored.getUserId())
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN, "user missing"));
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
