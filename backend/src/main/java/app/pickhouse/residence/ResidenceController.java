package app.pickhouse.residence;

import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.residence.dto.UpdateResidenceRequest;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/residences")
@RequiredArgsConstructor
public class ResidenceController {

    private final ResidenceService service;

    @GetMapping
    public List<ResidenceDto> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @GetMapping("/{id}")
    public ResidenceDto get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return service.get(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResidenceDto create(@CurrentUserId UUID userId, @Valid @RequestBody CreateResidenceRequest req) {
        return service.create(userId, req);
    }

    @PatchMapping("/{id}")
    public ResidenceDto update(@CurrentUserId UUID userId, @PathVariable UUID id,
                               @Valid @RequestBody UpdateResidenceRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
