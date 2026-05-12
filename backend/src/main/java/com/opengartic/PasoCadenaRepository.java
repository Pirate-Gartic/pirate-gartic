package com.opengartic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasoCadenaRepository extends JpaRepository<PasoCadena, UUID> {

    // Contar cuántos pasos tiene una cadena (para determinar la ronda actual)
    int countByIdCadena(UUID idCadena);

    // Verificar si un jugador ya envió su paso para una ronda específica de una cadena
    boolean existsByIdCadenaAndIdJugadorAndOrdenRonda(UUID idCadena, UUID idJugador, Short ordenRonda);

    // Obtener el paso anterior de una cadena (para mostrarlo al siguiente jugador)
    Optional<PasoCadena> findByIdCadenaAndOrdenRonda(UUID idCadena, Short ordenRonda);

    // Todos los pasos de una cadena ordenados (para resultados)
    List<PasoCadena> findByIdCadenaOrderByOrdenRonda(UUID idCadena);

    // Todos los pasos de un jugador (para estadísticas)
    List<PasoCadena> findByIdJugador(UUID idJugador);
}