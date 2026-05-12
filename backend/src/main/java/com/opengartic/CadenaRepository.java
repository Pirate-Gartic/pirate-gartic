package com.opengartic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CadenaRepository extends JpaRepository<Cadena, UUID> {
    List<Cadena> findByIdSala(UUID idSala);
    long countByIdSala(UUID idSala);
}