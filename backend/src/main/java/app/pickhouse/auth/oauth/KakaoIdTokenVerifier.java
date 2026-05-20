package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.user.OAuthProvider;
import com.auth0.jwk.Jwk;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.interfaces.RSAPublicKey;

@Component
@RequiredArgsConstructor
public class KakaoIdTokenVerifier implements OAuthVerifier {

    private final KakaoApiClient kakao;
    private final OAuthProperties props;

    @Override public OAuthProvider provider() { return OAuthProvider.KAKAO; }

    @Override
    public OAuthVerifiedUser verify(String idToken) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk key = kakao.getKey(unverified.getKeyId());
            RSAPublicKey pub = (RSAPublicKey) key.getPublicKey();
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(pub, null))
                .withIssuer(props.kakao().issuer())
                .withAudience(props.kakao().audience())
                .build()
                .verify(idToken);
            String sub = decoded.getSubject();
            String email = decoded.getClaim("email").asString();
            return new OAuthVerifiedUser(OAuthProvider.KAKAO, sub, email);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.OAUTH_VERIFICATION_FAILED,
                "Kakao ID token invalid: " + ex.getMessage());
        }
    }
}
