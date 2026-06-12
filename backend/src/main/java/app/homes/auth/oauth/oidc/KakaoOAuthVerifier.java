package app.homes.auth.oauth.oidc;

import app.homes.auth.oauth.OAuthProvider;
import app.homes.auth.oauth.VerifiedOAuthUser;
import app.homes.auth.oauth.config.OAuthProperties;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.stereotype.Component;

@Component
public class KakaoOAuthVerifier extends AbstractOidcVerifier {

    public KakaoOAuthVerifier(OAuthProperties properties) {
        super(properties.kakao());
    }

    @Override
    public boolean supports(OAuthProvider provider) {
        return provider == OAuthProvider.KAKAO;
    }

    @Override
    public VerifiedOAuthUser verify(String idToken, String displayName) {
        DecodedJWT jwt = verifyAndDecode(idToken);
        // 닉네임은 openid + profile_nickname 동의 시 id_token claim으로 들어온다(없으면 null).
        String nickname = jwt.getClaim("nickname").asString();
        return new VerifiedOAuthUser(OAuthProvider.KAKAO, jwt.getSubject(), nickname);
    }
}
