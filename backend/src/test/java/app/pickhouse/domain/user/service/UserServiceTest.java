package app.pickhouse.domain.user.service;

import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import app.pickhouse.domain.auth.repository.RefreshTokenRepository;
import app.pickhouse.domain.user.entity.User;
import app.pickhouse.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserRepository users;
    private RefreshTokenRepository refreshTokens;
    private AccountProperties accountProps;
    private UserService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        refreshTokens = mock(RefreshTokenRepository.class);
        accountProps = new AccountProperties(30);
        service = new UserService(users, refreshTokens, accountProps);
    }

    @Test
    void softDeleteSelf_sets_deletedAt_and_purgeAfter_and_revokes_refresh_tokens() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        User user = User.builder().id(id).createdAt(now).updatedAt(now).build();
        when(users.findById(id)).thenReturn(Optional.of(user));

        service.softDeleteSelf(id);

        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(user.getPurgeAfter()).isNotNull();
        long daysBetween = java.time.Duration.between(user.getDeletedAt(), user.getPurgeAfter()).toDays();
        assertThat(daysBetween).isEqualTo(30L);
        verify(refreshTokens).revokeAllForUser(id);
    }

    @Test
    void getSelf_returns_current_user_dto() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        User user = User.builder()
            .id(id)
            .email("me@example.com")
            .nickname("picker")
            .createdAt(now)
            .updatedAt(now)
            .build();
        when(users.findById(id)).thenReturn(Optional.of(user));

        var dto = service.getSelf(id);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.email()).isEqualTo("me@example.com");
        assertThat(dto.nickname()).isEqualTo("picker");
    }

    @Test
    void softDeleteSelf_is_noop_when_user_already_soft_deleted() {
        UUID id = UUID.randomUUID();
        Instant past = Instant.parse("2026-01-01T00:00:00Z");
        User user = User.builder().id(id).createdAt(past).updatedAt(past).deletedAt(past).purgeAfter(past).build();
        when(users.findById(id)).thenReturn(Optional.of(user));

        service.softDeleteSelf(id);

        assertThat(user.getDeletedAt()).isEqualTo(past);
        verify(refreshTokens, never()).revokeAllForUser(any());
    }

    @Test
    void softDeleteSelf_throws_NOT_FOUND_when_user_missing() {
        UUID id = UUID.randomUUID();
        when(users.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.softDeleteSelf(id))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }
}
