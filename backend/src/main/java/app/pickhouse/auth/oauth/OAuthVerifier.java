package app.pickhouse.auth.oauth;

import app.pickhouse.domain.user.OAuthProvider;

public interface OAuthVerifier {
    OAuthProvider provider();
    OAuthVerifiedUser verify(String idToken);
}
