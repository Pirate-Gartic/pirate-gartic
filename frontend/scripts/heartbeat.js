/**
 * heartbeat.js
 * Incluir ANTES de phrase.js o draw.js en el HTML.
 *
 * • Ping cada 5 s para avisar que el jugador sigue vivo.
 * • Al cerrar la pestaña:
 *     - Intenta enviar el paso actual (dibujo o texto vacío).
 *     - Si es HOST  → destruye la sala (todos ven 404 y van al index).
 *     - Si no es host → se elimina solo de la sala.
 */

const HB_API    = 'https://api.playchachara.com/api/heartbeat';
const SALA_API  = 'https://api.playchachara.com/api/salas';
const JUG_API   = 'https://api.playchachara.com/api/jugadores';
const JUEGO_API = 'https://api.playchachara.com/api/juego';

let _hbInterval  = null;
let _hbJugador   = null;
let _navegandoOK = false; // se pone true cuando la navegación es intencionada

/* ── API pública ─────────────────────────────────────────── */

function startHeartbeat(idJugador) {
    if (!idJugador) return;
    _hbJugador = idJugador;
    _sendPing();
    if (_hbInterval) clearInterval(_hbInterval);
    _hbInterval = setInterval(_sendPing, 5000);
    window.addEventListener('pagehide', _onClose);
}

/** Llama esto ANTES de hacer window.location.href para no disparar la lógica de cierre. */
function stopHeartbeat() {
    _navegandoOK = true;
    if (_hbInterval) { clearInterval(_hbInterval); _hbInterval = null; }
    window.removeEventListener('pagehide', _onClose);
}

/* ── Internos ────────────────────────────────────────────── */

async function _sendPing() {
    if (!_hbJugador) return;
    try {
        await fetch(HB_API, {
            method:    'POST',
            headers:   { 'Content-Type': 'application/json' },
            body:      JSON.stringify({ idJugador: _hbJugador }),
            keepalive: true
        });
    } catch (_) {}
}

function _onClose() {
    if (_navegandoOK) return; // navegación normal → no hacer nada

    const idJugador = _hbJugador || localStorage.getItem('idJugador');
    const idSala    = localStorage.getItem('idSala');
    const esHost    = localStorage.getItem('esHost') === 'true';
    const idCadena  = localStorage.getItem('idCadena');
    const ronda     = localStorage.getItem('rondaActual') || '1';

    // 1. Si hay función de envío de dibujo definida en draw.js → usarla
    if (typeof submitDrawingOnClose === 'function') {
        submitDrawingOnClose(); // keepalive interno
    }
    // 2. En phrase.html → mandar texto vacío para no bloquear el juego
    else if (idCadena && idJugador) {
        fetch(`${JUEGO_API}/paso`, {
            method:    'POST',
            headers:   { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                idCadena:   String(idCadena),
                idJugador:  String(idJugador),
                tipo:       'TEXTO',
                contenido:  '👻 (se fue)',
                ordenRonda: String(ronda)
            })
        });
    }

    // 3. Host → destruir sala (los jugadores detectarán 404 y van al index)
    if (esHost && idSala) {
        fetch(`${SALA_API}/${idSala}`, { method: 'DELETE', keepalive: true });
    } else if (idJugador) {
        fetch(`${JUG_API}/${idJugador}`, { method: 'DELETE', keepalive: true });
    }
}