package app.pickhouse.house;

import app.pickhouse.domain.house.DealType;
import app.pickhouse.house.dto.HouseDto;
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

@WebMvcTest(HouseController.class)
@Import({SecurityConfig.class, HouseControllerTest.TestBeans.class})
class HouseControllerTest {

    @Autowired MockMvc mvc;
    @MockBean HouseService service;

    @TestConfiguration
    static class TestBeans {
        @Bean @Primary JwtVerifier jwtVerifier() { return mock(JwtVerifier.class); }
        @Bean @Primary JwtAuthFilter jwtAuthFilter(JwtVerifier v) { return new JwtAuthFilter(v); }
    }

    private static UsernamePasswordAuthenticationToken auth(UUID userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of());
    }

    private static HouseDto sampleDto(UUID id) {
        return new HouseDto(id, null, DealType.JEONSE, 50000, 0,
            null, null, null, null, null, null, null,
            null, null, null, null, null,
            null, null, null,
            null, null, null, null, null, null, null, null,
            null,
            // ── 위저드 신규 필드 (nickname..fullOption) ──
            null, null, null, null, null, null, null, null, null,
            List.of(), Instant.now(), Instant.now());
    }

    @Test
    void create_returns_201_with_house_dto() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(service.create(eq(userId), any())).thenReturn(sampleDto(houseId));

        String body = """
            {"address":{"roadAddress":"서울 강남구"},"dealType":"JEONSE","deposit":50000,"rent":0}
            """;
        mvc.perform(post("/houses").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(houseId.toString()))
            .andExpect(jsonPath("$.dealType").value("JEONSE"));
    }

    @Test
    void create_with_wizard_fields_round_trips_through_dto() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        HouseDto dto = new HouseDto(houseId, null, DealType.WOLSE, 1000, 60,
            null, null, null, null, null, null, null,
            null, null, null, null, null,
            null, null, null,
            3, null, null, null, null, null, null, null,
            null,
            "우리집", null, null,
            app.pickhouse.domain.house.RoomType.TWO_ROOM,
            app.pickhouse.domain.house.FloorType.GROUND,
            app.pickhouse.domain.house.Direction.SOUTH,
            List.of(app.pickhouse.domain.house.MaintenanceUtility.WATER),
            java.util.Map.of("WATER", 2),
            true,
            List.of(), Instant.now(), Instant.now());
        when(service.create(eq(userId), any())).thenReturn(dto);

        String body = """
            {"dealType":"WOLSE","deposit":1000,"rent":60,"nickname":"우리집",
             "roomType":"TWO_ROOM","floorType":"GROUND","direction":"SOUTH",
             "maintenanceIncludes":["WATER"],"utilityEstimates":{"WATER":2},
             "fullOption":true,"waterPressure":3}
            """;
        mvc.perform(post("/houses").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nickname").value("우리집"))
            .andExpect(jsonPath("$.direction").value("SOUTH"))
            .andExpect(jsonPath("$.roomType").value("TWO_ROOM"))
            .andExpect(jsonPath("$.maintenanceIncludes[0]").value("WATER"))
            .andExpect(jsonPath("$.utilityEstimates.WATER").value(2))
            .andExpect(jsonPath("$.fullOption").value(true));
    }

    @Test
    void create_rejects_condition_above_3() throws Exception {
        UUID userId = UUID.randomUUID();
        String body = """
            {"dealType":"WOLSE","deposit":1000,"rent":60,"waterPressure":4}
            """;
        mvc.perform(post("/houses").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void create_accepts_condition_boundary_3() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(service.create(eq(userId), any())).thenReturn(sampleDto(houseId));
        String body = """
            {"dealType":"WOLSE","deposit":1000,"rent":60,"waterPressure":3}
            """;
        mvc.perform(post("/houses").with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
    }

    @Test
    void get_returns_house_for_owner() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(service.get(userId, houseId)).thenReturn(sampleDto(houseId));

        mvc.perform(get("/houses/" + houseId).with(authentication(auth(userId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(houseId.toString()));
    }

    @Test
    void list_returns_array() throws Exception {
        UUID userId = UUID.randomUUID();
        when(service.list(userId)).thenReturn(List.of(sampleDto(UUID.randomUUID())));

        mvc.perform(get("/houses").with(authentication(auth(userId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void delete_returns_204() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        mvc.perform(delete("/houses/" + houseId).with(authentication(auth(userId))))
            .andExpect(status().isNoContent());
    }

    @Test
    void patch_returns_updated_house() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        when(service.update(eq(userId), eq(houseId), any())).thenReturn(sampleDto(houseId));

        mvc.perform(patch("/houses/" + houseId).with(authentication(auth(userId)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"rent\":80}"))
            .andExpect(status().isOk());
    }

    @Test
    void unauthenticated_returns_401() throws Exception {
        mvc.perform(get("/houses")).andExpect(status().isUnauthorized());
    }
}
