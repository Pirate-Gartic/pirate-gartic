const API_URL = 'https://api.playchachara.com/api';

// ── Datos de sesión ──
const urlParams   = new URLSearchParams(window.location.search);
const codigoUrl   = urlParams.get('codigo');
const codigo      = codigoUrl || localStorage.getItem('codigoSala');
const idJugador   = localStorage.getItem('idJugador');
const esHost      = localStorage.getItem('esHost') === 'true';
const isGuest     = localStorage.getItem('isGuest') === 'true';

// Guardar código en localStorage si vino por URL
if (codigoUrl) localStorage.setItem('codigoSala', codigoUrl);

// ── Si no hay datos de sesión, redirigir ──
if (!codigo) {
    window.location.href = 'index.html';
}

// Si hay código en URL pero no hay idJugador → el usuario llegó por link directo
if (codigoUrl && !idJugador) {
    window.location.href = `index.html?join=${codigoUrl}`;
}

// ── Mostrar código ──
document.getElementById('codigo-display').textContent = codigo;

// ── Botón copiar enlace ──
document.getElementById('btn-copiar').addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}?codigo=${codigo}`;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btn-copiar');
        btn.textContent = '✅ ¡Enlace copiado!';
        setTimeout(() => btn.textContent = '📋 Copiar enlace', 2500);
    }).catch(() => {
        prompt('Copia este enlace y compártelo:', url);
    });
});

// ── Habilitar botón JUGAR solo para el host ──
const btnJugar = document.getElementById('btn-jugar');
if (esHost) btnJugar.disabled = false;

// ── Renderizar grid de jugadores ──
const CARD_COLORS = ['c0','c1','c2','c3','c4','c5','c6','c7'];

function renderPlayers(jugadores, maxJugadores) {
    const grid = document.getElementById('players-grid');
    grid.innerHTML = '';

    for (let i = 0; i < maxJugadores; i++) {
        const card = document.createElement('div');

        if (i < jugadores.length) {
            const j = jugadores[i];
            const esMiTarjeta = j.idJugador === idJugador;
            card.className = `player-card filled ${CARD_COLORS[i % CARD_COLORS.length]}${esMiTarjeta ? ' is-me' : ''}`;

            // Avatar circular
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'card-avatar';

            if (j.avatarUrl && j.avatarUrl.trim() !== '') {
                const img = document.createElement('img');
                img.src   = j.avatarUrl;   // ruta relativa completa guardada en BD
                img.alt   = j.nickname;
                img.onerror = () => { avatarDiv.innerHTML = '<span class="card-avatar-empty">🎨</span>'; };
                avatarDiv.appendChild(img);
            } else {
                avatarDiv.innerHTML = '<span class="card-avatar-empty">🎨</span>';
            }

            // Nombre
            const nameSpan = document.createElement('span');
            nameSpan.className = 'card-name';
            nameSpan.textContent = j.nickname;

            card.appendChild(avatarDiv);
            card.appendChild(nameSpan);

            // Corona de host
            if (j.esHost) {
                const crown = document.createElement('span');
                crown.className = 'host-crown';
                crown.textContent = '👑';
                card.appendChild(crown);
            }

        } else {
            // Slot vacío
            card.className = 'player-card empty';
            card.innerHTML = `
                <div class="card-avatar">
                    <span class="card-avatar-empty">?</span>
                </div>
                <span class="card-name card-name-empty">Vacío</span>
            `;
        }

        grid.appendChild(card);
    }

    document.getElementById('player-count').textContent =
        `${jugadores.length} / ${maxJugadores}`;
}

// ── Polling: actualizar sala cada 2 segundos ──
let pollInterval;
let navegandoAlJuego = false; // <--- NUEVA BANDERA

async function actualizarSala() {
    try {
        const resp = await fetch(`${API_URL}/salas/${codigo}`);

        if (resp.status === 404) {
            alert("El anfitrión ha cerrado la sala.");
            clearInterval(pollInterval);
            localStorage.clear(); // Limpiar sesión
            window.location.href = 'index.html';
            return;
        }
        
        if (!resp.ok) {
            document.getElementById('status-msg').textContent = 'Error de conexión. Reintentando...';
            return;
        }

        const data = await resp.json();

        // Guardar idSala para usar en el botón JUGAR
        if (data.idSala) {
            localStorage.setItem('idSala', data.idSala);
        }

        // Si el juego ya inició, redirigir a todos los jugadores
        if (data.estado === 'JUGANDO') {
            clearInterval(pollInterval);
            navegandoAlJuego = true; // <--- EVITA QUE SE BORRE EL JUGADOR AL CAMBIAR DE PANTALLA
            window.location.href = 'phrase.html';
            return;
        }

        renderPlayers(data.jugadores, data.maxJugadores);

        // Mensaje de estado según rol
        const statusEl = document.getElementById('status-msg');
        if (esHost) {
            statusEl.textContent = data.jugadores.length > 1
                ? `¡${data.jugadores.length} jugadores listos! Presiona JUGAR cuando quieras.`
                : 'Comparte el código para que otros se unan...';
        } else {
            statusEl.textContent = 'Esperando que el anfitrión inicie el juego...';
        }

    } catch (err) {
        document.getElementById('status-msg').textContent =
            'Error de conexión. Reintentando...';
    }
}

pollInterval = setInterval(actualizarSala, 2000);
actualizarSala(); // Llamada inmediata al cargar

// ── Botón JUGAR (solo host) ──
btnJugar.addEventListener('click', async () => {
    if (!esHost) return;
    btnJugar.disabled = true;
    btnJugar.textContent = '⏳ Iniciando...';
    try {
        const idSala = localStorage.getItem('idSala');
        // IMPORTANTE: Llamar al NUEVO endpoint que crea las cadenas
        const resp = await fetch(`${API_URL}/juego/${idSala}/iniciar`, { method: 'POST' });
        if (!resp.ok) throw new Error("Error al iniciar");
    } catch (err) {
        btnJugar.disabled = false;
        btnJugar.textContent = '▶ JUGAR';
        alert('Error al iniciar el juego.');
    }
});

// ── Botón Salir ──
document.getElementById('btn-salir').addEventListener('click', async () => {
    clearInterval(pollInterval);
    await eliminarJugador();
    window.location.href = 'index.html';
});

// ── Eliminar jugador de la BD ──
async function eliminarJugador() {
    if (!idJugador) return;
    try {
        await fetch(`${API_URL}/jugadores/${idJugador}`, {
            method: 'DELETE',
            keepalive: true   // permite que la request sobreviva al cierre del tab
        });
    } catch (e) { /* silencioso */ }
    // Limpiar localStorage de sesión de sala
    localStorage.removeItem('idJugador');
    localStorage.removeItem('codigoSala');
    localStorage.removeItem('esHost');
}

// ── Al cerrar el tab/ventana ──
window.addEventListener('beforeunload', () => {
    // SOLO BORRAR SI NO ESTAMOS ENTRANDO AL JUEGO
    if (idJugador && !navegandoAlJuego) {
        fetch(`${API_URL}/jugadores/${idJugador}`, { method: 'DELETE', keepalive: true });
    }
});