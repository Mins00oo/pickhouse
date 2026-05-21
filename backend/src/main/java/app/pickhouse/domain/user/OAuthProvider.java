package app.pickhouse.domain.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OAuthProvider {
    APPLE,
    KAKAO;

    @JsonCreator
    public static OAuthProvider fromJson(String value) {
        if (value == null) return null;
        return OAuthProvider.valueOf(value.trim().toUpperCase());
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }
}
