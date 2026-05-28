package app.pickhouse.residence;

import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.security.JwtAuthFilter;
import app.pickhouse.security.JwtVerifier;
import app.pickhouse.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ResidenceController.class)
@Import({SecurityConfig.class, ResidenceControllerTest.TestBeans.class})
class ResidenceControllerTest {

    @Autowired MockMvc mvc;
    @MockBean ResidenceService service;

    @TestConfiguration
    static class TestBeans {
        @Bean @Primary JwtVerifier jwtVerifier() { return mock(JwtVerifier.class); }
        @Bean @Primary JwtAuthFilter jwtAuthFilter(JwtVerifier v) { return new JwtAuthFilter(v); }
    }

    private static UsernamePasswordAuthenticationToken auth(UUID userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of());
    }

    private static ResidenceDto sample(UUID id) {
        return new ResidenceDto(
            id, null, "sample", null, false, false,
            null, null, null, null, null, null,
            null, null, null, null, null,
            null, null, null, null, null, null,
            null, null, null, null, null, null, null, null,
            null, List.of(),
            LocalDate.of(2024, 1, 1), LocalDate.of(2026, 1, 1),
            null, null, List.of(), null,
            Instant.now(), Instant.now()
        );
    }

    @Test
    void create_returns_201() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID rId = UUID.randomUUID();
        when(service.create(eq(userId), any())).thenReturn(sample(rId));

        String body = """
            {"name":"sample","contractStartDate":"2024-01-01","contractEndDate":"2026-01-01"}
            """;
        mvc.perform(post("/residences").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(rId.toString()))
            .andExpect(jsonPath("$.name").value("sample"));
    }

    @Test
    void create_validates_name_required() throws Exception {
        UUID userId = UUID.randomUUID();
        String body = """
            {"contractStartDate":"2024-01-01","contractEndDate":"2026-01-01"}
            """;
        mvc.perform(post("/residences").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_array() throws Exception {
        UUID userId = UUID.randomUUID();
        when(service.list(userId)).thenReturn(List.of(sample(UUID.randomUUID())));

        mvc.perform(get("/residences").with(authentication(auth(userId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void patch_returns_updated() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID rId = UUID.randomUUID();
        when(service.update(eq(userId), eq(rId), any())).thenReturn(sample(rId));

        mvc.perform(patch("/residences/" + rId).with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"isCurrent\":true}"))
            .andExpect(status().isOk());
    }

    @Test
    void delete_returns_204() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID rId = UUID.randomUUID();
        mvc.perform(delete("/residences/" + rId).with(authentication(auth(userId))))
            .andExpect(status().isNoContent());
    }

    @Test
    void unauthenticated_returns_401() throws Exception {
        mvc.perform(get("/residences")).andExpect(status().isUnauthorized());
    }
}
