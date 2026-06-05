package app.pickhouse.global.json;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JsonListConverterTest {

    private JsonListConverter conv;

    @BeforeEach
    void setUp() {
        conv = new JsonListConverter(new ObjectMapper());
    }

    @Test
    void toJson_returns_null_for_null_input() {
        assertThat(conv.toJson(null)).isNull();
    }

    @Test
    void fromJson_returns_null_for_null_input() {
        assertThat(conv.fromJson(null)).isNull();
    }

    @Test
    void roundtrip_preserves_list() {
        List<String> input = List.of("냉장고", "세탁기", "에어컨");
        String json = conv.toJson(input);
        assertThat(json).contains("냉장고");
        List<String> roundtrip = conv.fromJson(json);
        assertThat(roundtrip).isEqualTo(input);
    }

    @Test
    void toJson_empty_list_returns_empty_array_string() {
        assertThat(conv.toJson(List.of())).isEqualTo("[]");
    }
}
