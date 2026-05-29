package com.opengartic;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity
@Table(name = "cadenas")
public class Cadena {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_cadena", length = 36)
    private UUID idCadena;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_jugador_origen", length = 36)
    private UUID idJugadorOrigen;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_sala", nullable = false, length = 36)
    private UUID idSala;

    @Column(name = "ronda_actual")
    private Short rondaActual = 1;

    public Cadena() {}

    public UUID getIdCadena()          { return idCadena; }
    public UUID getIdJugadorOrigen()   { return idJugadorOrigen; }
    public UUID getIdSala()            { return idSala; }
    public Short getRondaActual()      { return rondaActual; }

    public void setIdJugadorOrigen(UUID idJugadorOrigen) { this.idJugadorOrigen = idJugadorOrigen; }
    public void setIdSala(UUID idSala)                   { this.idSala = idSala; }
    public void setRondaActual(Short rondaActual)        { this.rondaActual = rondaActual; }
}