const API_URL = 'http://localhost:8080/api';
const idSala = localStorage.getItem('idSala');
const esHost = localStorage.getItem('esHost');

if(!idSala) window.location.href = 'index.html';

// ==========================================
//  ESCUDO ANTI-BORRADO DE SALAS
// ==========================================
let navegacionInterna = false;
function irAPantalla(url) {
    navegacionInterna = true;
    window.location.href = url;
}

window.addEventListener('pagehide', () => {
    if (!navegacionInterna && idSala && esHost === 'true') {
        fetch(`http://localhost:8080/api/salas/${idSala}`, { method: 'DELETE', keepalive: true });
    }
});

// ==========================================
//  BOTONES
// ==========================================
const btnJugarNuevo = document.getElementById('btn-jugar-nuevo');
const btnSalir = document.getElementById('btn-volver');

// Mostrar botón de reiniciar solo si es el host
if (esHost === 'true') {
    btnJugarNuevo.style.display = 'block';
}

// Lógica: JUGAR DE NUEVO (Reciclar Sala)
btnJugarNuevo.addEventListener('click', async () => {
    try {
        // Le decimos a Spring Boot que aniquile los dibujos viejos
        await fetch(`http://localhost:8080/api/salas/${idSala}/reiniciar`, { method: 'PUT' });
        // Volvemos al lobby sin disparar el pagehide
        irAPantalla('lobby.html'); 
    } catch (error) {
        alert("Error al reiniciar la partida.");
    }
});

// Lógica: SALIR AL INICIO (Kahoot Style)
btnSalir.addEventListener('click', async () => {
    // Si el host le da a salir, destruimos la sala en la BD
    if (esHost === 'true') {
        await fetch(`http://localhost:8080/api/salas/${idSala}`, { method: 'DELETE' });
    } else {
        // Si es un jugador normal, lo eliminamos de la sala
        const idJugador = localStorage.getItem('idJugador');
        if (idJugador) {
            await fetch(`http://localhost:8080/api/jugadores/${idJugador}`, { method: 'DELETE' });
        }
    }
    
    localStorage.clear();
    irAPantalla('index.html');
});

// ==========================================
//  CARGA DE DIBUJOS Y FRASES
// ==========================================
async function cargarResultados() {
    try {
        const resp = await fetch(`${API_URL}/juego/${idSala}/resultados`);
        if (!resp.ok) throw new Error("Error al cargar");
        
        const cadenas = await resp.json();
        const wrapper = document.getElementById('cadenas-wrapper');
        wrapper.innerHTML = '';

        cadenas.forEach(cadena => {
            const card = document.createElement('div');
            card.className = 'cadena-card';
            
            const title = document.createElement('h2');
            title.className = 'cadena-title';
            title.textContent = `📓 El cuaderno de ${cadena.creador}`;
            card.appendChild(title);

            cadena.pasos.forEach(paso => {
                const divPaso = document.createElement('div');
                divPaso.className = 'paso';

                const autor = document.createElement('div');
                autor.className = 'paso-autor';
                autor.textContent = paso.autor;
                divPaso.appendChild(autor);

                if (paso.tipo === 'TEXTO') {
                    const txt = document.createElement('p');
                    txt.className = 'paso-texto';
                    txt.textContent = `"${paso.contenido}"`;
                    divPaso.appendChild(txt);
                } else if (paso.tipo === 'DIBUJO') {
                    const img = document.createElement('img');
                    img.className = 'paso-dibujo';
                    img.src = paso.contenido; 
                    divPaso.appendChild(img);
                }
                card.appendChild(divPaso);
            });

            wrapper.appendChild(card);
        });

    } catch (error) {
        document.getElementById('cadenas-wrapper').innerHTML = '<h2 style="color:white; text-align:center;">Hubo un problema recuperando las imágenes.</h2>';
    }
}

cargarResultados();

// ==========================================
//  RADAR PARA INVITADOS (Polling)
// ==========================================
if (esHost !== 'true') {
    // Mostrarle al invitado que estamos esperando al jefe
    document.getElementById('msg-esperando').style.display = 'block';

    // Checar cada 3 segundos qué está haciendo el Host
    setInterval(async () => {
        try {
            const codigoSala = localStorage.getItem('codigoSala');
            const resp = await fetch(`http://localhost:8080/api/salas/${codigoSala}`);
            
            if (resp.ok) {
                const data = await resp.json();
                // ¡El host reinició la sala! Nos vamos todos al lobby automáticamente
                if (data.estado === 'ESPERANDO') {
                    irAPantalla('lobby.html');
                }
            } else if (resp.status === 404) {
                // El host le dio a "Salir al inicio" y destruyó la sala. Nos saca a todos.
                localStorage.clear();
                irAPantalla('index.html');
            }
        } catch (error) {
            console.log("Buscando señal del host...");
        }
    }, 3000); // 3000 ms = 3 segundos
}