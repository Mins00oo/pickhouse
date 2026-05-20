package app.pickhouse.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class StorageWebConfig implements WebMvcConfigurer {

    private final StorageProperties props;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(props.path()).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/files/**").addResourceLocations(location);
    }
}
