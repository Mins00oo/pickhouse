package app.pickhouse.domain.house.repository;

import app.pickhouse.domain.house.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HouseRepository extends JpaRepository<House, UUID> {
    List<House> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
    Optional<House> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
}
