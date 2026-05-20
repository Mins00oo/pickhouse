package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.user.OAuthProvider;
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
        OAuthVerifier v = map.get(provider);
        if (v == null) throw new ApiException(ErrorCode.BAD_REQUEST, "unsupported provider: " + provider);
        return v;
    }
}
