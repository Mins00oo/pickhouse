package app.homes.auth.oauth;

/**
 * id_token 검증 결과(공통). nickname은 없을 수 있다(애플은 클라가 보낸 displayName, 카카오는 토큰 claim).
 */
public record VerifiedOAuthUser(
        OAuthProvider provider,
        String providerUserId,
        String nickname
) {
}
