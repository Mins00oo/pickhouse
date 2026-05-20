package app.pickhouse.security;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtVerifier {

    private final JwtKeyProvider keys;
    private final JwtProperties props;

    public VerifiedClaims verifyAccess(String token) {
        return verify(token, "access");
    }

    public VerifiedClaims verifyRefresh(String token) {
        return verify(token, "refresh");
    }

    private VerifiedClaims verify(String token, String expectedType) {
        try {
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
                .withIssuer(props.issuer())
                .withClaim("type", expectedType)
                .build()
                .verify(token);
            UUID userId = UUID.fromString(decoded.getSubject());
            UUID jti = decoded.getId() != null ? UUID.fromString(decoded.getId()) : null;
            String email = decoded.getClaim("email").asString();
            return new VerifiedClaims(userId, expectedType, jti, email);
        } catch (JWTVerificationException ex) {
            throw new ApiException(ErrorCode.INVALID_TOKEN, "invalid token: " + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(ErrorCode.INVALID_TOKEN, "malformed token claim: " + ex.getMessage());
        }
    }

    public record VerifiedClaims(UUID userId, String type, UUID jti, String email) {}
}
