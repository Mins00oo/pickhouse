package app.pickhouse.domain.auth.dto.response;

import app.pickhouse.domain.user.dto.response.UserResponse;

public record LoginResponse(String accessToken, String refreshToken, UserResponse user) {}
