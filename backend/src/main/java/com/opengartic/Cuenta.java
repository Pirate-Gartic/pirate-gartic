package com.opengartic;

import jakarta.persistence.*;
import java.util.UUID;
import java.sql.Timestamp;

@Entity
@Table(name = "cuentas")
public class Cuenta {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id_cuenta")
    private UUID idCuenta;

    @Column(name = "correo", unique = true, nullable = false)
    private String correo;

    @Column(name = "contrasena", nullable = false)
    private String contrasena;

    @Column(name = "nombre_usuario", unique = true, nullable = false)
    private String nombreUsuario;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private Timestamp creadoEn;

    // La columna en PostgreSQL se llama "avatar" (ver DDL de cuentas)
    @Column(name = "avatar")
    private String avatar;

    public Cuenta() {}

    public Cuenta(String correo, String contrasena, String nombreUsuario) {
        this.correo = correo;
        this.contrasena = contrasena;
        this.nombreUsuario = nombreUsuario;
    }

    // Getters
    public UUID getIdCuenta()       { return idCuenta; }
    public String getCorreo()        { return correo; }
    public String getContrasena()    { return contrasena; }
    public String getNombreUsuario() { return nombreUsuario; }
    public Timestamp getCreadoEn()   { return creadoEn; }
    public String getAvatar()        { return avatar; }

    // Setters
    public void setCorreo(String correo)               { this.correo = correo; }
    public void setContrasena(String contrasena)       { this.contrasena = contrasena; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
    public void setAvatar(String avatar)               { this.avatar = avatar; }
}