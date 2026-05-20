package app.pickhouse.domain.photo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {
    List<Photo> findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID houseId);
    List<Photo> findByResidenceIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID residenceId);
    Optional<Photo> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
}
