package app.homes.auth.controller;

import app.homes.auth.dto.LoginRequest;
import app.homes.auth.dto.LoginResponse;
import app.homes.auth.dto.LogoutRequest;
import app.homes.auth.dto.RefreshTokenRequest;
import app.homes.auth.service.AuthService;
import app.homes.auth.service.RefreshTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    /** 소셜 로그인 (응답은 ApiResponseAdvice가 {code,message,data}로 래핑) */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(@RequestBody @Valid RefreshTokenRequest request) {
        return refreshTokenService.refresh(request);
    }

    @PostMapping("/logout")
    public void logout(@RequestBody @Valid LogoutRequest request) {
        refreshTokenService.logout(request);
    }
}
