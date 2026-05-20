package app.pickhouse.auth.dto;

import app.pickhouse.domain.user.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
    @NotNull OAuthProvider provider,
    @NotBlank String idToken
) {}
