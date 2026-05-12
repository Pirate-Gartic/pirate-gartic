// ═══════════════════════════════════════════════════════════
//  CHÁCHARA — PANTALLA DE DIBUJO
//  Respeta rutas y convenciones existentes del proyecto.
// ═══════════════════════════════════════════════════════════

// ── Datos de sesión (compatibles con lobby.html / game.html) ──
const urlParams   = new URLSearchParams(window.location.search);
const codigoSala  = urlParams.get('codigo')    || localStorage.getItem('codigoSala') || '';
const idJugador   = urlParams.get('idJugador') || localStorage.getItem('idJugador')  || '';
const username    = urlParams.get('username')  || localStorage.getItem('username')   || 'Jugador';
const promptParam = urlParams.get('prompt');

// ── Prompt genérico de prueba (en producción vendrá del backend) ──
const PROMPTS_PRUEBA = [
    'gato astronauta con casco',
    'pizza volando en el espacio',
    'perro tocando la guitarra eléctrica',
    'robot bailando salsa',
    'elefante en patines sobre hielo',
    'unicornio comiendo tacos al pastor',
    'dinosaurio usando computadora',
    'pulpo de chef cocinando',
    'oso montando una bicicleta',
    'conejo mago sacando un sombrero',
];

const promptEl = document.getElementById('prompt-text');
if (promptParam) {
    promptEl.textContent = '🎨 ' + decodeURIComponent(promptParam);
} else {
    const r = PROMPTS_PRUEBA[Math.floor(Math.random() * PROMPTS_PRUEBA.length)];
    promptEl.textContent = '🎨 ' + r;
}


// ═══════════════════════════════════════════════════════════
//  COLOR WHEEL
// ═══════════════════════════════════════════════════════════
const wheelCanvas = document.getElementById('color-wheel-canvas');
const wCtx = wheelCanvas.getContext('2d');
const WW = wheelCanvas.width, WH = wheelCanvas.height;
const WCX = WW / 2, WCY = WH / 2, WR = WW / 2 - 1;

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q-p)*6*t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q-p)*(2/3-t)*6;
            return p;
        };
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

(function drawWheel() {
    const id = wCtx.createImageData(WW, WH);
    for (let y = 0; y < WH; y++) {
        for (let x = 0; x < WW; x++) {
            const dx = x - WCX, dy = y - WCY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= WR) {
                const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
                const sat   = dist / WR;
                const [r, g, b] = hslToRgb(angle / 360, sat, 0.5);
                const i = (y * WW + x) * 4;
                id.data[i] = r; id.data[i+1] = g; id.data[i+2] = b; id.data[i+3] = 255;
            }
        }
    }
    wCtx.putImageData(id, 0, 0);
})();

wheelCanvas.addEventListener('click', e => {
    if (isLocked) return;
    const rect = wheelCanvas.getBoundingClientRect();
    const sx = WW / rect.width, sy = WH / rect.height;
    const x = Math.floor((e.clientX - rect.left) * sx);
    const y = Math.floor((e.clientY - rect.top)  * sy);
    const px = wCtx.getImageData(Math.max(0,x), Math.max(0,y), 1, 1).data;
    if (px[3] > 0) {
        setColor(`rgb(${px[0]},${px[1]},${px[2]})`);
        clearActiveSwatches();
    }
});


// ═══════════════════════════════════════════════════════════
//  COLOR SWATCHES
// ═══════════════════════════════════════════════════════════
const PRESETS = [
    '#e53935','#f4511e','#fb8c00','#fdd835',
    '#43a047','#00acc1','#1e88e5','#8e24aa',
    '#f06292','#ec407a','#ffffff','#bdbdbd',
    '#757575','#212121',
];

let currentColor = '#212121';
let activeSwatchEl = null;

const colorRing = document.getElementById('current-color-ring');

function setColor(hex) {
    currentColor = hex;
    colorRing.style.background = hex;
}

function clearActiveSwatches() {
    if (activeSwatchEl) {
        activeSwatchEl.classList.remove('active');
        activeSwatchEl = null;
    }
}

const swatchesGrid = document.getElementById('swatches-grid');

PRESETS.forEach(color => {
    const el = document.createElement('div');
    el.className = 'swatch';
    el.style.background = color;
    el.title = color;
    if (color === '#212121') {
        el.classList.add('active');
        activeSwatchEl = el;
    }
    el.addEventListener('click', () => {
        clearActiveSwatches();
        el.classList.add('active');
        activeSwatchEl = el;
        setColor(color);
    });
    swatchesGrid.appendChild(el);
});

// Custom color button
const nativeInput = document.getElementById('native-color-input');
const customBtn   = document.createElement('div');
customBtn.className = 'swatch-custom';
customBtn.textContent = '+ Color';
customBtn.title = 'Elegir color personalizado';
customBtn.addEventListener('click', () => nativeInput.click());
nativeInput.addEventListener('input', () => {
    clearActiveSwatches();
    setColor(nativeInput.value);
});
swatchesGrid.appendChild(customBtn);

