package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.domain.user.OAuthProvider;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OAuthVerifierResolverTest {

    @Test
    void resolves_by_provider() {
        OAuthVerifier apple = mock(OAuthVerifier.class);
        when(apple.provider()).thenReturn(OAuthProvider.APPLE);
        OAuthVerifier kakao = mock(OAuthVerifier.class);
        when(kakao.provider()).thenReturn(OAuthProvider.KAKAO);
        OAuthVerifierResolver resolver = new OAuthVerifierResolver(List.of(apple, kakao));
        assertThat(resolver.forProvider(OAuthProvider.APPLE)).isSameAs(apple);
        assertThat(resolver.forProvider(OAuthProvider.KAKAO)).isSameAs(kakao);
    }

    @Test
    void throws_when_provider_missing() {
        OAuthVerifierResolver resolver = new OAuthVerifierResolver(List.of());
        assertThatThrownBy(() -> resolver.forProvider(OAuthProvider.APPLE))
            .isInstanceOf(ApiException.class);
    }
}
