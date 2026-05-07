// =============================================================
//  CONFIGURACIÓN DE AVATARES
//  Agrega o quita rutas aquí cuando añadas imágenes a /imagenes/
// =============================================================
const AVATARES = [
    "assets/avatars/calculator.png",
    "assets/avatars/casette.png",
    "assets/avatars/pizza.png",
    "assets/avatars/sun.png"
];

const AVATAR_DEFAULT = AVATARES[0];

// FIX: carpeta donde viven los avatares en el frontend.
// El backend solo guarda el nombre del archivo (ej: "Logo Chachara.png"),
// y el frontend reconstruye la ruta completa con este prefijo.
const AVATAR_FOLDER = "assets/avatars/";

// =============================================================
//  Estado: avatar actualmente seleccionado en cada vista
// =============================================================
let guestAvatarPath = AVATAR_DEFAULT;
let regAvatarPath   = AVATAR_DEFAULT;


// =============================================================
//  Validaciones (Correo y Contraseña)
// =============================================================
function validarCorreo(correo) {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
}

function validarContrasena(contrasena) {
    // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
    const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regexContrasena.test(contrasena);
}


// =============================================================
//  Construcción del grid de avatares
// =============================================================
function buildAvatarPicker(pickerEl, previewEl, onSelect) {
    setAvatarPreview(previewEl, AVATAR_DEFAULT);

    AVATARES.forEach((path, index) => {
        const btn = document.createElement('div');
        btn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        btn.dataset.path = path;

        const img = document.createElement('img');
        img.src = path;
        img.alt = 'Avatar ' + (index + 1);
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
    const img = document.createElement('img');
    img.src = path;
    img.alt = 'Avatar seleccionado';
    previewEl.appendChild(img);
}

// =============================================================
//  Inicializar pickers al cargar
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    buildAvatarPicker(
        document.getElementById('guest-avatar-picker'),
        document.getElementById('avatar-display'),
        (path) => { guestAvatarPath = path; }
    );

    buildAvatarPicker(
        document.getElementById('reg-avatar-picker'),
        document.getElementById('reg-avatar-display'),
        (path) => { regAvatarPath = path; }
    );
});

// =============================================================
//  Cambio de vista
// =============================================================
function switchView(viewId) {
    document.getElementById('view-guest').classList.add('hidden');
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-register').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

// =============================================================
//  1. Jugar como invitado
// =============================================================
document.getElementById('btn-play').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    if (username === "") {
        alert("Necesitas escribir un apodo para jugar.");
        return;
    }

    // Limpiar sesión anterior de cuenta registrada
    localStorage.removeItem('avatarNombre');

    localStorage.setItem('username',   username);
    localStorage.setItem('isGuest',    'true');
    localStorage.setItem('avatarPath', guestAvatarPath);  // ruta local completa

    window.location.href = 'game.html?username=' + encodeURIComponent(username);
});

// =============================================================
//  2. Iniciar sesión
// =============================================================
const API_URL = "http://localhost:8080/api/cuentas";
const SALAS_API_URL = "http://localhost:8080/api/salas";

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value.trim();

    if (!email || !pass) return alert("Llena todos los campos.");

    try {
        const response = await fetch(API_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contrasena: pass })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.mensaje);

            // Limpiar estado de invitado
            localStorage.removeItem('isGuest');

            const avatarNombre = data.avatarNombre || 'avatar_01.png';
            const avatarPath = AVATAR_FOLDER + avatarNombre;

            localStorage.setItem('username', data.nombreUsuario);
            localStorage.setItem('avatarNombre', avatarNombre);
            localStorage.setItem('avatarPath', avatarPath);

            const crearSalaResponse = await fetch(SALAS_API_URL + '/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: data.nombreUsuario,
                    avatarUrl: avatarPath,
                    idCuenta: data.idCuenta || ''
                })
            });

            if (!crearSalaResponse.ok) {
                const errorMsg = await crearSalaResponse.text();
                alert('No se pudo crear la sala: ' + errorMsg);
                return;
            }

            const salaData = await crearSalaResponse.json();
            localStorage.setItem('codigoSala', salaData.codigoAcceso);
            localStorage.setItem('idJugador', salaData.idJugador);
            localStorage.setItem('idSala', salaData.idSala);
            localStorage.setItem('esHost', 'true');

            window.location.href = 'lobby.html';
        } else {
            const errorMsg = await response.text();
            alert("Error: " + errorMsg);
        }
    } catch (error) {
        alert("No se pudo conectar con el servidor. ¿Ya corriste el backend?");
    }
});

// =============================================================
//  3. Registro
// =============================================================
document.getElementById('btn-register').addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const pass     = document.getElementById('reg-pass').value.trim();

    // 1. Validar que no estén vacíos
    if (!username || !email || !pass) {
        return alert("Todos los campos son obligatorios.");
    }

    // 2. Validar formato de correo
    if (!validarCorreo(email)) {
        return alert("Por favor, ingresa un correo electrónico válido (ejemplo: usuario@correo.com).");
    }

    // 3. Validar seguridad de contraseña
    if (!validarContrasena(pass)) {
        return alert("La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.");
    }

    try {
        const response = await fetch(API_URL + '/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreUsuario: username,
                correo:        email,
                contrasena:    pass,
                avatar:        regAvatarPath   // FIX: campo "avatar", el backend normaliza la ruta
            })
        });

        const mensaje = await response.text();

        if (response.ok) {
            alert(mensaje);
            switchView('view-login');
        } else {
            alert(mensaje);
        }
    } catch (error) {
        alert("Error de conexión. Revisa que el servidor esté en el puerto 8080.");
    }
});