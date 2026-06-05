package app.pickhouse.global.exception;

import java.util.Map;

public record ErrorResponse(String code, String message, Map<String, Object> details) {
    public ErrorResponse {
        details = details == null ? Map.of() : Map.copyOf(details);
    }

    public static ErrorResponse of(ErrorCode code, String message, Map<String, Object> details) {
        return new ErrorResponse(code.name(), message, details);
    }

    public static ErrorResponse of(ErrorCode code, Map<String, Object> details) {
        return of(code, code.defaultMessage(), details);
    }

    public static ErrorResponse of(ErrorCode code) {
        return of(code, Map.of());
    }
}
