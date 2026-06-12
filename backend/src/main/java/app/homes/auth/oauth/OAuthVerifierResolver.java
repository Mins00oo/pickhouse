package app.homes.auth.oauth;

import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OAuthVerifierResolver {

    private final List<OAuthVerifier> verifiers;

    public OAuthVerifierResolver(List<OAuthVerifier> verifiers) {
        this.verifiers = verifiers;
    }

    /**
     * OAuthVerifier 중 provier에 맞는 verify 구현체를 통해 검증
     */
    public OAuthVerifier resolve(OAuthProvider provider) {
        return verifiers.stream()
                .filter(v -> v.supports(provider))
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.UNSUPPORTED_PROVIDER));
    }
}
