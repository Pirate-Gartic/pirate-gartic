package com.opengartic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface CadenaRepository extends JpaRepository<Cadena, UUID> {
    List<Cadena> findByIdSala(UUID idSala);
    long countByIdSala(UUID idSala);

    // NUEVO: Borra todas las cadenas de una sala (detona el borrado en cascada en pasos_cadena)
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM cadenas WHERE id_sala = :idSala", nativeQuery = true)
    void vaciarCadenasPorSala(@Param("idSala") UUID idSala);
}