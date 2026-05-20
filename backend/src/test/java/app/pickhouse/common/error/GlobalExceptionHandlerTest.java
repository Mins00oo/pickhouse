package app.pickhouse.common.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void api_exception_maps_to_response() {
        ResponseEntity<ErrorResponse> resp = handler.handleApi(
            new ApiException(ErrorCode.NOT_FOUND, "house missing"));
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertThat(resp.getBody().error().code()).isEqualTo("NOT_FOUND");
        assertThat(resp.getBody().error().message()).isEqualTo("house missing");
    }
}
