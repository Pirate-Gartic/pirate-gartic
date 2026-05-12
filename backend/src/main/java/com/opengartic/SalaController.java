package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SalaController {

    @Autowired
    private SalaRepository salaRepo;

    @Autowired
    private JugadorRepository jugadorRepo;

    @Autowired
    private CadenaRepository cadenaRepo; // INYECTADO PARA REINICIAR PARTIDAS

    // ── Utilidad: código de 6 caracteres único ──
    private String generarCodigoUnico() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O, 0, I, 1 para evitar confusiones
        Random rand = new Random();
        String codigo;
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6; i++) sb.append(chars.charAt(rand.nextInt(chars.length())));
            codigo = sb.toString();
        } while (salaRepo.existsByCodigoAcceso(codigo));
        return codigo;
    }

    // ── Utilidad: construir el mapa de datos de un jugador para la respuesta JSON ──
    private Map<String, Object> jugadorToMap(Jugador j) {
        Map<String, Object> map = new HashMap<>();
        map.put("idJugador", j.getIdJugador().toString());
        map.put("nickname",  j.getNickname());
        map.put("avatarUrl", j.getAvatarUrl() != null ? j.getAvatarUrl() : "");
        map.put("esHost",    j.getEsHost());
        return map;
    }

    // ────────────────────────────────────────────────────────
    //  POST /api/salas/crear
    // ────────────────────────────────────────────────────────
    @PostMapping("/salas/crear")
    public ResponseEntity<?> crearSala(@RequestBody Map<String, String> body) {
        String nickname  = body.get("nickname");
        String avatarUrl = body.get("avatarUrl");
        String idCuentaStr = body.get("idCuenta");

        if (nickname == null || nickname.isBlank())
            return ResponseEntity.badRequest().body("El apodo es obligatorio.");

        // Crear la sala
        Sala sala = new Sala();
        sala.setCodigoAcceso(generarCodigoUnico());
        sala = salaRepo.save(sala);

        // Crear al jugador host
        Jugador jugador = new Jugador();
        jugador.setIdSala(sala.getIdSala());
        jugador.setNickname(nickname.trim());
        jugador.setAvatarUrl(avatarUrl);
        jugador.setEsHost(true);
        if (idCuentaStr != null && !idCuentaStr.isBlank()) {
            try { jugador.setIdCuenta(UUID.fromString(idCuentaStr)); } catch (Exception ignored) {}
        }
        jugador = jugadorRepo.save(jugador);

        Map<String, String> resp = new HashMap<>();
        resp.put("codigoAcceso", sala.getCodigoAcceso());
        resp.put("idJugador",   jugador.getIdJugador().toString());
        resp.put("idSala",      sala.getIdSala().toString());
        return ResponseEntity.ok(resp);
    }

    // ────────────────────────────────────────────────────────
    //  POST /api/salas/{codigo}/unirse
    // ────────────────────────────────────────────────────────
    @PostMapping("/salas/{codigo}/unirse")
    public ResponseEntity<?> unirseASala(
            @PathVariable String codigo,
            @RequestBody Map<String, String> body) {

        Optional<Sala> salaOpt = salaRepo.findByCodigoAcceso(codigo.toUpperCase());
        if (salaOpt.isEmpty())
            return ResponseEntity.status(404).body("Sala no encontrada. Verifica el código.");

        Sala sala = salaOpt.get();

        if (!"ESPERANDO".equals(sala.getEstado()))
            return ResponseEntity.badRequest().body("Esta sala ya inició o ha terminado.");

        long jugadoresActuales = jugadorRepo.countByIdSala(sala.getIdSala());
        if (jugadoresActuales >= sala.getMaxJugadores())
            return ResponseEntity.badRequest().body("La sala está llena (" + sala.getMaxJugadores() + " jugadores máx.).");

        String nickname = body.get("nickname");
        if (nickname == null || nickname.isBlank())
            return ResponseEntity.badRequest().body("El apodo es obligatorio.");

        if (jugadorRepo.existsByIdSalaAndNickname(sala.getIdSala(), nickname.trim()))
            return ResponseEntity.badRequest().body("Ese apodo ya está en uso en esta sala, elige otro.");

        Jugador jugador = new Jugador();
        jugador.setIdSala(sala.getIdSala());
        jugador.setNickname(nickname.trim());
        jugador.setAvatarUrl(body.get("avatarUrl"));
        jugador.setEsHost(false);
        String idCuentaStr = body.get("idCuenta");
        if (idCuentaStr != null && !idCuentaStr.isBlank()) {
            try { jugador.setIdCuenta(UUID.fromString(idCuentaStr)); } catch (Exception ignored) {}
        }
        jugador = jugadorRepo.save(jugador);

        Map<String, String> resp = new HashMap<>();
        resp.put("idJugador", jugador.getIdJugador().toString());
        resp.put("idSala",    sala.getIdSala().toString());
        return ResponseEntity.ok(resp);
    }

    // ────────────────────────────────────────────────────────
    //  GET /api/salas/{codigo}
    // ────────────────────────────────────────────────────────
    @GetMapping("/salas/{codigo}")
    public ResponseEntity<?> obtenerSala(@PathVariable String codigo) {
        Optional<Sala> salaOpt = salaRepo.findByCodigoAcceso(codigo.toUpperCase());
        if (salaOpt.isEmpty()) return ResponseEntity.status(404).body("Sala no encontrada.");

        Sala sala = salaOpt.get();
        List<Jugador> jugadores = jugadorRepo.findByIdSala(sala.getIdSala());

        Map<String, Object> resp = new HashMap<>();
        resp.put("estado",       sala.getEstado());
        resp.put("maxJugadores", sala.getMaxJugadores());
        resp.put("jugadores",    jugadores.stream().map(this::jugadorToMap).collect(Collectors.toList()));
        return ResponseEntity.ok(resp);
    }

    // ────────────────────────────────────────────────────────
    //  PUT /api/salas/{codigo}/iniciar
    // ────────────────────────────────────────────────────────
    @PutMapping("/salas/{codigo}/iniciar")
    public ResponseEntity<?> iniciarSala(@PathVariable String codigo) {
        Optional<Sala> salaOpt = salaRepo.findByCodigoAcceso(codigo.toUpperCase());
        if (salaOpt.isEmpty()) return ResponseEntity.status(404).body("Sala no encontrada.");

        Sala sala = salaOpt.get();
        sala.setEstado("JUGANDO");
        salaRepo.save(sala);
        return ResponseEntity.ok("Juego iniciado.");
    }

    // ────────────────────────────────────────────────────────
    //  PUT /api/salas/{idSala}/reiniciar (NUEVO PARA REJUGAR)
    // ────────────────────────────────────────────────────────
    @PutMapping("/salas/{idSala}/reiniciar")
    public ResponseEntity<?> reiniciarSala(@PathVariable UUID idSala) {
        return salaRepo.findById(idSala).map(sala -> {
            sala.setEstado("ESPERANDO"); 
            salaRepo.save(sala);
            cadenaRepo.vaciarCadenasPorSala(idSala); // Limpia frases y dibujos
            return ResponseEntity.ok().body(Map.of("mensaje", "Sala reiniciada exitosamente"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ────────────────────────────────────────────────────────
    //  DELETE /api/salas/{id} (NUEVO PARA DESTRUIR SALA AL CERRAR PESTAÑA)
    // ────────────────────────────────────────────────────────
    @DeleteMapping("/salas/{id}")
    public ResponseEntity<Void> eliminarSala(@PathVariable UUID id) {
        if (salaRepo.existsById(id)) {
            salaRepo.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }

    // ────────────────────────────────────────────────────────
    //  DELETE /api/jugadores/{id}
    // ────────────────────────────────────────────────────────
    @DeleteMapping("/jugadores/{id}")
    public ResponseEntity<?> eliminarJugador(@PathVariable UUID id) {
        Optional<Jugador> jugOpt = jugadorRepo.findById(id);
        if (jugOpt.isEmpty()) return ResponseEntity.status(404).body("Jugador no encontrado.");
        
        Jugador jugador = jugOpt.get();
        if (jugador.getEsHost()) {
            salaRepo.deleteById(jugador.getIdSala());
            return ResponseEntity.ok("El host salió. Sala eliminada.");
        } else {
            jugadorRepo.deleteById(id);
            return ResponseEntity.ok("Jugador eliminado.");
        }
    }
}