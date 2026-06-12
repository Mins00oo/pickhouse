package app.homes.auth.service;

import java.time.Clock;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.homes.auth.dto.LoginRequest;
import app.homes.auth.dto.LoginResponse;
import app.homes.auth.entity.SocialAccount;
import app.homes.auth.nickname.DefaultNicknameGenerator;
import app.homes.auth.oauth.OAuthVerifierResolver;
import app.homes.auth.oauth.VerifiedOAuthUser;
import app.homes.auth.repository.RefreshTokenRepository;
import app.homes.auth.repository.SocialAccountRepository;
import app.homes.auth.token.RefreshTokenManager;
import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import app.homes.global.security.JwtProvider;
import app.homes.user.entity.User;
import app.homes.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final OAuthVerifierResolver verifierResolver;
    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenManager refreshTokenManager;
    private final JwtProvider jwtProvider;
    private final DefaultNicknameGenerator defaultNicknameGenerator;
    private final Clock clock;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        VerifiedOAuthUser verifiedUser = verifyOAuthUser(request);

        User user = findOrRegisterUser(verifiedUser);

        String accessToken = jwtProvider.issueAccessToken(user.getId());
        String refreshToken = refreshTokenManager.issue(user.getId(), request.deviceId());
        return new LoginResponse(accessToken, refreshToken);
    }

    private VerifiedOAuthUser verifyOAuthUser(LoginRequest req) {
        return verifierResolver.resolve(req.provider())
                .verify(req.idToken(), req.displayName());
    }

    private User findOrRegisterUser(VerifiedOAuthUser verified) {
        return socialAccountRepository.findByProviderAndProviderUserId(
                verified.provider().name(),
                verified.providerUserId())
                .map(account -> onExistingAccount(account, verified))
                .orElseGet(() -> signUp(verified));
    }

    private User onExistingAccount(SocialAccount account, VerifiedOAuthUser verified) {
        User user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.isActive()) {
            return user;
        }

        LocalDateTime now = LocalDateTime.now(clock);
        if (user.isWithinRecoverable(now)) {
            user.reactivate();
            return user;
        }

        if (user.isRecoveryExpired(now)) {
            return registerAsNewUser(user, account, verified);
        }
        throw new CustomException(ErrorCode.INVALID_USER_STATE);
    }

    private User registerAsNewUser(
            User previousUser,
            SocialAccount account,
            VerifiedOAuthUser verified) {
        refreshTokenRepository.deleteByUserId(previousUser.getId());
        User newUser = userRepository.save(User.create(resolveSignupNickname(verified.nickname())));
        account.reassignTo(newUser.getId());
        return newUser;
    }

    private User signUp(VerifiedOAuthUser verified) {
        User user = userRepository.save(User.create(resolveSignupNickname(verified.nickname())));
        socialAccountRepository.save(
                SocialAccount.create(
                        user.getId(),
                        verified.provider().name(),
                        verified.providerUserId()));
        return user;
    }

    private String resolveSignupNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return defaultNicknameGenerator.generate();
        }
        String normalized = nickname.strip();
        return normalized.length() <= 50
                ? normalized
                : normalized.substring(0, 50);
    }
}
