package app.pickhouse.domain.auth.oauth;

import app.pickhouse.domain.auth.entity.OAuthProvider;

public interface OAuthVerifier {
    OAuthProvider provider();
    OAuthVerifiedUser verify(String idToken);
}
