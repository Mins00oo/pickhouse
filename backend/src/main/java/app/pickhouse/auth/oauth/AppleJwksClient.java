package app.pickhouse.auth.oauth;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class AppleJwksClient {

    private final OAuthProperties props;
    private volatile JwkProvider provider;

    public Jwk get(String kid) throws Exception {
        return cached().get(kid);
    }

    private JwkProvider cached() throws Exception {
        JwkProvider p = provider;
        if (p == null) {
            synchronized (this) {
                p = provider;
                if (p == null) {
                    p = new JwkProviderBuilder(new URL(props.apple().jwksUrl()))
                        .cached(10, 24, TimeUnit.HOURS)
                        .rateLimited(10, 1, TimeUnit.MINUTES)
                        .build();
                    provider = p;
                }
            }
        }
        return p;
    }
}
