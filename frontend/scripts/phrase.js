const API_URL = 'http://localhost:8080/api';
const idSala = localStorage.getItem('idSala');
const idJugador = localStorage.getItem('idJugador');

// Cargar contexto (Si venimos de dibujar, mostrar la imagen)
const imagenAnterior = localStorage.getItem('imagenAnterior');
if(imagenAnterior) {
    document.getElementById('titulo').textContent = '¿Qué significa este dibujo?';
    document.getElementById('imagen-previa').style.display = 'block';
    document.getElementById('img-a-describir').src = imagenAnterior;
}

let timeLeft = 40;
let idCadenaActual = localStorage.getItem('idCadena');
let rondaActual = parseInt(localStorage.getItem('rondaActual') || "1");

const timerEl = document.getElementById('timer-circle');
const inputEl = document.getElementById('phrase-input');
const btnEnviar = document.getElementById('btn-enviar');

// Buscar qué cadena nos toca si es la primera ronda
if (rondaActual === 1) {
    fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`)
        .then(res => res.json())
        .then(data => { idCadenaActual = data.idCadena; localStorage.setItem('idCadena', data.idCadena); });
}

const countdown = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if(timeLeft <= 0) { clearInterval(countdown); enviarFrase(); }
}, 1000);

btnEnviar.addEventListener('click', () => { clearInterval(countdown); enviarFrase(); });

async function enviarFrase() {
    btnEnviar.style.display = 'none';
    inputEl.style.display = 'none';
    timerEl.style.display = 'none';
    document.getElementById('waiting-msg').style.display = 'block';

    let frase = inputEl.value.trim() || "Algo aburrido porque se me acabó el tiempo";

    // Nos aseguramos de tener la cadena (por si el jugador le dio click rapidísimo)
    if (!idCadenaActual) {
        const res = await fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`);
        const data = await res.json();
        idCadenaActual = data.idCadena;
        localStorage.setItem('idCadena', idCadenaActual);
    }

    // Guardar en backend asegurándonos de que TODO sea String
    await fetch(`${API_URL}/juego/paso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            idCadena: String(idCadenaActual),
            idJugador: String(idJugador),
            tipo: 'TEXTO',
            contenido: frase,
            ordenRonda: String(rondaActual) // <--- Aquí estaba el problema principal
        })
    });

    esperarSiguienteTurno();
}

function esperarSiguienteTurno() {
    const check = setInterval(async () => {
        const res = await fetch(`${API_URL}/juego/${idSala}/turno/${idJugador}`);
        const data = await res.json();

        if (data.juegoTerminado) {
            clearInterval(check);
            window.location.href = 'results.html'; // <--- REDIRIGE A RESULTADOS AL FINAL
        } else if (data.rondaActual > rondaActual) {
            clearInterval(check);
            localStorage.setItem('idCadena', data.idCadena);
            localStorage.setItem('rondaActual', data.rondaActual);
            localStorage.removeItem('imagenAnterior');

            if (rondaActual === 1) {
                localStorage.setItem('promptAnterior', data.contenidoAnterior);
                window.location.href = 'drawing.html'; // Toca dibujar
            } else if (data.accion === 'DIBUJAR') {
                localStorage.setItem('promptAnterior', data.contenidoAnterior);
                window.location.href = 'drawing.html'; // Toca dibujar
            } else {
                localStorage.setItem('imagenAnterior', data.contenidoAnterior);
                window.location.reload(); // Nos toca escribir otra vez (raro en gartic, pero por si acaso)
            }
        }
    }, 2000);
}