// Initialize
setColor('#212121');


// ═══════════════════════════════════════════════════════════
//  CANVAS SETUP & RESIZE
// ═══════════════════════════════════════════════════════════
const canvas  = document.getElementById('drawing-canvas');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');

function resizeCanvas() {
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Preserve drawing across resize
    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width  || rect.width;
    tmp.height = canvas.height || rect.height;
    tmp.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width  = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}

window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);


// ═══════════════════════════════════════════════════════════
//  TOOL STATE
// ═══════════════════════════════════════════════════════════
let isDrawing   = false;
let isLocked    = false;
let currentTool = 'pencil';
let brushSize   = 5;
let startX = 0, startY = 0;
let shapeSnapshot = null;

// Undo stack
const undoStack = [];
const MAX_UNDO  = 30;

function saveUndo() {
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Tool buttons map
const TOOLS = {
    pencil:   document.getElementById('tool-pencil'),
    eraser:   document.getElementById('tool-eraser'),
    rect:     document.getElementById('tool-rect'),
    triangle: document.getElementById('tool-triangle'),
    circle:   document.getElementById('tool-circle'),
    star:     document.getElementById('tool-star'),
    line:     document.getElementById('tool-line'),
};

function selectTool(name) {
    currentTool = name;
    Object.keys(TOOLS).forEach(k => TOOLS[k].classList.toggle('active', k === name));
    canvas.style.cursor = name === 'eraser' ? 'cell' : 'crosshair';
}

Object.keys(TOOLS).forEach(name => {
    TOOLS[name].addEventListener('click', () => selectTool(name));
});

// Brush size
const sizeRange = document.getElementById('brush-size-range');
const sizeDot   = document.getElementById('size-dot');

sizeRange.addEventListener('input', () => {
    brushSize = parseInt(sizeRange.value);
    const d = Math.max(4, Math.min(22, brushSize));
    sizeDot.style.width  = d + 'px';
    sizeDot.style.height = d + 'px';
});

// Undo
document.getElementById('btn-undo').addEventListener('click', () => {
    if (isLocked || undoStack.length === 0) return;
    ctx.putImageData(undoStack.pop(), 0, 0);
});

// Clear
document.getElementById('btn-clear').addEventListener('click', () => {
    if (isLocked) return;
    saveUndo();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (isLocked) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (undoStack.length > 0) ctx.putImageData(undoStack.pop(), 0, 0);
    }
});


// ═══════════════════════════════════════════════════════════
//  COORDINATE HELPERS
// ═══════════════════════════════════════════════════════════
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top)  * sy,
    };
}
function getTouchPos(e) {
    const t = e.touches[0] || e.changedTouches[0];
    return getPos(t);
}


// ═══════════════════════════════════════════════════════════
//  DRAWING LOGIC
// ═══════════════════════════════════════════════════════════
function applyStrokeStyle() {
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineWidth   = currentTool === 'eraser' ? brushSize * 2.5 : brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
}

