package app.homes.user.service;

import app.homes.auth.repository.RefreshTokenRepository;
import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import app.homes.user.dto.NicknameResponse;
import app.homes.user.dto.UpdateNicknameRequest;
import app.homes.user.dto.UserProfileResponse;
import app.homes.user.entity.User;
import app.homes.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String userId) {
        User user = findUser(userId);
        return new UserProfileResponse(user.getNickname(), user.getCreatedAt());
    }

    @Transactional
    public NicknameResponse updateNickname(String userId, UpdateNicknameRequest request) {
        User user = findUser(userId);
        user.updateNickname(request.nickname());
        return new NicknameResponse(user.getNickname());
    }

    @Transactional
    public void withdraw(String userId) {
        User user = findUser(userId);

        if (user.isActive()) {
            user.withdraw(LocalDateTime.now(clock));
        } else if (!user.isLeft()) {
            throw new CustomException(ErrorCode.INVALID_USER_STATE);
        }

        refreshTokenRepository.deleteByUserId(userId);
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }
}
