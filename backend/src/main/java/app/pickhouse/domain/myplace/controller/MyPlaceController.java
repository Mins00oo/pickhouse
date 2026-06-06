package app.pickhouse.domain.myplace.controller;

import app.pickhouse.domain.myplace.dto.response.MyPlaceResponse;
import app.pickhouse.domain.myplace.dto.request.CreateMyPlaceRequest;
import app.pickhouse.domain.myplace.dto.request.UpdateMyPlaceRequest;
import app.pickhouse.domain.myplace.service.MyPlaceService;
import app.pickhouse.global.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/my-places")
@RequiredArgsConstructor
public class MyPlaceController {

    private final MyPlaceService service;

    @GetMapping
    public List<MyPlaceResponse> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MyPlaceResponse create(@CurrentUserId UUID userId, @Valid @RequestBody CreateMyPlaceRequest req) {
        return service.create(userId, req);
    }

    @PatchMapping("/{id}")
    public MyPlaceResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                 @Valid @RequestBody UpdateMyPlaceRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
