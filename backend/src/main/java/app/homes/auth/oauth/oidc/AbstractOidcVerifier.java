package app.homes.auth.oauth.oidc;

import app.homes.auth.oauth.OAuthVerifier;
import app.homes.auth.oauth.config.OAuthProperties;
import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;
import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwk.SigningKeyNotFoundException;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.net.URI;
import java.security.interfaces.RSAPublicKey;
import java.util.concurrent.TimeUnit;

/**
 * OIDC id_token 공통 검증: JWKS(RS256 서명) + iss + aud + exp. JWKS 키는 캐싱하고 kid 미스매치 시 재조회된다.
 */
abstract class AbstractOidcVerifier implements OAuthVerifier {

    private static final long LEEWAY_SECONDS = 30;

    private final OAuthProperties.Provider config;
    private final JwkProvider jwkProvider;

    protected AbstractOidcVerifier(OAuthProperties.Provider config) {
        this.config = config;
        this.jwkProvider = new JwkProviderBuilder(toUrl(config.jwksUri()))
                .cached(10, 24, TimeUnit.HOURS)
                .rateLimited(10, 1, TimeUnit.MINUTES)
                .build();
    }

    /** 검증 성공 시 디코딩된 토큰 반환, 실패 시 INVALID_ID_TOKEN. */
    protected DecodedJWT verifyAndDecode(String idToken) {
        try {
            DecodedJWT decoded = JWT.decode(idToken);
            Jwk jwk = jwkProvider.get(decoded.getKeyId());
            RSAPublicKey publicKey = (RSAPublicKey) jwk.getPublicKey();
            JWT.require(Algorithm.RSA256(publicKey, null))
                    .withIssuer(config.issuer())
                    .withAudience(config.audience())
                    .withClaim("sub", (claim, jwt) -> {
                        String subject = claim.asString();
                        return subject != null
                                && !subject.isBlank()
                                && subject.length() <= 255;
                    })
                    .withClaimPresence("exp")
                    .withClaimPresence("iat")
                    .acceptLeeway(LEEWAY_SECONDS)
                    .build()
                    .verify(idToken);
            return decoded;
        } catch (SigningKeyNotFoundException | JWTVerificationException
                 | IllegalArgumentException | ClassCastException e) {
            throw new CustomException(ErrorCode.INVALID_ID_TOKEN);
        } catch (JwkException e) {
            throw new CustomException(ErrorCode.OAUTH_PROVIDER_UNAVAILABLE);
        }
    }

    private static java.net.URL toUrl(String url) {
        try {
            return URI.create(url).toURL();
        } catch (Exception e) {
            throw new IllegalStateException("Invalid JWKS URL: " + url, e);
        }
    }
}
