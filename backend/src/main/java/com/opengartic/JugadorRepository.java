package com.opengartic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, UUID> {
    List<Jugador> findByIdSala(UUID idSala);
    boolean existsByIdSalaAndNickname(UUID idSala, String nickname);
    long countByIdSala(UUID idSala);
}