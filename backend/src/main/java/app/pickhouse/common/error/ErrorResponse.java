package app.pickhouse.common.error;

import java.util.Map;

public record ErrorResponse(Body error) {
    public static ErrorResponse of(ErrorCode code, String message, Map<String, Object> details) {
        return new ErrorResponse(new Body(code.name(), message, details));
    }
    public record Body(String code, String message, Map<String, Object> details) {}
}
