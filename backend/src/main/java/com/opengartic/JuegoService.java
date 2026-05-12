package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class JuegoService {

    @Autowired private SalaRepository salaRepo;
    @Autowired private JugadorRepository jugadorRepo;
    @Autowired private CadenaRepository cadenaRepo;
    @Autowired private PasoCadenaRepository pasoRepo;
    @Autowired private DibujoService dibujoService;

    // 1. Inicializa las cadenas cuando el host presiona "JUGAR"
    public void inicializarJuego(UUID idSala) {
        List<Jugador> jugadores = jugadorRepo.findByIdSala(idSala);
        // Ordenamos para mantener el anillo estático
        jugadores.sort(Comparator.comparing(Jugador::getIdJugador));

        for (Jugador j : jugadores) {
            Cadena c = new Cadena();
            c.setIdSala(idSala);
            c.setIdJugadorOrigen(j.getIdJugador());
            c.setRondaActual((short) 1);
            cadenaRepo.save(c);
        }
        Sala sala = salaRepo.findById(idSala).get();
        sala.setEstado("JUGANDO");
        salaRepo.save(sala);
    }

    // 2. LÓGICA DE ROTACIÓN (PASO 4): ¿Qué me toca hacer en esta ronda?
    public Map<String, Object> obtenerTurnoActual(UUID idSala, UUID idJugador) {
        List<Jugador> jugadores = jugadorRepo.findByIdSala(idSala);
        jugadores.sort(Comparator.comparing(Jugador::getIdJugador));

        int miIndice = -1;
        for (int i = 0; i < jugadores.size(); i++) {
            if (jugadores.get(i).getIdJugador().equals(idJugador)) {
                miIndice = i; break;
            }
        }

        List<Cadena> cadenas = cadenaRepo.findByIdSala(idSala);
        cadenas.sort(Comparator.comparing(Cadena::getIdJugadorOrigen));

        // Obtener la ronda actual basada en el estado de las cadenas
        int rondaActual = cadenas.stream().mapToInt(Cadena::getRondaActual).min().orElse(1);
        if (rondaActual > jugadores.size()) return Map.of("juegoTerminado", true);

        // FÓRMULA DEL ANILLO: La cadena se pasa a la "derecha"
        int numJugadores = jugadores.size();
        int indiceCadenaQueMeToca = (miIndice - (rondaActual - 1) + numJugadores) % numJugadores;
        Cadena cadenaAsignada = cadenas.get(indiceCadenaQueMeToca);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("idCadena", cadenaAsignada.getIdCadena());
        respuesta.put("rondaActual", rondaActual);
        respuesta.put("juegoTerminado", false);

        if (rondaActual == 1) {
            respuesta.put("accion", "ESCRIBIR");
            respuesta.put("contenidoAnterior", null);
        } else {
            // Recuperar el paso anterior para saber si toca dibujar o adivinar
            Optional<PasoCadena> pasoAnteriorOpt = pasoRepo.findByIdCadenaAndOrdenRonda(
                    cadenaAsignada.getIdCadena(), (short) (rondaActual - 1)
            );
            if (pasoAnteriorOpt.isPresent()) {
                PasoCadena pasoAnterior = pasoAnteriorOpt.get();
                if (pasoAnterior.getTipo() == TipoPaso.TEXTO) {
                    respuesta.put("accion", "DIBUJAR");
                    respuesta.put("contenidoAnterior", pasoAnterior.getContenido()); // El texto a dibujar
                } else {
                    respuesta.put("accion", "ESCRIBIR");
                    // Aquí es DIBUJO, recuperamos de DynamoDB para mandarlo listo
                    String base64 = dibujoService.obtenerDibujo(pasoAnterior.getContenido());
                    respuesta.put("contenidoAnterior", "data:image/png;base64," + base64);
                }
            }
        }
        return respuesta;
    }

    // 3. OBTENER RESULTADOS FINALES (PASO 5)
    public List<Map<String, Object>> obtenerResultados(UUID idSala) {
        List<Cadena> cadenas = cadenaRepo.findByIdSala(idSala);
        List<Map<String, Object>> resultados = new ArrayList<>();

        for (Cadena c : cadenas) {
            Map<String, Object> cadenaMap = new HashMap<>();
            Jugador origen = jugadorRepo.findById(c.getIdJugadorOrigen()).orElse(null);
            cadenaMap.put("creador", origen != null ? origen.getNickname() : "Desconocido");
            
            List<PasoCadena> pasos = pasoRepo.findByIdCadenaOrderByOrdenRonda(c.getIdCadena());
            List<Map<String, Object>> pasosList = new ArrayList<>();
            
            for (PasoCadena p : pasos) {
                Map<String, Object> pasoMap = new HashMap<>();
                Jugador autor = jugadorRepo.findById(p.getIdJugador()).orElse(null);
                pasoMap.put("autor", autor != null ? autor.getNickname() : "Desconocido");
                pasoMap.put("tipo", p.getTipo());
                
                if (p.getTipo() == TipoPaso.DIBUJO) {
                    // Extraer mágicamente de DynamoDB
                    String base64 = dibujoService.obtenerDibujo(p.getContenido());
                    pasoMap.put("contenido", "data:image/png;base64," + base64);
                } else {
                    pasoMap.put("contenido", p.getContenido());
                }
                pasosList.add(pasoMap);
            }
            cadenaMap.put("pasos", pasosList);
            resultados.add(cadenaMap);
        }
        return resultados;
    }
}