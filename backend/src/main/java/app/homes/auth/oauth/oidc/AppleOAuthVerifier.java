package app.homes.auth.oauth.oidc;

import app.homes.auth.oauth.OAuthProvider;
import app.homes.auth.oauth.VerifiedOAuthUser;
import app.homes.auth.oauth.config.OAuthProperties;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.stereotype.Component;

@Component
public class AppleOAuthVerifier extends AbstractOidcVerifier {

    public AppleOAuthVerifier(OAuthProperties properties) {
        super(properties.apple());
    }

    @Override
    public boolean supports(OAuthProvider provider) {
        return provider == OAuthProvider.APPLE;
    }

    @Override
    public VerifiedOAuthUser verify(String idToken, String displayName) {
        DecodedJWT jwt = verifyAndDecode(idToken);
        // 애플은 토큰에 이름이 없다 → 클라이언트가 최초 로그인 시 보낸 displayName을 닉네임으로 사용.
        return new VerifiedOAuthUser(OAuthProvider.APPLE, jwt.getSubject(), displayName);
    }
}
