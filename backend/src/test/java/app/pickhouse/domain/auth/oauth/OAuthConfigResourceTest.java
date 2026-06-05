package app.pickhouse.domain.auth.oauth;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class OAuthConfigResourceTest {

    @Test
    void kakao_audience_uses_id_token_audience_env_with_legacy_fallback() throws IOException {
        String application = Files.readString(Path.of("src/main/resources/application.yml"));
        String production = Files.readString(Path.of("src/main/resources/application-prod.yml"));
        String deployExample = Files.readString(Path.of("deploy/.env.example"));
        String prodCompose = Files.readString(Path.of("docker-compose.prod.yml"));

        assertThat(application).contains("KAKAO_ID_TOKEN_AUDIENCE");
        assertThat(application).contains("KAKAO_REST_API_KEY");
        assertThat(production).contains("KAKAO_ID_TOKEN_AUDIENCE");
        assertThat(production).contains("KAKAO_REST_API_KEY");
        assertThat(deployExample).contains("KAKAO_ID_TOKEN_AUDIENCE=");
        assertThat(prodCompose).contains("KAKAO_ID_TOKEN_AUDIENCE");
    }

    @Test
    void uuid_jdbc_type_is_char_to_match_mysql_char_36_columns() throws IOException {
        String application = Files.readString(Path.of("src/main/resources/application.yml"));

        assertThat(application).contains("preferred_uuid_jdbc_type: CHAR");
    }
}
