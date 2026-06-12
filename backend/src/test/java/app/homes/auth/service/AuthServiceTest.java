package app.homes.auth.service;

import app.homes.auth.nickname.DefaultNicknameGenerator;
import app.homes.auth.token.RefreshTokenManager;
import app.homes.auth.dto.LoginRequest;
import app.homes.auth.dto.LoginResponse;
import app.homes.auth.entity.SocialAccount;
import app.homes.auth.oauth.OAuthProvider;
import app.homes.auth.oauth.OAuthVerifier;
import app.homes.auth.oauth.OAuthVerifierResolver;
import app.homes.auth.oauth.VerifiedOAuthUser;
import app.homes.auth.repository.RefreshTokenRepository;
import app.homes.auth.repository.SocialAccountRepository;
import app.homes.global.security.JwtProvider;
import app.homes.user.entity.User;
import app.homes.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 로그인 오케스트레이션 단위 테스트. 실제 카카오/애플 호출 없이 가짜 검증기로 분기를 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock OAuthVerifierResolver verifierResolver;
    @Mock OAuthVerifier verifier;
    @Mock UserRepository userRepository;
    @Mock SocialAccountRepository socialAccountRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock RefreshTokenManager refreshTokenManager;
    @Mock JwtProvider jwtProvider;
    @Mock DefaultNicknameGenerator defaultNicknameGenerator;
    @Mock Clock clock;

    @InjectMocks AuthService authService;

    private static final OAuthProvider PROVIDER = OAuthProvider.KAKAO;
    private static final String SUB = "kakao-sub-1";
    private static final String DEVICE = "device-1";
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 10, 12, 0);

    private LoginRequest request;

    @BeforeEach
    void setUp() {
        request = new LoginRequest(PROVIDER, "id-token", DEVICE, "철수");
        when(verifierResolver.resolve(PROVIDER)).thenReturn(verifier);
        when(verifier.verify("id-token", "철수"))
                .thenReturn(new VerifiedOAuthUser(PROVIDER, SUB, "철수"));
        when(jwtProvider.issueAccessToken(anyString())).thenReturn("access-token");
        when(refreshTokenManager.issue(anyString(), eq(DEVICE))).thenReturn("refresh-token");
    }

    @Test
    @DisplayName("신규 사용자는 가입하고 토큰을 발급한다")
    void newUser_signsUp() {
        when(socialAccountRepository.findByProviderAndProviderUserId(PROVIDER.name(), SUB))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        LoginResponse res = authService.login(request);

        verify(userRepository).save(any(User.class));
        verify(socialAccountRepository).save(any(SocialAccount.class));
        assertThat(res.accessToken()).isEqualTo("access-token");
        assertThat(res.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    @DisplayName("기존 활성 사용자는 가입 없이 토큰만 발급한다")
    void existingActiveUser_noSignUp() {
        User user = User.create("철수");
        SocialAccount account = SocialAccount.create(user.getId(), PROVIDER.name(), SUB);
        when(socialAccountRepository.findByProviderAndProviderUserId(PROVIDER.name(), SUB))
                .thenReturn(Optional.of(account));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        authService.login(request);

        verify(userRepository, never()).save(any());
        verify(socialAccountRepository, never()).save(any());
    }

    @Test
    @DisplayName("복구 가능 기간의 탈퇴자는 복원된다")
    void recoverableLeftUser_reactivated() {
        stubNow();
        User user = User.create("철수");
        user.withdraw(NOW.minusDays(20));
        SocialAccount account = SocialAccount.create(user.getId(), PROVIDER.name(), SUB);
        when(socialAccountRepository.findByProviderAndProviderUserId(PROVIDER.name(), SUB))
                .thenReturn(Optional.of(account));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        authService.login(request);

        assertThat(user.isActive()).isTrue();              // 복원됨
        verify(userRepository, never()).save(any());       // 신규가입 아님
        verify(socialAccountRepository, never()).delete(any());
    }

    @Test
    @DisplayName("복구 기간이 만료된 탈퇴자는 기존 소셜 계정을 새 사용자에게 이전한다")
    void expiredLeftUser_registeredAsNewUser() {
        stubNow();
        User user = User.create("철수");
        user.withdraw(NOW.minusDays(31));
        SocialAccount account = SocialAccount.create(user.getId(), PROVIDER.name(), SUB);
        when(socialAccountRepository.findByProviderAndProviderUserId(PROVIDER.name(), SUB))
                .thenReturn(Optional.of(account));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.login(request);

        verify(refreshTokenRepository).deleteByUserId(user.getId());
        verify(socialAccountRepository, never()).delete(any());
        verify(userRepository, never()).delete(any());
        verify(userRepository).save(any(User.class));
        assertThat(account.getUserId()).isNotEqualTo(user.getId());
    }

    private void stubNow() {
        when(clock.instant()).thenReturn(NOW.atZone(SEOUL).toInstant());
        when(clock.getZone()).thenReturn(SEOUL);
    }
}
