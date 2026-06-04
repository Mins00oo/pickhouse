package app.pickhouse.domain.anchor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnchorPlaceRepository extends JpaRepository<AnchorPlace, UUID> {
    List<AnchorPlace> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    Optional<AnchorPlace> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<AnchorPlace> findByUserIdAndAnchorTypeAndIsPrimaryTrueAndDeletedAtIsNull(UUID userId, AnchorType anchorType);
}
