package app.pickhouse.common.error;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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

    @Test
    void api_exception_with_details_propagates_details() {
        ResponseEntity<ErrorResponse> resp = handler.handleApi(
            new ApiException(ErrorCode.UNPROCESSABLE_ENTITY, "bad input", Map.of("hint", "check email")));
        assertThat(resp.getStatusCode().value()).isEqualTo(422);
        assertThat(resp.getBody().error().details()).containsEntry("hint", "check email");
    }

    @Test
    void unhandled_exception_returns_500_with_generic_message() {
        ResponseEntity<ErrorResponse> resp = handler.handleAny(new RuntimeException("internal db blew up"));
        assertThat(resp.getStatusCode().value()).isEqualTo(500);
        assertThat(resp.getBody().error().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(resp.getBody().error().message()).isEqualTo("internal error");
    }

    @Test
    void constraint_violation_returns_400_with_structured_fields_not_raw_message() {
        ConstraintViolation<?> v = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("createUser.arg0.email");
        when(v.getPropertyPath()).thenReturn(path);
        when(v.getMessage()).thenReturn("must be a well-formed email address");

        ConstraintViolationException ex = new ConstraintViolationException(Set.of(v));

        ResponseEntity<ErrorResponse> resp = handler.handleConstraint(ex);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody().error().code()).isEqualTo("BAD_REQUEST");
        assertThat(resp.getBody().error().message()).isEqualTo("validation failed");
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) resp.getBody().error().details().get("fields");
        assertThat(fields).containsEntry("email", "must be a well-formed email address");
        // Ensure the raw "createUser.arg0.email" parameter path is NOT leaked
        assertThat(fields).doesNotContainKey("createUser.arg0.email");
    }
}
