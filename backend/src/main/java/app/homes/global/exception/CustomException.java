package app.homes.global.exception;

import lombok.Getter;

/**
 * 서비스 로직에서 던지는 비즈니스 예외. ErrorCode를 담아 GlobalExceptionHandler가 공통 응답으로 변환한다.
 */
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
