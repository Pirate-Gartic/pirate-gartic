package com.opengartic;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity
@Table(name = "jugadores")
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_jugador", length = 36)
    private UUID idJugador;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_sala", nullable = false, length = 36)
    private UUID idSala;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Column(name = "es_host")
    private Boolean esHost = false;

    @Column(name = "avatar_url")
    private String avatarUrl;

    public Jugador() {}

    public UUID getIdJugador()  { return idJugador; }
    public UUID getIdSala()     { return idSala; }
    public String getNickname() { return nickname; }
    public Boolean getEsHost()  { return esHost; }
    public String getAvatarUrl(){ return avatarUrl; }

    public void setIdSala(UUID idSala)       { this.idSala = idSala; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setEsHost(Boolean esHost)    { this.esHost = esHost; }
    public void setAvatarUrl(String avatarUrl){ this.avatarUrl = avatarUrl; }
}