// =============================================================
//  CONFIGURACIÓN DE AVATARES
// =============================================================
const AVATARES = [
    "assets/avatars/calculator.png",
    "assets/avatars/casette.png",
    "assets/avatars/pizza.png",
    "assets/avatars/sun.png"
];
const AVATAR_DEFAULT = AVATARES[0];
const AVATAR_FOLDER = "assets/avatars/";

// Variables de estado para los avatares elegidos en cada vista
let crearAvatarPath = AVATAR_DEFAULT;
let unirseAvatarPath = AVATAR_DEFAULT;
let regAvatarPath = AVATAR_DEFAULT;

const API_URL = "http://localhost:8080/api/cuentas";
const SALAS_API_URL = "http://localhost:8080/api/salas";

// =============================================================
//  Validaciones
// =============================================================
function validarCorreo(correo) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo); }
function validarContrasena(contrasena) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(contrasena); }

// =============================================================
//  Gestión de Interfaz (Pestañas y Subvistas)
// =============================================================
function switchTab(tabId) {
    // Quitar 'active' de todos los tabs y contenidos
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activar el seleccionado
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function switchSubView(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(showId).classList.remove('hidden');
}

// Inicializar pickers de avatares
document.addEventListener('DOMContentLoaded', () => {
    buildAvatarPicker(document.getElementById('crear-avatar-picker'), document.getElementById('crear-avatar-display'), (p) => { crearAvatarPath = p; });
    buildAvatarPicker(document.getElementById('unirse-avatar-picker'), document.getElementById('unirse-avatar-display'), (p) => { unirseAvatarPath = p; });
    buildAvatarPicker(document.getElementById('reg-avatar-picker'), document.getElementById('reg-avatar-display'), (p) => { regAvatarPath = p; });
});

function buildAvatarPicker(pickerEl, previewEl, onSelect) {
    setAvatarPreview(previewEl, AVATAR_DEFAULT);
    AVATARES.forEach((path, index) => {
        const btn = document.createElement('div');
        btn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        btn.dataset.path = path;
        const img = document.createElement('img'); img.src = path;
        btn.appendChild(img);
        btn.addEventListener('click', () => {
            pickerEl.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            setAvatarPreview(previewEl, path);
            onSelect(path);
        });
        pickerEl.appendChild(btn);
    });
}
function setAvatarPreview(previewEl, path) {
    previewEl.innerHTML = '';
    const img = document.createElement('img'); img.src = path; previewEl.appendChild(img);
}

// =============================================================
//  LÓGICA: CREAR SALA
// =============================================================

// Crear como Invitado
document.getElementById('btn-crear-sala').addEventListener('click', async () => {
    const nickname = document.getElementById('crear-username').value.trim();
    if (!nickname) return alert("Escribe un apodo.");
    await procesarCrearSala(nickname, crearAvatarPath, null, true);
});

// Crear con Login
document.getElementById('btn-crear-login').addEventListener('click', async () => {
    const email = document.getElementById('crear-login-email').value.trim();
    const pass = document.getElementById('crear-login-pass').value.trim();
    if (!email || !pass) return alert("Llena los campos.");
    const cuenta = await realizarLogin(email, pass);
    if (cuenta) await procesarCrearSala(cuenta.nombreUsuario, cuenta.avatarPath, cuenta.idCuenta, false);
});

async function procesarCrearSala(nickname, avatarUrl, idCuenta, isGuest) {
    try {
        const resp = await fetch(SALAS_API_URL + '/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, avatarUrl, idCuenta: idCuenta || '' })
        });
        if (!resp.ok) return alert('Error al crear sala: ' + await resp.text());
        
        const data = await resp.json();
        guardarSesion(data.codigoAcceso, data.idJugador, data.idSala, true, isGuest, nickname, avatarUrl);
        window.location.href = 'lobby.html';
    } catch (e) { alert("Error de conexión con el backend."); }
}


