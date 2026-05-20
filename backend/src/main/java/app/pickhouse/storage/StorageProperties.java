package app.pickhouse.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.storage")
public record StorageProperties(
    String path,
    String publicBaseUrl,
    long maxFileSizeBytes
) {}
