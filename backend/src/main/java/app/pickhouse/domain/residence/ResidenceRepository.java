package app.pickhouse.domain.residence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResidenceRepository extends JpaRepository<Residence, UUID> {
    List<Residence> findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(UUID userId);
    Optional<Residence> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
    Optional<Residence> findByUserIdAndIsCurrentTrueAndDeletedAtIsNull(UUID userId);
}
