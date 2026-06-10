package app.homes;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 1단계 스모크 테스트:
 * - 컨텍스트 로드 + Flyway(V1/V2) 마이그레이션 + ddl-auto=validate 통과
 * - 보호 경로 미인증 접근 시 401 + 공통 응답 형식
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class HomesApplicationTests {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.33");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("db.url", MYSQL::getJdbcUrl);
        registry.add("db.username", MYSQL::getUsername);
        registry.add("db.password", MYSQL::getPassword);
        registry.add("jwt.secret", () -> "test-secret-test-secret-test-secret-0123456789ABCDEF");
    }

    @Autowired
    MockMvc mockMvc;

    @Test
    void contextLoads() {
    }

    @Test
    void protectedEndpointReturns401InCommonFormat() throws Exception {
        mockMvc.perform(get("/api/ping"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_REQUIRED"))
                .andExpect(jsonPath("$.message").exists());
    }
}
