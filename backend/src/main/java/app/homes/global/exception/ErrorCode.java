package app.homes.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 에러 단일 출처: (HTTP 상태, 코드 문자열, 메시지).
 * code 문자열은 enum 이름을 그대로 사용한다(HOUSE_NOT_FOUND 등).
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다"),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다"),

    // 인증/인가
    AUTH_REQUIRED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다"),
    AUTH_EXPIRED(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다"),
    AUTH_INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다");

    private final HttpStatus status;
    private final String message;

    public String code() {
        return name();
    }
}
