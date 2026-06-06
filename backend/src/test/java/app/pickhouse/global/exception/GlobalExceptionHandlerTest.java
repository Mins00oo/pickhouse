package app.pickhouse.global.exception;

import app.pickhouse.global.response.ApiResponse;
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
    void api_exception_maps_default_error_code_message_to_response() {
        ResponseEntity<ApiResponse<Void>> resp = handler.handleApi(
            new BusinessException(ErrorCode.HOUSE_NOT_FOUND));
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertThat(resp.getBody().success()).isFalse();
        assertThat(resp.getBody().data()).isNull();
        assertThat(resp.getBody().error().code()).isEqualTo("HOUSE_NOT_FOUND");
        assertThat(resp.getBody().error().message()).isEqualTo("집 정보를 찾을 수 없습니다.");
    }

    @Test
    void api_exception_can_override_default_message() {
        ResponseEntity<ApiResponse<Void>> resp = handler.handleApi(
            new BusinessException(ErrorCode.BAD_REQUEST, "요청 본문을 다시 확인해 주세요."));
        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody().error().code()).isEqualTo("BAD_REQUEST");
        assertThat(resp.getBody().error().message()).isEqualTo("요청 본문을 다시 확인해 주세요.");
    }

    @Test
    void api_exception_with_details_propagates_details() {
        ResponseEntity<ApiResponse<Void>> resp = handler.handleApi(
            new BusinessException(ErrorCode.BAD_REQUEST, Map.of("hint", "check email")));
        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody().error().message()).isEqualTo("요청이 올바르지 않습니다.");
        assertThat(resp.getBody().error().details()).containsEntry("hint", "check email");
    }

    @Test
    void unhandled_exception_returns_500_with_generic_message() {
        ResponseEntity<ApiResponse<Void>> resp = handler.handleAny(new RuntimeException("internal db blew up"));
        assertThat(resp.getStatusCode().value()).isEqualTo(500);
        assertThat(resp.getBody().error().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(resp.getBody().error().message()).isEqualTo("서버 내부 오류가 발생했습니다.");
    }

    @Test
    void constraint_violation_returns_400_with_structured_fields_not_raw_message() {
        ConstraintViolation<?> v = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("createUser.arg0.email");
        when(v.getPropertyPath()).thenReturn(path);
        when(v.getMessage()).thenReturn("must be a well-formed email address");

        ConstraintViolationException ex = new ConstraintViolationException(Set.of(v));

        ResponseEntity<ApiResponse<Void>> resp = handler.handleConstraint(ex);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody().error().code()).isEqualTo("VALIDATION_FAILED");
        assertThat(resp.getBody().error().message()).isEqualTo("입력값 검증에 실패했습니다.");
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) resp.getBody().error().details().get("fields");
        assertThat(fields).containsEntry("email", "must be a well-formed email address");
        assertThat(fields).doesNotContainKey("createUser.arg0.email");
    }
}
