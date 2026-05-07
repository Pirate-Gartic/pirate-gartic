package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/cuentas")
@CrossOrigin(origins = "*")
public class CuentaController {

    @Autowired
    private CuentaRepository cuentaRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // ── Utilidad: extrae solo el nombre de archivo de cualquier ruta ──
    // Ejemplo: "Imagenes Chachara/Ideas de Logos/Logo Chachara.png" → "Logo Chachara.png"
    // Ejemplo: "/imagenes/avatar_01.png" → "avatar_01.png"
    // Ejemplo: "avatar_01.png" → "avatar_01.png"  (ya está limpio)
    private String normalizarAvatar(String rutaAvatar) {
        if (rutaAvatar == null || rutaAvatar.isBlank()) {
            return "avatar_01.png";
        }
        // Tomamos solo el último segmento después de / o \
        String[] partesSlash     = rutaAvatar.replace("\\", "/").split("/");
        String nombreArchivo = partesSlash[partesSlash.length - 1].trim();
        return nombreArchivo.isBlank() ? "avatar_01.png" : nombreArchivo;
    }

    @PostMapping("/registro")
    public ResponseEntity<String> registrarCuenta(@RequestBody Cuenta nuevaCuenta) {
        if (cuentaRepository.findByCorreo(nuevaCuenta.getCorreo()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: El correo ya está registrado.");
        }
        if (cuentaRepository.findByNombreUsuario(nuevaCuenta.getNombreUsuario()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: El nombre de usuario ya está en uso.");
        }

        // Encriptación de contraseña
        String passEncriptada = passwordEncoder.encode(nuevaCuenta.getContrasena());
        nuevaCuenta.setContrasena(passEncriptada);

        // FIX: normalizar el avatar que manda el frontend (puede venir como ruta relativa local)
        // En BD guardamos solo el nombre del archivo, ej: "Logo Chachara.png" o "avatar_01.png"
        String avatarNormalizado = normalizarAvatar(nuevaCuenta.getAvatar());
        nuevaCuenta.setAvatar(avatarNormalizado);

        cuentaRepository.save(nuevaCuenta);
        return ResponseEntity.ok("Cuenta creada exitosamente.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody Cuenta credenciales) {
        Optional<Cuenta> cuentaOpt = cuentaRepository.findByCorreo(credenciales.getCorreo());

        if (cuentaOpt.isPresent()) {
            Cuenta cuenta = cuentaOpt.get();
            if (passwordEncoder.matches(credenciales.getContrasena(), cuenta.getContrasena())) {

                // FIX: construir la URL del avatar de forma consistente.
                // En BD tenemos solo el nombre del archivo (ej: "Logo Chachara.png")
                // El frontend lo busca en la carpeta "Imagenes Chachara/Ideas de Logos/"
                String avatarGuardado = cuenta.getAvatar();
                String avatarNombre = (avatarGuardado != null && !avatarGuardado.isBlank())
                        ? avatarGuardado
                        : "avatar_01.png";

                Map<String, String> respuesta = new HashMap<>();
                respuesta.put("mensaje",       "¡Bienvenido, " + cuenta.getNombreUsuario() + "!");
                respuesta.put("nombreUsuario", cuenta.getNombreUsuario());
                respuesta.put("avatarNombre",  avatarNombre);  // solo el nombre del archivo

                return ResponseEntity.ok(respuesta);
            }
        }

        return ResponseEntity.status(401).body("Error: Correo o contraseña incorrectos.");
    }
}