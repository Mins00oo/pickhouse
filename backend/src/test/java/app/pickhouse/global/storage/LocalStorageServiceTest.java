package app.pickhouse.global.storage;

import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalStorageServiceTest {

    @TempDir Path tempDir;

    private LocalStorageService service(long maxBytes) {
        StorageProperties props = new StorageProperties(
            tempDir.toString(),
            "https://api.pickhouse.app",
            maxBytes
        );
        return new LocalStorageService(props);
    }

    @Test
    void save_writes_file_to_disk_with_photoId_as_filename() {
        UUID photoId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        byte[] body = "fake-jpeg-bytes".getBytes();
        LocalStorageService.Stored result = service(10_000)
            .save(new ByteArrayInputStream(body), body.length, "image/jpeg", photoId);

        Path written = tempDir.resolve(photoId + ".jpg");
        assertThat(written).exists();
        assertThat(written).hasBinaryContent(body);
        assertThat(result.objectKey()).isEqualTo(photoId + ".jpg");
        assertThat(result.remoteUrl()).isEqualTo("https://api.pickhouse.app/files/" + photoId + ".jpg");
    }

    @Test
    void save_uses_png_extension_for_image_png() {
        UUID photoId = UUID.randomUUID();
        LocalStorageService.Stored r = service(10_000)
            .save(new ByteArrayInputStream(new byte[]{1, 2, 3}), 3, "image/png", photoId);
        assertThat(r.objectKey()).endsWith(".png");
    }

    @Test
    void save_uses_webp_extension_for_image_webp() {
        UUID photoId = UUID.randomUUID();
        LocalStorageService.Stored r = service(10_000)
            .save(new ByteArrayInputStream(new byte[]{1, 2}), 2, "image/webp", photoId);
        assertThat(r.objectKey()).endsWith(".webp");
    }

    @Test
    void save_rejects_unsupported_mime_type() {
        assertThatThrownBy(() -> service(10_000)
            .save(new ByteArrayInputStream(new byte[]{1}), 1, "image/gif", UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.FILE_UNSUPPORTED_MIME_TYPE);
    }

    @Test
    void save_rejects_null_mime_type() {
        assertThatThrownBy(() -> service(10_000)
            .save(new ByteArrayInputStream(new byte[]{1}), 1, null, UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.FILE_MIME_TYPE_REQUIRED);
    }

    @Test
    void save_rejects_oversized_file() {
        assertThatThrownBy(() -> service(100)
            .save(new ByteArrayInputStream(new byte[200]), 200, "image/jpeg", UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.FILE_SIZE_OUT_OF_RANGE);
    }

    @Test
    void save_rejects_zero_size_file() {
        assertThatThrownBy(() -> service(10_000)
            .save(new ByteArrayInputStream(new byte[0]), 0, "image/jpeg", UUID.randomUUID()))
            .isInstanceOf(BusinessException.class)
            .extracting(e -> ((BusinessException) e).getCode())
            .isEqualTo(ErrorCode.FILE_SIZE_OUT_OF_RANGE);
    }

    @Test
    void save_creates_parent_directory_if_missing() throws Exception {
        Path nested = tempDir.resolve("does/not/exist/yet");
        StorageProperties props = new StorageProperties(
            nested.toString(), "https://api.pickhouse.app", 10_000);
        LocalStorageService svc = new LocalStorageService(props);
        UUID photoId = UUID.randomUUID();

        svc.save(new ByteArrayInputStream(new byte[]{9}), 1, "image/jpeg", photoId);

        assertThat(Files.exists(nested.resolve(photoId + ".jpg"))).isTrue();
    }

    @Test
    void save_lowercase_normalizes_mime_type() {
        UUID photoId = UUID.randomUUID();
        LocalStorageService.Stored r = service(10_000)
            .save(new ByteArrayInputStream(new byte[]{1}), 1, "IMAGE/JPEG", photoId);
        assertThat(r.objectKey()).endsWith(".jpg");
    }
}
