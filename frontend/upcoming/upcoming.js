const urlParams  = new URLSearchParams(window.location.search);
const username   = urlParams.get('username')
                || localStorage.getItem('username')
                || 'Invitado';
const avatarPath = localStorage.getItem('avatarPath') || '';

document.getElementById('welcome-message').textContent =
    `¡Hola, ${username}! El juego está en desarrollo. Pronto podrás dibujar y adivinar palabras aquí.`;
document.getElementById('player-name').textContent = username;

const avatarEl = document.getElementById('player-avatar');
if (avatarPath.trim() !== '') {
    const img = document.createElement('img');
    img.src = avatarPath;
    img.alt = username;
    img.onerror = () => { avatarEl.textContent = '🎨'; };
    avatarEl.textContent = '';
    avatarEl.appendChild(img);
} else {
    avatarEl.textContent = '🎨';
}

document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = 'index.html';
});