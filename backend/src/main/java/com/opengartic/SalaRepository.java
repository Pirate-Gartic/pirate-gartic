package com.opengartic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, UUID> {
    Optional<Sala> findByCodigoAcceso(String codigoAcceso);
    boolean existsByCodigoAcceso(String codigoAcceso);
}