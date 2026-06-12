package app.homes.global.security;

import app.homes.global.exception.ErrorCode;
import app.homes.user.repository.UserRepository;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.exceptions.TokenExpiredException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Authorization: Bearer 토큰을 검증해 SecurityContext에 userId를 등록한다.
 * 토큰이 없거나 유효하지 않으면 인증 없이 통과시키고, 인가 단계에서 EntryPoint가 401을 낸다.
 * (@Component 로 두지 않고 SecurityConfig에서 직접 생성 — 서블릿 필터 이중 등록 방지)
 */
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length());
            try {
                String userId = jwtProvider.verifyAndGetUserId(token);
                boolean active = userRepository.findById(userId)
                        .map(user -> user.isActive())
                        .orElse(false);
                if (!active) {
                    request.setAttribute(
                            JwtAuthenticationEntryPoint.ERROR_CODE_ATTRIBUTE,
                            ErrorCode.AUTH_INVALID_TOKEN
                    );
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (TokenExpiredException e) {
                request.setAttribute(
                        JwtAuthenticationEntryPoint.ERROR_CODE_ATTRIBUTE,
                        ErrorCode.AUTH_EXPIRED
                );
                SecurityContextHolder.clearContext();
            } catch (JWTVerificationException e) {
                request.setAttribute(
                        JwtAuthenticationEntryPoint.ERROR_CODE_ATTRIBUTE,
                        ErrorCode.AUTH_INVALID_TOKEN
                );
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
