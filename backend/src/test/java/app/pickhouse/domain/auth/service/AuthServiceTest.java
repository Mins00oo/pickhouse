package app.pickhouse.domain.auth.service;

import app.pickhouse.domain.auth.dto.request.LoginRequest;
import app.pickhouse.domain.auth.dto.response.LoginResponse;
import app.pickhouse.domain.auth.dto.request.RefreshRequest;
import app.pickhouse.domain.auth.dto.response.TokenPair;
import app.pickhouse.domain.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.domain.auth.oauth.OAuthVerifier;
import app.pickhouse.domain.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.domain.auth.entity.RefreshToken;
import app.pickhouse.domain.auth.repository.RefreshTokenRepository;
import app.pickhouse.domain.auth.entity.OAuthIdentity;
import app.pickhouse.domain.auth.repository.OAuthIdentityRepository;
import app.pickhouse.domain.auth.entity.OAuthProvider;
import app.pickhouse.domain.user.entity.User;
import app.pickhouse.domain.user.repository.UserRepository;
import app.pickhouse.global.security.JwtIssuer;
import app.pickhouse.global.security.JwtProperties;
import app.pickhouse.global.security.JwtVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private OAuthVerifierResolver resolver;
    private UserRepository users;
    private OAuthIdentityRepository identities;
    private RefreshTokenRepository refreshTokens;
    private JwtIssuer issuer;
    private JwtVerifier verifier;
    private JwtProperties jwtProps;
    private AuthService service;

    @BeforeEach
    void setUp() {
        resolver = mock(OAuthVerifierResolver.class);
        users = mock(UserRepository.class);
        identities = mock(OAuthIdentityRepository.class);
        refreshTokens = mock(RefreshTokenRepository.class);
        issuer = mock(JwtIssuer.class);
        verifier = mock(JwtVerifier.class);
        jwtProps = mock(JwtProperties.class);
        when(jwtProps.refreshTokenTtlSeconds()).thenReturn(2592000L);

        // Default: kakao verifier resolves an existing "k-1" identity
        OAuthVerifier kakao = mock(OAuthVerifier.class);
        when(kakao.provider()).thenReturn(OAuthProvider.KAKAO);
        when(kakao.verify(any())).thenReturn(new OAuthVerifiedUser(OAuthProvider.KAKAO, "k-1", "u@kakao.com"));
        when(resolver.forProvider(OAuthProvider.KAKAO)).thenReturn(kakao);

        when(issuer.issueAccessToken(any(), any())).thenReturn("access.jwt");
        when(issuer.issueRefreshToken(any(), any())).thenReturn("refresh.jwt");

        service = new AuthService(resolver, users, identities, refreshTokens, issuer, verifier, jwtProps);
    }

    @Test
    void creates_new_user_on_first_login_with_default_nickname() {
        when(identities.findByProviderAndProviderId(OAuthProvider.KAKAO, "k-1")).thenReturn(Optional.empty());

        LoginResponse resp = service.login(new LoginRequest(OAuthProvider.KAKAO, "ID_TOKEN"));

        assertThat(resp.accessToken()).isEqualTo("access.jwt");
        assertThat(resp.refreshToken()).isEqualTo("refresh.jwt");
        assertThat(resp.user().nickname()).isEqualTo("닉네임");
        assertThat(resp.user().email()).isEqualTo("u@kakao.com");
        verify(users).save(any(User.class));
        verify(identities).save(any(OAuthIdentity.class));
        verify(refreshTokens).save(any(RefreshToken.class));
    }

    @Test
    void links_existing_oauth_identity_on_subsequent_login() {
        UUID existingUserId = UUID.randomUUID();
        Instant now = Instant.now();
        User existing = User.builder()
            .id(existingUserId)
            .email("u@kakao.com")
            .nickname("alice")
            .createdAt(now)
            .updatedAt(now)
            .build();
        OAuthIdentity identity = OAuthIdentity.builder()
            .id(UUID.randomUUID())
            .userId(existingUserId)
            .provider(OAuthProvider.KAKAO)
            .providerId("k-1")
            .createdAt(now)
            .build();
        when(identities.findByProviderAndProviderId(OAuthProvider.KAKAO, "k-1"))
            .thenReturn(Optional.of(identity));
        when(users.findById(existingUserId)).thenReturn(Optional.of(existing));

        LoginResponse resp = service.login(new LoginRequest(OAuthProvider.KAKAO, "ID_TOKEN"));

        assertThat(resp.user().id()).isEqualTo(existingUserId);
        assertThat(resp.user().nickname()).isEqualTo("alice");
        verify(users, never()).save(any(User.class));
        verify(identities, never()).save(any(OAuthIdentity.class));
        verify(refreshTokens).save(any(RefreshToken.class));
    }

    @Test
    void refresh_issues_new_pair_and_revokes_old_token() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        Instant now = Instant.now();
        RefreshToken stored = RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(userId)
            .jti(jti)
            .expiresAt(now.plusSeconds(86400))
            .revoked(false)
            .createdAt(now)
            .build();
        User user = User.builder().id(userId).email("u@kakao.com").nickname("alice").createdAt(now).updatedAt(now).build();

        when(verifier.verifyRefresh("OLD_REFRESH"))
            .thenReturn(new JwtVerifier.VerifiedClaims(userId, "refresh", jti, null));
        when(refreshTokens.findByJti(jti)).thenReturn(Optional.of(stored));
        when(users.findById(userId)).thenReturn(Optional.of(user));

        TokenPair pair = service.refresh(new RefreshRequest("OLD_REFRESH"));

        assertThat(pair.accessToken()).isEqualTo("access.jwt");
        assertThat(pair.refreshToken()).isEqualTo("refresh.jwt");
        assertThat(stored.isRevoked()).isTrue(); // old token revoked
        verify(refreshTokens).save(any(RefreshToken.class)); // new refresh persisted
    }

    @Test
    void refresh_rejects_unknown_jti() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        when(verifier.verifyRefresh("X")).thenReturn(new JwtVerifier.VerifiedClaims(userId, "refresh", jti, null));
        when(refreshTokens.findByJti(jti)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh(new RefreshRequest("X")))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.INVALID_TOKEN);
    }

    @Test
    void refresh_rejects_already_revoked_token_and_revokes_all_for_user() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        Instant now = Instant.now();
        RefreshToken revoked = RefreshToken.builder()
            .id(UUID.randomUUID()).userId(userId).jti(jti)
            .expiresAt(now.plusSeconds(86400)).revoked(true).createdAt(now).build();
        when(verifier.verifyRefresh("R")).thenReturn(new JwtVerifier.VerifiedClaims(userId, "refresh", jti, null));
        when(refreshTokens.findByJti(jti)).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.refresh(new RefreshRequest("R")))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.INVALID_TOKEN);
        verify(refreshTokens).revokeAllForUser(userId); // suspected reuse -> revoke entire family
    }

    @Test
    void refresh_rejects_expired_token() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        Instant past = Instant.now().minusSeconds(60);
        RefreshToken stored = RefreshToken.builder()
            .id(UUID.randomUUID()).userId(userId).jti(jti)
            .expiresAt(past).revoked(false).createdAt(past).build();
        when(verifier.verifyRefresh("E")).thenReturn(new JwtVerifier.VerifiedClaims(userId, "refresh", jti, null));
        when(refreshTokens.findByJti(jti)).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> service.refresh(new RefreshRequest("E")))
            .isInstanceOf(BusinessException.class);
    }
}
