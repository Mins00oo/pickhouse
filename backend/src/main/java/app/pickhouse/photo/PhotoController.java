package app.pickhouse.photo;

import app.pickhouse.photo.dto.PhotoDto;
import app.pickhouse.security.CurrentUserId;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService service;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoDto upload(
        @CurrentUserId UUID userId,
        @RequestParam(value = "id", required = false) UUID id,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "houseId", required = false) UUID houseId,
        @RequestParam(value = "residenceId", required = false) UUID residenceId,
        @RequestParam(value = "takenAt", required = false) Instant takenAt
    ) {
        return service.upload(userId, id, file, houseId, residenceId, takenAt);
    }
}
