package app.pickhouse.domain.auth.repository;

import app.pickhouse.domain.auth.entity.OAuthIdentity;
import app.pickhouse.domain.auth.entity.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthIdentityRepository extends JpaRepository<OAuthIdentity, UUID> {
    Optional<OAuthIdentity> findByProviderAndProviderId(OAuthProvider provider, String providerId);
}
