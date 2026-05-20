package app.pickhouse.common.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    UNPROCESSABLE_ENTITY(HttpStatus.UNPROCESSABLE_ENTITY),
    OAUTH_VERIFICATION_FAILED(HttpStatus.UNAUTHORIZED),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;
    ErrorCode(HttpStatus s) { this.status = s; }
    public HttpStatus status() { return status; }
}
