package app.homes;

import app.homes.auth.oauth.config.OAuthProperties;
import app.homes.global.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@EnableConfigurationProperties({JwtProperties.class, OAuthProperties.class})
@SpringBootApplication
public class HomesApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomesApplication.class, args);
    }
}
