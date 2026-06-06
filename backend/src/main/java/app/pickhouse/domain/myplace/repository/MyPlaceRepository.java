package app.pickhouse.domain.myplace.repository;

import app.pickhouse.domain.myplace.entity.MyPlace;
import app.pickhouse.domain.myplace.entity.PlaceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MyPlaceRepository extends JpaRepository<MyPlace, UUID> {
    List<MyPlace> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);

    Optional<MyPlace> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<MyPlace> findByUserIdAndPlaceTypeAndIsPrimaryTrueAndDeletedAtIsNull(UUID userId, PlaceType placeType);
}
