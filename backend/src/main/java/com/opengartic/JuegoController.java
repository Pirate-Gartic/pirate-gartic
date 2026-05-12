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
    @Autowired private PasoCadenaRepository pasoRepo;
    @Autowired private CadenaRepository cadenaRepo;

    @PostMapping("/paso")
    public ResponseEntity<?> guardarPaso(@RequestBody Map<String, String> body) {
        UUID idCadena = UUID.fromString(body.get("idCadena"));
        UUID idJugador = UUID.fromString(body.get("idJugador"));
        String tipo = body.get("tipo");
        String contenido = body.get("contenido");
        Short ordenRonda = Short.parseShort(body.get("ordenRonda"));

        // 1. Guardar el paso (Texto o clave de DynamoDB)
        PasoCadena paso = new PasoCadena();
        paso.setIdCadena(idCadena);
        paso.setIdJugador(idJugador);
        paso.setTipo(tipo);
        paso.setContenido(contenido);
        paso.setOrdenRonda(ordenRonda);
        pasoRepo.save(paso);

        // 2. Avanzar la ronda de esta cadena específica
        Cadena cadena = cadenaRepo.findById(idCadena).get();
        cadena.setRondaActual((short)(ordenRonda + 1));
        cadenaRepo.save(cadena);

        return ResponseEntity.ok("Turno guardado.");
    }
}