// =============================================================
//  LÓGICA: UNIRSE A SALA
// =============================================================

// Unirse como Invitado
document.getElementById('btn-unirse-sala').addEventListener('click', async () => {
    const codigo = document.getElementById('unirse-codigo').value.trim().toUpperCase();
    const nickname = document.getElementById('unirse-username').value.trim();
    if (!codigo || !nickname) return alert("Ingresa el código y un apodo.");
    await procesarUnirseSala(codigo, nickname, unirseAvatarPath, null, true);
});

// Unirse con Login
document.getElementById('btn-unirse-login').addEventListener('click', async () => {
    const codigo = document.getElementById('unirse-codigo').value.trim().toUpperCase();
    const email = document.getElementById('unirse-login-email').value.trim();
    const pass = document.getElementById('unirse-login-pass').value.trim();
    if (!codigo || !email || !pass) return alert("Ingresa código, correo y contraseña.");
    const cuenta = await realizarLogin(email, pass);
    if (cuenta) await procesarUnirseSala(codigo, cuenta.nombreUsuario, cuenta.avatarPath, cuenta.idCuenta, false);
});

async function procesarUnirseSala(codigo, nickname, avatarUrl, idCuenta, isGuest) {
    try {
        const resp = await fetch(`${SALAS_API_URL}/${codigo}/unirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, avatarUrl, idCuenta: idCuenta || '' })
        });
        
        if (!resp.ok) return alert(await resp.text()); // Muestra error si la sala está llena, no existe o el apodo ya se usa
        
        const data = await resp.json();
        guardarSesion(codigo, data.idJugador, data.idSala, false, isGuest, nickname, avatarUrl);
        window.location.href = 'lobby.html';
    } catch (e) { alert("Error de conexión con el backend."); }
}

// =============================================================
//  FUNCIONES AUXILIARES (Login, Registro y Sesión)
// =============================================================

async function realizarLogin(email, contrasena) {
    try {
        const response = await fetch(API_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contrasena })
        });
        if (response.ok) {
            const data = await response.json();
            return {
                nombreUsuario: data.nombreUsuario,
                idCuenta: data.idCuenta,
                avatarPath: AVATAR_FOLDER + (data.avatarNombre || 'avatar_01.png')
            };
        } else {
            alert("Error: " + await response.text());
            return null;
        }
    } catch (error) {
        alert("Error de conexión al iniciar sesión.");
        return null;
    }
}

// Registro
document.getElementById('btn-register').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!username || !email || !pass) return alert("Llena todo.");
    if (!validarCorreo(email)) return alert("Correo inválido.");
    if (!validarContrasena(pass)) return alert("Contraseña poco segura.");

    try {
        const response = await fetch(API_URL + '/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreUsuario: username, correo: email, contrasena: pass, avatar: regAvatarPath })
        });
        const mensaje = await response.text();
        alert(mensaje);
        if (response.ok) switchSubView('crear-register', 'crear-login');
    } catch (error) { alert("Error al registrarse."); }
});

function guardarSesion(codigo, idJugador, idSala, esHost, isGuest, username, avatarPath) {
    localStorage.setItem('codigoSala', codigo);
    localStorage.setItem('idJugador', idJugador);
    localStorage.setItem('idSala', idSala);
    localStorage.setItem('esHost', esHost ? 'true' : 'false');
    localStorage.setItem('isGuest', isGuest ? 'true' : 'false');
    localStorage.setItem('username', username);
    localStorage.setItem('avatarPath', avatarPath);
      // 🔥 AGREGAR ESTO: Limpiar la basura de juegos anteriores
    localStorage.removeItem('idCadena');
    localStorage.removeItem('rondaActual');
    localStorage.removeItem('imagenAnterior');
    localStorage.removeItem('promptAnterior');
}

// Si la URL trae un ?join=CODIGO, abrir la pestaña Unirse automáticamente
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
        switchTab('tab-unirse');
        document.getElementById('unirse-codigo').value = joinCode;
    }
});