package app.homes.auth.nickname;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class DefaultNicknameGenerator {

    private static final int NICKNAME_RANGE = 10_000;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        return "홈즈_%04d".formatted(random.nextInt(NICKNAME_RANGE));
    }
}
