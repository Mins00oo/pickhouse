package app.pickhouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan("app.pickhouse")
public class PickHouseApplication {
    public static void main(String[] args) {
        SpringApplication.run(PickHouseApplication.class, args);
    }
}
