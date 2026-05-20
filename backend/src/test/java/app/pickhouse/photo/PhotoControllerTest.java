package app.pickhouse.photo;

import app.pickhouse.photo.dto.PhotoDto;
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
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PhotoController.class)
@Import({SecurityConfig.class, PhotoControllerTest.TestBeans.class})
class PhotoControllerTest {

    @Autowired MockMvc mvc;
    @MockBean PhotoService service;

    @TestConfiguration
    static class TestBeans {
        @Bean @Primary JwtVerifier jwtVerifier() { return mock(JwtVerifier.class); }
        @Bean @Primary JwtAuthFilter jwtAuthFilter(JwtVerifier v) { return new JwtAuthFilter(v); }
    }

    private static UsernamePasswordAuthenticationToken auth(UUID userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, List.of());
    }

    @Test
    void upload_returns_201_with_photo_dto() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        PhotoDto dto = new PhotoDto(photoId, null, null, "https://api/files/" + photoId + ".jpg",
            null, Instant.now());
        when(service.upload(eq(userId), any(), eq(null), eq(null), eq(null))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile("file", "x.jpg", "image/jpeg", "bytes".getBytes());

        mvc.perform(multipart("/photos/upload").file(file)
                .with(authentication(auth(userId))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(photoId.toString()))
            .andExpect(jsonPath("$.remoteUrl").value("https://api/files/" + photoId + ".jpg"));
    }

    @Test
    void upload_with_houseId_query_param_passes_to_service() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID houseId = UUID.randomUUID();
        UUID photoId = UUID.randomUUID();
        PhotoDto dto = new PhotoDto(photoId, houseId, null, "url", null, Instant.now());
        when(service.upload(eq(userId), any(), eq(houseId), eq(null), eq(null))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile("file", "x.jpg", "image/jpeg", "bytes".getBytes());

        mvc.perform(multipart("/photos/upload").file(file)
                .param("houseId", houseId.toString())
                .with(authentication(auth(userId))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.houseId").value(houseId.toString()));
    }

    @Test
    void upload_unauthenticated_returns_401() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "x.jpg", "image/jpeg", "bytes".getBytes());
        mvc.perform(multipart("/photos/upload").file(file))
            .andExpect(status().isUnauthorized());
    }
}
