package app.pickhouse.auth;

import app.pickhouse.auth.dto.LoginResponse;
import app.pickhouse.auth.dto.UserDto;
import app.pickhouse.security.JwtAuthFilter;
import app.pickhouse.security.JwtVerifier;
import app.pickhouse.security.SecurityConfig;
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
        UserDto user = new UserDto(UUID.randomUUID(), "x@k.com", "닉네임", now);
        when(authService.login(any())).thenReturn(new LoginResponse("acc.jwt", "ref.jwt", user));

        String body = """
            {"provider":"KAKAO","idToken":"abc"}
            """;
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("acc.jwt"))
            .andExpect(jsonPath("$.refreshToken").value("ref.jwt"))
            .andExpect(jsonPath("$.user.nickname").value("닉네임"));
    }

    @Test
    void login_validates_missing_fields() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void refresh_returns_new_token_pair() throws Exception {
        when(authService.refresh(any()))
            .thenReturn(new app.pickhouse.auth.dto.TokenPair("new.acc.jwt", "new.ref.jwt"));

        String body = """
            {"refreshToken":"old.ref.jwt"}
            """;
        mvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("new.acc.jwt"))
            .andExpect(jsonPath("$.refreshToken").value("new.ref.jwt"));
    }
}
