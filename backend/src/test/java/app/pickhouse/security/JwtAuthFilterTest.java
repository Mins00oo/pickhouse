package app.pickhouse.security;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JwtAuthFilterTest {

    private JwtVerifier verifier;
    private JwtAuthFilter filter;
    private HttpServletRequest req;
    private HttpServletResponse res;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        verifier = mock(JwtVerifier.class);
        filter = new JwtAuthFilter(verifier);
        req = mock(HttpServletRequest.class);
        res = mock(HttpServletResponse.class);
        chain = mock(FilterChain.class);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void valid_bearer_token_populates_security_context() throws Exception {
        UUID userId = UUID.randomUUID();
        when(req.getHeader("Authorization")).thenReturn("Bearer good.token");
        when(verifier.verifyAccess("good.token"))
            .thenReturn(new JwtVerifier.VerifiedClaims(userId, "access", null, "u@x.com"));

        filter.doFilter(req, res, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(userId);
        verify(chain).doFilter(req, res);
    }

    @Test
    void missing_header_leaves_security_context_empty() throws Exception {
        when(req.getHeader("Authorization")).thenReturn(null);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
    }

    @Test
    void non_bearer_header_leaves_security_context_empty() throws Exception {
        when(req.getHeader("Authorization")).thenReturn("Basic abc123");

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
        verify(verifier, never()).verifyAccess(any());
    }

    @Test
    void invalid_token_leaves_security_context_empty_and_continues_chain() throws Exception {
        when(req.getHeader("Authorization")).thenReturn("Bearer bad.token");
        when(verifier.verifyAccess("bad.token"))
            .thenThrow(new ApiException(ErrorCode.INVALID_TOKEN, "invalid"));

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
    }
}
