package com.opengartic;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pasos_cadena")
public class PasoCadena {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_paso")
    private UUID idPaso;

    @Column(name = "id_cadena", nullable = false)
    private UUID idCadena;

    @Column(name = "id_jugador", nullable = false)
    private UUID idJugador;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 50)
    private TipoPaso tipo;

    // Para TEXTO: el texto escrito por el jugador
    // Para DIBUJO: la clave DynamoDB → formato "{idSala}/{idJugador}_{ordenRonda}"
    @Column(name = "contenido", nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(name = "orden_ronda", nullable = false)
    private Short ordenRonda;

    public PasoCadena() {}

    // Getters
    public UUID getIdPaso()       { return idPaso; }
    public UUID getIdCadena()     { return idCadena; }
    public UUID getIdJugador()    { return idJugador; }
    public TipoPaso getTipo()     { return tipo; }
    public String getContenido()  { return contenido; }
    public Short getOrdenRonda()  { return ordenRonda; }

    // Setters
    public void setIdCadena(UUID idCadena)      { this.idCadena = idCadena; }
    public void setIdJugador(UUID idJugador)    { this.idJugador = idJugador; }
    public void setTipo(TipoPaso tipo)          { this.tipo = tipo; }
    public void setContenido(String contenido)  { this.contenido = contenido; }
    public void setOrdenRonda(Short ordenRonda) { this.ordenRonda = ordenRonda; }
}