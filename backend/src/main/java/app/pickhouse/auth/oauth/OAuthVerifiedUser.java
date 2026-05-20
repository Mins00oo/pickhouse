package app.pickhouse.auth.oauth;

import app.pickhouse.domain.user.OAuthProvider;

public record OAuthVerifiedUser(
    OAuthProvider provider,
    String providerId,
    String email
) {}