function onStart(x, y) {
    if (isLocked) return;
    isDrawing = true;
    startX = x; startY = y;
    saveUndo();
    shapeSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === 'pencil' || currentTool === 'eraser') {
        applyStrokeStyle();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function onMove(x, y) {
    if (!isDrawing || isLocked) return;

    if (currentTool === 'pencil' || currentTool === 'eraser') {
        applyStrokeStyle();
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        // Shape preview: restore snapshot and redraw
        ctx.putImageData(shapeSnapshot, 0, 0);
        drawShape(currentTool, startX, startY, x, y);
    }
}

function onEnd(x, y) {
    if (!isDrawing || isLocked) return;
    isDrawing = false;
    if (!['pencil','eraser'].includes(currentTool)) {
        ctx.putImageData(shapeSnapshot, 0, 0);
        drawShape(currentTool, startX, startY, x, y);
    }
    shapeSnapshot = null;
}

function drawShape(type, x1, y1, x2, y2) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth   = brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();

    if (type === 'rect') {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    } else if (type === 'circle') {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        const cx = x1 + (x2 - x1) / 2;
        const cy = y1 + (y2 - y1) / 2;
        ctx.ellipse(cx, cy, Math.max(rx,1), Math.max(ry,1), 0, 0, Math.PI * 2);
        ctx.stroke();

    } else if (type === 'triangle') {
        ctx.moveTo((x1 + x2) / 2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.closePath();
        ctx.stroke();

    } else if (type === 'line') {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

    } else if (type === 'star') {
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const outerR = Math.max(Math.abs(x2-x1), Math.abs(y2-y1)) / 2;
        const innerR = outerR * 0.42;
        const spikes = 5;
        let angle = -Math.PI / 2;
        const step  = Math.PI / spikes;
        ctx.moveTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        for (let i = 0; i < spikes; i++) {
            angle += step;
            ctx.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
            angle += step;
            ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        }
        ctx.closePath();
        ctx.stroke();
    }
}

// Mouse events
canvas.addEventListener('mousedown', e => { e.preventDefault(); const p=getPos(e); onStart(p.x,p.y); });
canvas.addEventListener('mousemove', e => { const p=getPos(e); onMove(p.x,p.y); });
canvas.addEventListener('mouseup',   e => { const p=getPos(e); onEnd(p.x,p.y); });
canvas.addEventListener('mouseleave',e => { if(isDrawing){ const p=getPos(e); onEnd(p.x,p.y); } });

// Touch events
canvas.addEventListener('touchstart', e => { e.preventDefault(); const p=getTouchPos(e); onStart(p.x,p.y); }, {passive:false});
canvas.addEventListener('touchmove',  e => { e.preventDefault(); const p=getTouchPos(e); onMove(p.x,p.y);  }, {passive:false});
canvas.addEventListener('touchend',   e => { e.preventDefault(); const p=getTouchPos(e); onEnd(p.x,p.y);   }, {passive:false});


// ═══════════════════════════════════════════════════════════
//  TIMER — 90 segundos
// ═══════════════════════════════════════════════════════════
let timeLeft = 90;
const timerBtn  = document.getElementById('timer-btn');
const timerText = document.getElementById('timer-text');

function fmt(s) {
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

timerText.textContent = fmt(timeLeft);

const timerInterval = setInterval(() => {
    if (isLocked) { clearInterval(timerInterval); return; }
    timeLeft = Math.max(0, timeLeft - 1);
    timerText.textContent = fmt(timeLeft);

    timerBtn.className = '';
    if (timeLeft <= 10) timerBtn.classList.add('danger');
    else if (timeLeft <= 30) timerBtn.classList.add('warn');

    if (timeLeft === 0) {
        clearInterval(timerInterval);
        lockCanvas(true);
    }
}, 1000);

// ═══════════════════════════════════════════════════════════
//  LOCK CANVAS Y ENVIAR AL BACKEND (Actualizado)
// ═══════════════════════════════════════════════════════════

// Recuperar el prompt que debemos dibujar desde el LocalStorage
const promptGuardado = localStorage.getItem('promptAnterior');
if(promptGuardado) {
    document.getElementById('prompt-text').textContent = '🎨 ' + promptGuardado;
}

async function lockCanvas(timedOut = false) {
    isLocked = true;
    clearInterval(timerInterval);

    document.getElementById('canvas-locked-overlay').style.display = 'block';
    document.getElementById('btn-listo').disabled = true;
    Object.values(TOOLS).forEach(btn => btn.disabled = true);
    document.getElementById('btn-undo').disabled  = true;
    document.getElementById('btn-clear').disabled = true;

    const overlay = document.getElementById('done-overlay');
    document.getElementById('done-msg').innerHTML = 'Guardando tu obra de arte...<span class="dots"></span>';
    overlay.classList.add('show');

    const dataUrl = canvas.toDataURL('image/png');
    const idSala = localStorage.getItem('idSala');
    const idJugador = localStorage.getItem('idJugador');
    const rondaActual = localStorage.getItem('rondaActual') || "2";
    const idCadena = localStorage.getItem('idCadena');

    try {
        // 1. Subir a DynamoDB (Tu endpoint existente)
        const respDyn = await fetch('http://localhost:8080/api/dibujos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idSala: idSala,
                idJugador: idJugador,
                ordenRonda: rondaActual,
                imagenBase64: dataUrl
            })
        });
        const dataDyn = await respDyn.json();
        const dynamoKey = dataDyn.idImagen;

        // 2. Avisar al backend que terminamos este turno
        await fetch('http://localhost:8080/api/juego/paso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idCadena: String(idCadena),
                idJugador: String(idJugador),
                tipo: 'DIBUJO',
                contenido: String(dynamoKey), // la clave que te regresó Dynamo
                ordenRonda: String(rondaActual) // <--- Forzamos a String
            })
        });

        // 3. Esperar a los demás
        document.getElementById('done-msg').innerHTML = 'Esperando a los demás jugadores<span class="dots"></span>';
        
        const check = setInterval(async () => {
            const res = await fetch(`http://localhost:8080/api/juego/${idSala}/turno/${idJugador}`);
            const data = await res.json();

            if (data.juegoTerminado) {
                clearInterval(check);
                window.location.href = 'resultados.html'; // <--- FIN DEL JUEGO
            } else if (data.rondaActual > parseInt(rondaActual)) {
                clearInterval(check);
                localStorage.setItem('idCadena', data.idCadena);
                localStorage.setItem('rondaActual', data.rondaActual);
                
                if (data.accion === 'ESCRIBIR') {
                    localStorage.setItem('imagenAnterior', data.contenidoAnterior);
                    window.location.href = 'phrase.html'; // Toca describir
                }
            }
        }, 2000);

    } catch(e) {
        document.getElementById('done-msg').textContent = "Error de conexión al guardar.";
    }
}

document.getElementById('btn-listo').addEventListener('click', () => {
    if (!isLocked) lockCanvas(false);
});

// Initial tool UI
selectTool('pencil');