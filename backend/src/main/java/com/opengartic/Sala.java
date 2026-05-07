package com.opengartic;

import jakarta.persistence.*;
import java.util.UUID;
import java.sql.Timestamp;

@Entity
@Table(name = "salas")
public class Sala {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_sala")
    private UUID idSala;

    @Column(name = "codigo_acceso", unique = true, nullable = false, length = 6)
    private String codigoAcceso;

    // Se guarda como String para evitar conflictos con el tipo enum de PostgreSQL.
    // El valor por defecto en BD es 'ESPERANDO', aquí lo replicamos.
    @Column(name = "estado")
    private String estado = "ESPERANDO";

    @Column(name = "max_jugadores", nullable = false)
    private Short maxJugadores = 8;

    @Column(name = "tiempo_turno")
    private Integer tiempoTurno = 60;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private Timestamp creadoEn;

    public Sala() {}

    // Getters
    public UUID getIdSala()         { return idSala; }
    public String getCodigoAcceso() { return codigoAcceso; }
    public String getEstado()       { return estado; }
    public Short getMaxJugadores()  { return maxJugadores; }
    public Integer getTiempoTurno() { return tiempoTurno; }
    public Timestamp getCreadoEn()  { return creadoEn; }

    // Setters
    public void setCodigoAcceso(String codigoAcceso) { this.codigoAcceso = codigoAcceso; }
    public void setEstado(String estado)             { this.estado = estado; }
    public void setMaxJugadores(Short maxJugadores)  { this.maxJugadores = maxJugadores; }
    public void setTiempoTurno(Integer tiempoTurno)  { this.tiempoTurno = tiempoTurno; }
}