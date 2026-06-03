package app.pickhouse.anchor;

import app.pickhouse.anchor.dto.AnchorPlaceDto;
import app.pickhouse.anchor.dto.CreateAnchorPlaceRequest;
import app.pickhouse.anchor.dto.UpdateAnchorPlaceRequest;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.anchor.AnchorPlace;
import app.pickhouse.domain.anchor.AnchorPlaceRepository;
import app.pickhouse.domain.anchor.AnchorType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnchorPlaceService {

    private final AnchorPlaceRepository anchors;

    @Transactional(readOnly = true)
    public List<AnchorPlaceDto> list(UUID userId) {
        return anchors.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
            .stream().map(AnchorPlaceDto::from).toList();
    }

    @Transactional
    public AnchorPlaceDto create(UUID userId, CreateAnchorPlaceRequest req) {
        Instant now = Instant.now();
        UUID id = req.id() != null ? req.id() : UUID.randomUUID();
        if (req.id() != null && anchors.existsById(req.id())) {
            throw new ApiException(ErrorCode.CONFLICT, "anchor place id already exists");
        }
        boolean isPrimary = Boolean.TRUE.equals(req.isPrimary());
        AnchorPlace a = AnchorPlace.builder()
            .id(id).userId(userId)
            .address(req.address() != null ? req.address().toEntity() : null)
            .anchorType(req.anchorType())
            .label(req.label())
            .transport(req.transport())
            .isPrimary(isPrimary)
            .createdAt(now).updatedAt(now)
            .build();
        anchors.save(a);
        if (isPrimary) {
            clearOtherPrimary(userId, a.getAnchorType(), a.getId(), now);
        }
        return AnchorPlaceDto.from(a);
    }

    @Transactional
    public AnchorPlaceDto update(UUID userId, UUID id, UpdateAnchorPlaceRequest req) {
        AnchorPlace a = findOwned(userId, id);
        Instant now = Instant.now();
        AnchorType newType = req.anchorType() != null ? req.anchorType() : a.getAnchorType();
        boolean isPrimary = req.isPrimary() != null ? req.isPrimary() : a.isPrimary();
        AnchorPlace updated = a.toBuilder()
            .address(req.address() != null ? req.address().toEntity() : a.getAddress())
            .anchorType(newType)
            .label(req.label() != null ? req.label() : a.getLabel())
            .transport(req.transport() != null ? req.transport() : a.getTransport())
            .isPrimary(isPrimary)
            .updatedAt(now)
            .build();
        anchors.save(updated);
        if (isPrimary) {
            clearOtherPrimary(userId, newType, id, now);
        }
        return AnchorPlaceDto.from(updated);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        AnchorPlace a = findOwned(userId, id);
        a.softDelete(Instant.now());
    }

    // isPrimary=true 저장 시 같은 user+anchorType 의 다른 레코드 primary 해제(타입당 주 통근지 1개 보장).
    private void clearOtherPrimary(UUID userId, AnchorType anchorType, UUID exceptId, Instant now) {
        for (AnchorPlace other : anchors.findByUserIdAndAnchorTypeAndIsPrimaryTrueAndDeletedAtIsNull(userId, anchorType)) {
            if (!other.getId().equals(exceptId)) {
                other.clearPrimary(now);
            }
        }
    }

    private AnchorPlace findOwned(UUID userId, UUID id) {
        return anchors.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "anchor place not found"));
    }
}
