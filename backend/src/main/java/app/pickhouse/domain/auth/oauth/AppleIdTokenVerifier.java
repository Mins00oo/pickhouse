package app.pickhouse.domain.auth.oauth;

import app.pickhouse.domain.auth.entity.OAuthProvider;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
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
    private static final long TOKEN_CLOCK_SKEW_SECONDS = 60L;

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
                .acceptLeeway(TOKEN_CLOCK_SKEW_SECONDS)
                .build()
                .verify(idToken);
            String sub = decoded.getSubject();
            String email = decoded.getClaim("email").asString();
            return new OAuthVerifiedUser(OAuthProvider.APPLE, sub, email);
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.OAUTH_VERIFICATION_FAILED);
        }
    }
}
