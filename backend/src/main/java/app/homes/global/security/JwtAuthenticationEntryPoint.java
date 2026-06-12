package app.homes.global.security;

import app.homes.global.exception.ErrorCode;
import app.homes.global.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 인증 실패(401)를 공통 응답 형식으로 직접 작성한다. (필터 단계라 GlobalExceptionHandler가 못 잡음)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    public static final String ERROR_CODE_ATTRIBUTE =
            JwtAuthenticationEntryPoint.class.getName() + ".ERROR_CODE";

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        Object attribute = request.getAttribute(ERROR_CODE_ATTRIBUTE);
        ErrorCode ec = attribute instanceof ErrorCode errorCode
                ? errorCode
                : ErrorCode.AUTH_REQUIRED;
        response.setStatus(ec.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.error(ec.code(), ec.getMessage()));
    }
}
