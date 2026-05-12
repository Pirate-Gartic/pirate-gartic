package com.opengartic;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "cadenas")
public class Cadena {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_cadena")
    private UUID idCadena;

    // Nota: en SQL tiene NOT NULL + ON DELETE SET NULL (contradicción).
    // En la práctica, el jugador origen no se elimina de forma independiente
    // durante el juego; la sala completa se borra si el host se va.
    @Column(name = "id_jugador_origen")
    private UUID idJugadorOrigen;

    @Column(name = "id_sala", nullable = false)
    private UUID idSala;

    @Column(name = "ronda_actual")
    private Short rondaActual = 1;

    public Cadena() {}

    // Getters
    public UUID getIdCadena()          { return idCadena; }
    public UUID getIdJugadorOrigen()   { return idJugadorOrigen; }
    public UUID getIdSala()            { return idSala; }
    public Short getRondaActual()      { return rondaActual; }

    // Setters
    public void setIdJugadorOrigen(UUID idJugadorOrigen) { this.idJugadorOrigen = idJugadorOrigen; }
    public void setIdSala(UUID idSala)                   { this.idSala = idSala; }
    public void setRondaActual(Short rondaActual)        { this.rondaActual = rondaActual; }
}