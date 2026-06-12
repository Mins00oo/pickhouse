package app.homes.global.response;

import lombok.Getter;

/**
 * 모든 API 응답의 공통 형식: { code, message, data }
 * - code: "SUCCESS" 또는 ErrorCode의 코드 문자열
 * - message: 개발자용 메시지(프론트는 HTTP 상태/코드로 분기)
 * - data: 실제 데이터(실패 시 null, 검증 실패 시 필드 목록 등)
 */
@Getter
public class ApiResponse<T> {

    public static final String SUCCESS_CODE = "SUCCESS";

    private final String code;
    private final String message;
    private final T data;

    private ApiResponse(String code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(SUCCESS_CODE, "OK", data);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>(SUCCESS_CODE, "OK", null);
    }

    public static ApiResponse<Void> error(String code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public static <T> ApiResponse<T> of(String code, String message, T data) {
        return new ApiResponse<>(code, message, data);
    }
}
