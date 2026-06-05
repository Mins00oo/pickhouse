package app.pickhouse.domain.auth.oauth;

import app.pickhouse.domain.auth.entity.OAuthProvider;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OAuthVerifierResolver {

    private final Map<OAuthProvider, OAuthVerifier> map;

    public OAuthVerifierResolver(List<OAuthVerifier> verifiers) {
        this.map = verifiers.stream().collect(Collectors.toMap(OAuthVerifier::provider, Function.identity()));
    }

    public OAuthVerifier forProvider(OAuthProvider provider) {
        OAuthVerifier verifier = map.get(provider);
        if (verifier == null) throw new BusinessException(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
        return verifier;
    }
}
