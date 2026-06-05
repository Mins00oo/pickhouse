package app.pickhouse.domain.auth.oauth;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class KakaoApiClient {

    private final OAuthProperties props;
    private volatile JwkProvider provider;

    public Jwk getKey(String kid) throws Exception {
        JwkProvider p = provider;
        if (p == null) {
            synchronized (this) {
                p = provider;
                if (p == null) {
                    p = new JwkProviderBuilder(new URL(props.kakao().jwksUrl()))
                        .cached(10, 24, TimeUnit.HOURS)
                        .rateLimited(10, 1, TimeUnit.MINUTES)
                        .build();
                    provider = p;
                }
            }
        }
        return p.get(kid);
    }
}
