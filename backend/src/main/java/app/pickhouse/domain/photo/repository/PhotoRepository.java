package app.pickhouse.domain.photo.repository;

import app.pickhouse.domain.photo.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {
    List<Photo> findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID houseId);
    Optional<Photo> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
    List<Photo> findByIdInAndUserIdAndDeletedAtIsNull(Collection<UUID> ids, UUID userId);
}
