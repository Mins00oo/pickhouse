package app.pickhouse.common.error;

import lombok.Getter;

import java.util.Map;

@Getter
public class ApiException extends RuntimeException {
    private final ErrorCode code;
    private final Map<String, Object> details;

    public ApiException(ErrorCode code, String message) {
        this(code, message, Map.of());
    }

    public ApiException(ErrorCode code, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
