package app.pickhouse.domain.auth.oauth;

import app.pickhouse.domain.auth.entity.OAuthProvider;

public record OAuthVerifiedUser(
    OAuthProvider provider,
    String providerId,
    String email
) {}
