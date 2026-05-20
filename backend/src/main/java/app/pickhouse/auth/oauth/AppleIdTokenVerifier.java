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
public class AppleIdTokenVerifier implements OAuthVerifier {

    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    private final AppleJwksClient jwks;
    private final OAuthProperties props;

    @Override public OAuthProvider provider() { return OAuthProvider.APPLE; }

    @Override
    public OAuthVerifiedUser verify(String idToken) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            String kid = unverified.getKeyId();
            Jwk key = jwks.get(kid);
            RSAPublicKey publicKey = (RSAPublicKey) key.getPublicKey();
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(publicKey, null))
                .withIssuer(APPLE_ISSUER)
                .withAudience(props.apple().audience())
                .build()
                .verify(idToken);
            String sub = decoded.getSubject();
            String email = decoded.getClaim("email").asString();
            return new OAuthVerifiedUser(OAuthProvider.APPLE, sub, email);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.OAUTH_VERIFICATION_FAILED,
                "Apple ID token invalid: " + ex.getMessage());
        }
    }
}
