package app.pickhouse.auth.dto;

public record LoginResponse(String accessToken, String refreshToken, UserDto user) {}
