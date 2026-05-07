package com.opengartic;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "jugadores")
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_jugador")
    private UUID idJugador;

    // FK a salas — mapeado como UUID simple para evitar complejidad de @ManyToOne
    @Column(name = "id_sala", nullable = false)
    private UUID idSala;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Column(name = "es_host")
    private Boolean esHost = false;

    @Column(name = "socket_id")
    private String socketId;

    // Guarda la ruta relativa completa al avatar, ej: "Imagenes Chachara/Ideas de Logos/avatar_01.png"
    @Column(name = "avatar_url")
    private String avatarUrl;

    // FK a cuentas — null para jugadores invitados
    @Column(name = "id_cuenta")
    private UUID idCuenta;

    public Jugador() {}

    // Getters
    public UUID getIdJugador()  { return idJugador; }
    public UUID getIdSala()     { return idSala; }
    public String getNickname() { return nickname; }
    public Boolean getEsHost()  { return esHost; }
    public String getSocketId() { return socketId; }
    public String getAvatarUrl(){ return avatarUrl; }
    public UUID getIdCuenta()   { return idCuenta; }

    // Setters
    public void setIdSala(UUID idSala)       { this.idSala = idSala; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setEsHost(Boolean esHost)    { this.esHost = esHost; }
    public void setSocketId(String socketId) { this.socketId = socketId; }
    public void setAvatarUrl(String avatarUrl){ this.avatarUrl = avatarUrl; }
    public void setIdCuenta(UUID idCuenta)   { this.idCuenta = idCuenta; }
}