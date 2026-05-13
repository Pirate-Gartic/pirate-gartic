// phrase.js — requiere heartbeat.js cargado antes en el HTML

const API_URL   = 'https://api.playchachara.com/api';
const idSala    = localStorage.getItem('idSala');
const idJugador = localStorage.getItem('idJugador');

startHeartbeat(idJugador);

const imagenAnterior = localStorage.getItem('imagenAnterior');
if (imagenAnterior) {
    document.getElementById('titulo').textContent = '¿Qué significa este dibujo?';
    document.getElementById('imagen-previa').style.display = 'block';
    document.getElementById('img-a-describir').src = imagenAnterior;
}

let timeLeft       = 40;
let idCadenaActual = localStorage.getItem('idCadena');
let rondaActual    = parseInt(localStorage.getItem('rondaActual') || '1');
let yaEnvio        = false;

const timerEl   = document.getElementById('timer-circle');
const inputEl   = document.getElementById('phrase-input');
const btnEnviar = document.getElementById('btn-enviar');

if (rondaActual === 1) {
    fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`)
        .then(r => r.json())
        .then(data => {
            idCadenaActual = data.idCadena;
            localStorage.setItem('idCadena', data.idCadena);
        });
}

const countdown = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 10) timerEl.style.background = '#fecaca';
    if (timeLeft <= 0)  { clearInterval(countdown); enviarFrase(); }
}, 1000);

btnEnviar.addEventListener('click', () => { clearInterval(countdown); enviarFrase(); });

async function enviarFrase() {
    if (yaEnvio) return;
    yaEnvio = true;

    btnEnviar.style.display = 'none';
    inputEl.style.display   = 'none';
    timerEl.style.display   = 'none';
    document.getElementById('waiting-msg').style.display = 'block';

    const frase = inputEl.value.trim() || 'Algo aburrido porque se me acabó el tiempo';

    if (!idCadenaActual) {
        const res  = await fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`);
        const data = await res.json();
        idCadenaActual = data.idCadena;
        localStorage.setItem('idCadena', idCadenaActual);
    }

    await fetch(`${API_URL}/juego/paso`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            idCadena:   String(idCadenaActual),
            idJugador:  String(idJugador),
            tipo:       'TEXTO',
            contenido:  frase,
            ordenRonda: String(rondaActual)
        })
    });

    esperarSiguienteTurno();
}

function esperarSiguienteTurno() {
    const codigoSala = localStorage.getItem('codigoSala');

    const check = setInterval(async () => {
        try {
            // ¿Sigue la sala? Si el host cerró → 404 → todos al index
            const salaResp = await fetch(`${API_URL}/salas/${codigoSala}`);
            if (salaResp.status === 404) {
                clearInterval(check);
                mostrarSalaCerrada();
                return;
            }

            const res  = await fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`);
            const data = await res.json();

            if (data.juegoTerminado) {
                clearInterval(check);
                stopHeartbeat();
                window.location.href = 'results.html';
            } else if (data.rondaActual > rondaActual) {
                clearInterval(check);
                localStorage.setItem('idCadena',    data.idCadena);
                localStorage.setItem('rondaActual', data.rondaActual);
                localStorage.removeItem('imagenAnterior');
                stopHeartbeat();

                if (rondaActual === 1 || data.accion === 'DIBUJAR') {
                    localStorage.setItem('promptAnterior', data.contenidoAnterior);
                    window.location.href = 'drawing.html';
                } else {
                    localStorage.setItem('imagenAnterior', data.contenidoAnterior);
                    window.location.reload();
                }
            }
        } catch (_) {}
    }, 2000);
}

function mostrarSalaCerrada() {
    stopHeartbeat();
    localStorage.clear();
    document.getElementById('waiting-msg').innerHTML =
        '😢 El anfitrión cerró la sala.<br>' +
        '<a href="index.html" style="color:#1e3a8a;font-weight:bold;text-decoration:underline;">Volver al inicio</a>';
}