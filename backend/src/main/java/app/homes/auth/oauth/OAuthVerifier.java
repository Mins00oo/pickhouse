package app.homes.auth.oauth;

/**
 * provider별 id_token 검증기. 구현체는 provider 하나를 담당한다.
 */
public interface OAuthVerifier {

    boolean supports(OAuthProvider provider);

    /** displayName은 애플 이름 fallback(카카오는 무시) */
    VerifiedOAuthUser verify(String idToken, String displayName);
}
