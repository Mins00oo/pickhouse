package app.pickhouse.domain.myplace.service;

import app.pickhouse.domain.myplace.dto.request.CreateMyPlaceRequest;
import app.pickhouse.domain.myplace.dto.request.UpdateMyPlaceRequest;
import app.pickhouse.domain.myplace.dto.response.MyPlaceResponse;
import app.pickhouse.domain.myplace.entity.MyPlace;
import app.pickhouse.domain.myplace.entity.PlaceType;
import app.pickhouse.domain.myplace.repository.MyPlaceRepository;
import app.pickhouse.global.exception.BusinessException;
import app.pickhouse.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MyPlaceService {

    private final MyPlaceRepository myPlaces;

    @Transactional(readOnly = true)
    public List<MyPlaceResponse> list(UUID userId) {
        return myPlaces.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
            .stream().map(MyPlaceResponse::from).toList();
    }

    @Transactional
    public MyPlaceResponse create(UUID userId, CreateMyPlaceRequest req) {
        Instant now = Instant.now();
        UUID id = req.id() != null ? req.id() : UUID.randomUUID();
        if (req.id() != null && myPlaces.existsById(req.id())) {
            throw new BusinessException(ErrorCode.MY_PLACE_ID_ALREADY_EXISTS);
        }
        boolean isPrimary = Boolean.TRUE.equals(req.isPrimary());
        MyPlace myPlace = MyPlace.builder()
            .id(id).userId(userId)
            .address(req.address() != null ? req.address().toEntity() : null)
            .placeType(req.placeType())
            .label(req.label())
            .transport(req.transport())
            .isPrimary(isPrimary)
            .createdAt(now).updatedAt(now)
            .build();
        myPlaces.save(myPlace);
        if (isPrimary) {
            clearOtherPrimary(userId, myPlace.getPlaceType(), myPlace.getId(), now);
        }
        return MyPlaceResponse.from(myPlace);
    }

    @Transactional
    public MyPlaceResponse update(UUID userId, UUID id, UpdateMyPlaceRequest req) {
        MyPlace myPlace = findOwned(userId, id);
        Instant now = Instant.now();
        PlaceType newType = req.placeType() != null ? req.placeType() : myPlace.getPlaceType();
        boolean isPrimary = req.isPrimary() != null ? req.isPrimary() : myPlace.isPrimary();
        MyPlace updated = myPlace.toBuilder()
            .address(req.address() != null ? req.address().toEntity() : myPlace.getAddress())
            .placeType(newType)
            .label(req.label() != null ? req.label() : myPlace.getLabel())
            .transport(req.transport() != null ? req.transport() : myPlace.getTransport())
            .isPrimary(isPrimary)
            .updatedAt(now)
            .build();
        myPlaces.save(updated);
        if (isPrimary) {
            clearOtherPrimary(userId, newType, id, now);
        }
        return MyPlaceResponse.from(updated);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        MyPlace myPlace = findOwned(userId, id);
        myPlace.softDelete(Instant.now());
    }

    private void clearOtherPrimary(UUID userId, PlaceType placeType, UUID exceptId, Instant now) {
        for (MyPlace other : myPlaces.findByUserIdAndPlaceTypeAndIsPrimaryTrueAndDeletedAtIsNull(userId, placeType)) {
            if (!other.getId().equals(exceptId)) {
                other.clearPrimary(now);
            }
        }
    }

    private MyPlace findOwned(UUID userId, UUID id) {
        return myPlaces.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.MY_PLACE_NOT_FOUND));
    }
}
