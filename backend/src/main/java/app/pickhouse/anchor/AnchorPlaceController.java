package app.pickhouse.anchor;

import app.pickhouse.anchor.dto.AnchorPlaceDto;
import app.pickhouse.anchor.dto.CreateAnchorPlaceRequest;
import app.pickhouse.anchor.dto.UpdateAnchorPlaceRequest;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/anchor-places")
@RequiredArgsConstructor
public class AnchorPlaceController {

    private final AnchorPlaceService service;

    @GetMapping
    public List<AnchorPlaceDto> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnchorPlaceDto create(@CurrentUserId UUID userId, @Valid @RequestBody CreateAnchorPlaceRequest req) {
        return service.create(userId, req);
    }

    @PatchMapping("/{id}")
    public AnchorPlaceDto update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                 @Valid @RequestBody UpdateAnchorPlaceRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
