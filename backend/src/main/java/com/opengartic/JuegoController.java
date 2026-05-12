package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/juego")
@CrossOrigin(origins = "*")
public class JuegoController {

    @Autowired private JuegoService juegoService;

    // Llama el host para generar las cadenas iniciales
    @PostMapping("/{idSala}/iniciar")
    public ResponseEntity<?> iniciarJuego(@PathVariable UUID idSala) {
        juegoService.inicializarJuego(idSala);
        return ResponseEntity.ok("Juego inicializado.");
    }

    // Llama el frontend cada que cambia de ronda para ver qué le toca hacer
    @GetMapping("/{idSala}/turno/{idJugador}")
    public ResponseEntity<?> obtenerTurno(@PathVariable UUID idSala, @PathVariable UUID idJugador) {
        return ResponseEntity.ok(juegoService.obtenerTurnoActual(idSala, idJugador));
    }

    // Llama el frontend al final del juego para cargar todo el hilo del Gartic Phone
    @GetMapping("/{idSala}/resultados")
    public ResponseEntity<?> resultados(@PathVariable UUID idSala) {
        return ResponseEntity.ok(juegoService.obtenerResultados(idSala));
    }
}