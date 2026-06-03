package app.pickhouse.anchor;

import app.pickhouse.anchor.dto.AnchorPlaceDto;
import app.pickhouse.domain.anchor.AnchorType;
import app.pickhouse.domain.anchor.TransportMode;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnchorPlaceController.class)
@Import({SecurityConfig.class, AnchorPlaceControllerTest.TestBeans.class})
class AnchorPlaceControllerTest {

    @Autowired MockMvc mvc;
    @MockBean AnchorPlaceService service;

    @TestConfiguration
    static class TestBeans {
        @Bean @Primary JwtVerifier jwtVerifier() { return mock(JwtVerifier.class); }
        @Bean @Primary JwtAuthFilter jwtAuthFilter(JwtVerifier v) { return new JwtAuthFilter(v); }
    }

    private static UsernamePasswordAuthenticationToken auth(UUID userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of());
    }

    private static AnchorPlaceDto sample(UUID id) {
        return new AnchorPlaceDto(id, AnchorType.WORKPLACE, "판교 회사", null,
            TransportMode.TRANSIT, true, Instant.now(), Instant.now());
    }

    @Test
    void list_returns_array() throws Exception {
        UUID userId = UUID.randomUUID();
        when(service.list(userId)).thenReturn(List.of(sample(UUID.randomUUID())));

        mvc.perform(get("/anchor-places").with(authentication(auth(userId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void create_returns_201_with_dto() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(service.create(eq(userId), any())).thenReturn(sample(id));

        String body = """
            {"anchorType":"WORKPLACE","label":"판교 회사","transport":"TRANSIT","isPrimary":true}
            """;
        mvc.perform(post("/anchor-places").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.anchorType").value("WORKPLACE"))
            .andExpect(jsonPath("$.transport").value("TRANSIT"))
            .andExpect(jsonPath("$.isPrimary").value(true));
    }

    @Test
    void create_rejects_missing_required_fields() throws Exception {
        UUID userId = UUID.randomUUID();
        mvc.perform(post("/anchor-places").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"label\":\"x\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void patch_returns_updated_dto() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        when(service.update(eq(userId), eq(id), any())).thenReturn(sample(id));

        mvc.perform(patch("/anchor-places/" + id).with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"label\":\"새 회사\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void delete_returns_204() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID id = UUID.randomUUID();
        mvc.perform(delete("/anchor-places/" + id).with(authentication(auth(userId))))
            .andExpect(status().isNoContent());
    }

    @Test
    void unauthenticated_returns_401() throws Exception {
        mvc.perform(get("/anchor-places")).andExpect(status().isUnauthorized());
    }
}
