package app.pickhouse.storage;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocalStorageService {

    private static final Map<String, String> MIME_TO_EXT = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png",
        "image/webp", "webp"
    );

    private final StorageProperties props;

    public Stored save(InputStream content, long size, String mimeType, UUID photoId) {
        if (mimeType == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "mime type required");
        }
        String ext = MIME_TO_EXT.get(mimeType.toLowerCase());
        if (ext == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST,
                "unsupported mime type: " + mimeType);
        }
        if (size <= 0 || size > props.maxFileSizeBytes()) {
            throw new ApiException(ErrorCode.BAD_REQUEST,
                "file size out of range: " + size);
        }

        String objectKey = photoId + "." + ext;
        Path target = Paths.get(props.path(), objectKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR,
                "failed to store file: " + e.getMessage());
        }

        String remoteUrl = props.publicBaseUrl() + "/files/" + objectKey;
        return new Stored(objectKey, remoteUrl);
    }

    public record Stored(String objectKey, String remoteUrl) {}
}
