package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dibujos")
@CrossOrigin(origins = "*")
public class DibujoController {

    @Autowired
    private DibujoService dibujoService;

    // ────────────────────────────────────────────────────────
    //  POST /api/dibujos
    //  Sube el dibujo del canvas a DynamoDB.
    //  Body: { idSala, idJugador, ordenRonda, imagenBase64 }
    //    imagenBase64 puede venir con o sin prefijo "data:image/png;base64,"
    //  Responde: { idImagen: "idSala/idJugador_ordenRonda" }
    // ────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> subirDibujo(@RequestBody Map<String, String> body) {
        String idSala     = body.get("idSala");
        String idJugador  = body.get("idJugador");
        String ordenRonda = body.get("ordenRonda");
        String base64Raw  = body.get("imagenBase64");

        if (idSala == null || idJugador == null || ordenRonda == null || base64Raw == null || base64Raw.isBlank())
            return ResponseEntity.badRequest().body("Faltan campos: idSala, idJugador, ordenRonda, imagenBase64.");

        // Quitar el prefijo data URL si viene incluido
        String base64 = base64Raw.contains(",")
                ? base64Raw.substring(base64Raw.indexOf(',') + 1)
                : base64Raw;

        try {
            int ronda = Integer.parseInt(ordenRonda);
            String key = dibujoService.guardarDibujo(idSala, idJugador, ronda, base64);
            return ResponseEntity.ok(Map.of("idImagen", key));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("ordenRonda debe ser un número.");
        } catch (Exception e) {
            System.err.println("Error subiendo dibujo: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al guardar el dibujo en DynamoDB.");
        }
    }

    // ────────────────────────────────────────────────────────
    //  GET /api/dibujos/{idSala}/{idImagen}
    //  Recupera un dibujo de DynamoDB.
    //  idImagen = "{idJugador}_{ordenRonda}"
    //  Responde: { imagen: "data:image/png;base64,..." }
    // ────────────────────────────────────────────────────────
    @GetMapping("/{idSala}/{idImagen}")
    public ResponseEntity<?> obtenerDibujo(
            @PathVariable String idSala,
            @PathVariable String idImagen) {

        String key    = idSala + "/" + idImagen;
        String base64 = dibujoService.obtenerDibujo(key);

        if (base64 == null)
            return ResponseEntity.status(404).body("Dibujo no encontrado.");

        return ResponseEntity.ok(Map.of("imagen", "data:image/png;base64," + base64));
    }
}