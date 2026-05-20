package app.pickhouse.house;

import app.pickhouse.house.dto.CreateHouseRequest;
import app.pickhouse.house.dto.HouseDto;
import app.pickhouse.house.dto.PromoteToResidenceRequest;
import app.pickhouse.house.dto.UpdateHouseRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/houses")
@RequiredArgsConstructor
public class HouseController {

    private final HouseService service;

    @GetMapping
    public List<HouseDto> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HouseDto create(@CurrentUserId UUID userId, @Valid @RequestBody CreateHouseRequest req) {
        return service.create(userId, req);
    }

    @GetMapping("/{id}")
    public HouseDto get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return service.get(userId, id);
    }

    @PatchMapping("/{id}")
    public HouseDto update(@CurrentUserId UUID userId, @PathVariable UUID id,
                           @Valid @RequestBody UpdateHouseRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/promote-to-residence")
    @ResponseStatus(HttpStatus.CREATED)
    public ResidenceDto promote(@CurrentUserId UUID userId, @PathVariable UUID id,
                                @Valid @RequestBody PromoteToResidenceRequest req) {
        return service.promoteToResidence(userId, id, req);
    }
}
