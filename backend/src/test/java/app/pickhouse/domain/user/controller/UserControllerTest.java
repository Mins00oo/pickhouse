package app.pickhouse.domain.user.controller;

import app.pickhouse.domain.user.service.UserService;
import app.pickhouse.global.security.JwtAuthFilter;
import app.pickhouse.global.security.JwtVerifier;
import app.pickhouse.global.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, UserControllerTest.TestBeans.class})
class UserControllerTest {

    @TestConfiguration
    static class TestBeans {
        @Bean
        @Primary
        JwtVerifier jwtVerifier() {
            return mock(JwtVerifier.class);
        }

        @Bean
        @Primary
        JwtAuthFilter jwtAuthFilter(JwtVerifier verifier) {
            return new JwtAuthFilter(verifier);
        }
    }

    @Autowired MockMvc mvc;
    @MockBean UserService userService;

    @Test
    void get_me_returns_current_user() throws Exception {
        UUID userId = UUID.randomUUID();
        var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
        when(userService.getSelf(userId)).thenReturn(
            new app.pickhouse.domain.user.dto.response.UserResponse(userId, "me@example.com", "picker", Instant.now())
        );

        mvc.perform(get("/me").with(authentication(auth)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(userId.toString()))
            .andExpect(jsonPath("$.data.email").value("me@example.com"))
            .andExpect(jsonPath("$.data.nickname").value("picker"));
    }

    @Test
    void delete_me_returns_204_and_calls_service() throws Exception {
        UUID userId = UUID.randomUUID();
        var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());

        mvc.perform(delete("/me").with(authentication(auth)))
            .andExpect(status().isNoContent());

        verify(userService).softDeleteSelf(userId);
    }

    @Test
    void delete_me_returns_401_without_auth() throws Exception {
        mvc.perform(delete("/me")).andExpect(status().isUnauthorized());
    }
}
