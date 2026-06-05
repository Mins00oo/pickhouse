package app.pickhouse.domain.auth.dto.request;

import app.pickhouse.domain.auth.entity.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
    @NotNull OAuthProvider provider,
    @NotBlank String idToken
) {}
