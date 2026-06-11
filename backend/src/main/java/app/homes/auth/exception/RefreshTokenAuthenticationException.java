package app.homes.auth.exception;

import app.homes.global.exception.CustomException;
import app.homes.global.exception.ErrorCode;

public class RefreshTokenAuthenticationException extends CustomException {

    public RefreshTokenAuthenticationException(ErrorCode errorCode) {
        super(errorCode);
    }
}
