package app.pickhouse.global.security;

import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CurrentUserArgumentResolverTest {

    private final CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void supportsParameter_true_when_annotated_with_CurrentUserId_and_UUID() {
        MethodParameter param = mock(MethodParameter.class);
        when(param.hasParameterAnnotation(CurrentUserId.class)).thenReturn(true);
        when(param.getParameterType()).thenAnswer(inv -> UUID.class);

        assertThat(resolver.supportsParameter(param)).isTrue();
    }

    @Test
    void supportsParameter_false_when_missing_annotation() {
        MethodParameter param = mock(MethodParameter.class);
        when(param.hasParameterAnnotation(CurrentUserId.class)).thenReturn(false);

        assertThat(resolver.supportsParameter(param)).isFalse();
    }

    @Test
    void supportsParameter_false_when_wrong_type() {
        MethodParameter param = mock(MethodParameter.class);
        when(param.hasParameterAnnotation(CurrentUserId.class)).thenReturn(true);
        when(param.getParameterType()).thenAnswer(inv -> String.class);

        assertThat(resolver.supportsParameter(param)).isFalse();
    }

    @Test
    void resolveArgument_returns_principal_from_security_context() {
        UUID userId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(userId, null, List.of()));

        Object resolved = resolver.resolveArgument(null, null, null, null);

        assertThat(resolved).isEqualTo(userId);
    }

    @Test
    void resolveArgument_throws_UNAUTHORIZED_when_no_authentication() {
        assertThatThrownBy(() -> resolver.resolveArgument(null, null, null, null))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.UNAUTHORIZED);
    }
}
