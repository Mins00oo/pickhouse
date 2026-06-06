package app.pickhouse.domain.auth.controller;

import app.pickhouse.domain.auth.dto.response.LoginResponse;
import app.pickhouse.domain.auth.service.AuthService;
import app.pickhouse.domain.user.dto.response.UserResponse;
import app.pickhouse.domain.auth.entity.OAuthProvider;
import app.pickhouse.global.security.JwtAuthFilter;
import app.pickhouse.global.security.JwtVerifier;
import app.pickhouse.global.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, AuthControllerTest.TestBeans.class})
class AuthControllerTest {

    @TestConfiguration
    static class TestBeans {
        // Provide a real JwtAuthFilter (with a mocked JwtVerifier) so the filter chain forwards.
        @Bean
        @Primary
        JwtVerifier jwtVerifier() {
            return org.mockito.Mockito.mock(JwtVerifier.class);
        }

        @Bean
        @Primary
        JwtAuthFilter jwtAuthFilter(JwtVerifier verifier) {
            return new JwtAuthFilter(verifier);
        }
    }

    @Autowired MockMvc mvc;
    @MockBean AuthService authService;

    @Test
    void login_returns_token_pair() throws Exception {
        Instant now = Instant.now();
        UserResponse user = new UserResponse(UUID.randomUUID(), "x@k.com", "닉네임", now);
        when(authService.login(any())).thenReturn(new LoginResponse("acc.jwt", "ref.jwt", user));

        String body = """
            {"provider":"KAKAO","idToken":"abc"}
            """;
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("acc.jwt"))
            .andExpect(jsonPath("$.data.refreshToken").value("ref.jwt"))
            .andExpect(jsonPath("$.data.user.nickname").value("닉네임"))
            .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void login_accepts_lowercase_provider_from_mobile() throws Exception {
        Instant now = Instant.now();
        UserResponse user = new UserResponse(UUID.randomUUID(), "x@k.com", "picker", now);
        when(authService.login(argThat(req -> req.provider() == OAuthProvider.APPLE)))
            .thenReturn(new LoginResponse("acc.jwt", "ref.jwt", user));

        String body = """
            {"provider":"apple","idToken":"abc"}
            """;
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("acc.jwt"));
    }

    @Test
    void login_validates_missing_fields() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.error.message").value("입력값 검증에 실패했습니다."));
    }

    @Test
    void refresh_returns_new_token_pair() throws Exception {
        when(authService.refresh(any()))
            .thenReturn(new app.pickhouse.domain.auth.dto.response.TokenPair("new.acc.jwt", "new.ref.jwt"));

        String body = """
            {"refreshToken":"old.ref.jwt"}
            """;
        mvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("new.acc.jwt"))
            .andExpect(jsonPath("$.data.refreshToken").value("new.ref.jwt"));
    }
}
