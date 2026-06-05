package app.pickhouse.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "요청이 올바르지 않습니다."),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값 검증에 실패했습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자 정보를 찾을 수 없습니다."),
    USER_MISSING(HttpStatus.INTERNAL_SERVER_ERROR, "OAuth 계정에 연결된 사용자를 찾을 수 없습니다."),

    HOUSE_NOT_FOUND(HttpStatus.NOT_FOUND, "집 정보를 찾을 수 없습니다."),
    HOUSE_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 존재하는 집 ID입니다."),

    MY_PLACE_NOT_FOUND(HttpStatus.NOT_FOUND, "내 장소 정보를 찾을 수 없습니다."),
    MY_PLACE_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 존재하는 내 장소 ID입니다."),

    PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "사진 정보를 찾을 수 없습니다."),
    PHOTO_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 존재하는 사진 ID입니다."),
    PHOTO_FILE_REQUIRED(HttpStatus.BAD_REQUEST, "사진 파일이 필요합니다."),
    PHOTO_LINK_TARGET_REQUIRED(HttpStatus.BAD_REQUEST, "사진을 연결할 대상이 필요합니다."),
    PHOTO_TARGET_CONFLICT(HttpStatus.BAD_REQUEST, "이미 다른 집에 연결된 사진입니다."),
    PHOTO_OWNER_NOT_FOUND(HttpStatus.BAD_REQUEST, "일부 사진을 찾을 수 없거나 현재 사용자에게 속하지 않습니다."),
    PHOTO_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "사진 업로드 파일을 읽지 못했습니다."),

    FILE_MIME_TYPE_REQUIRED(HttpStatus.BAD_REQUEST, "파일 MIME 타입이 필요합니다."),
    FILE_UNSUPPORTED_MIME_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식입니다."),
    FILE_SIZE_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "파일 크기가 허용 범위를 벗어났습니다."),
    FILE_STORAGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다."),

    OAUTH_UNSUPPORTED_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 OAuth 제공자입니다."),
    OAUTH_VERIFICATION_FAILED(HttpStatus.UNAUTHORIZED, "OAuth 인증 검증에 실패했습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() { return status; }
    public String defaultMessage() { return defaultMessage; }
}
