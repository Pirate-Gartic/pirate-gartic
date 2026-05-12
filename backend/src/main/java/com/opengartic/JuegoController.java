package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/juego")
@CrossOrigin(origins = "*")
public class JuegoController {

    @Autowired private JuegoService juegoService;
    @Autowired private PasoCadenaRepository pasoRepo;
    @Autowired private CadenaRepository cadenaRepo;

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

        // 2. Obtener datos de la cadena y la sala
        Cadena cadena = cadenaRepo.findById(idCadena).get();
        UUID idSala = cadena.getIdSala();
        List<Cadena> cadenasDeSala = cadenaRepo.findByIdSala(idSala);
        
        // 3. Contar pasos completados para esta ronda en esta sala
        int numPasosCompletados = pasoRepo.countByIdSalaAndOrdenRonda(idSala, ordenRonda);
        
        // 4. Contar cadenas (= número de jugadores que deberían completar)
        int numCadenas = cadenasDeSala.size();
        
        // 5. Si se completó la ronda, avanzar TODAS las cadenas
        if (numPasosCompletados == numCadenas) {
            for (Cadena c : cadenasDeSala) {
                c.setRondaActual((short)(ordenRonda + 1));
                cadenaRepo.save(c);
            }
        }
        
        return ResponseEntity.ok("Turno guardado.");
    }
}