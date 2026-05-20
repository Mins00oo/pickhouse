package app.pickhouse.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JsonListConverter {

    private final ObjectMapper om;

    public String toJson(List<String> list) {
        try {
            return list == null ? null : om.writeValueAsString(list);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    public List<String> fromJson(String json) {
        try {
            return json == null ? null : om.readValue(json, new TypeReference<List<String>>(){});
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
