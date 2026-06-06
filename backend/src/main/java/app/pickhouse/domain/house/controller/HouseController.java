package app.pickhouse.domain.house.controller;

import app.pickhouse.domain.house.dto.request.CreateHouseRequest;
import app.pickhouse.domain.house.dto.response.HouseResponse;
import app.pickhouse.domain.house.dto.request.UpdateHouseRequest;
import app.pickhouse.domain.house.service.HouseService;
import app.pickhouse.domain.photo.service.PhotoService;
import app.pickhouse.domain.photo.dto.response.PhotoResponse;
import app.pickhouse.global.security.CurrentUserId;
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
    private final PhotoService photoService;

    @GetMapping
    public List<HouseResponse> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HouseResponse create(@CurrentUserId UUID userId, @Valid @RequestBody CreateHouseRequest req) {
        return service.create(userId, req);
    }

    @GetMapping("/{id}")
    public HouseResponse get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return service.get(userId, id);
    }

    @GetMapping("/{id}/photos")
    public List<PhotoResponse> photos(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return photoService.listForHouse(userId, id);
    }

    @PatchMapping("/{id}")
    public HouseResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                           @Valid @RequestBody UpdateHouseRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
