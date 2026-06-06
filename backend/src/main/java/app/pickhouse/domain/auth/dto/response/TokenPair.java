package app.pickhouse.domain.auth.dto.response;

public record TokenPair(String accessToken, String refreshToken) {}
