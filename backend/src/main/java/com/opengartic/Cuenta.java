package com.opengartic;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;
import java.sql.Timestamp;

@Entity
@Table(name = "cuentas")
public class Cuenta {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "id_cuenta", length = 36)
    private UUID idCuenta;

    @Column(name = "correo", unique = true, nullable = false)
    private String correo;

    @Column(name = "contrasena", nullable = false)
    private String contrasena;

    @Column(name = "nombre_usuario", unique = true, nullable = false)
    private String nombreUsuario;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private Timestamp creadoEn;

    @Column(name = "avatar")
    private String avatar;

    public Cuenta() {}

    public Cuenta(String correo, String contrasena, String nombreUsuario) {
        this.correo = correo;
        this.contrasena = contrasena;
        this.nombreUsuario = nombreUsuario;
    }

    public UUID getIdCuenta()       { return idCuenta; }
    public String getCorreo()        { return correo; }
    public String getContrasena()    { return contrasena; }
    public String getNombreUsuario() { return nombreUsuario; }
    public Timestamp getCreadoEn()   { return creadoEn; }
    public String getAvatar()        { return avatar; }

    public void setCorreo(String correo)               { this.correo = correo; }
    public void setContrasena(String contrasena)       { this.contrasena = contrasena; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
    public void setAvatar(String avatar)               { this.avatar = avatar; }
}