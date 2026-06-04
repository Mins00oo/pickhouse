package app.pickhouse.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class JsonMapConverter {

    private final ObjectMapper om;

    public String toJson(Map<String, Integer> map) {
        try {
            return map == null ? null : om.writeValueAsString(map);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    public Map<String, Integer> fromJson(String json) {
        try {
            return json == null ? null : om.readValue(json, new TypeReference<Map<String, Integer>>(){});
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
