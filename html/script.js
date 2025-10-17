/* ================================================ */
/* FILE: html/script.js (FINÁLNÍ VERZE) */
/* ================================================ */
const wrapper = document.getElementById('hud-wrapper');
const hud = document.getElementById('hud');
const resizeHandle = document.getElementById('resize-handle');

const fills = {
  protein: document.getElementById('fill-protein'),
  fats: document.getElementById('fill-fats'),
  carbs: document.getElementById('fill-carbs'),
  vitamins: document.getElementById('fill-vitamins'),
};

let dragging = false;
let resizing = false;
let dragOff = { x: 0, y: 0 };
let initialSize = { w: 0, h: 0 };

async function post(event, data = {}) {
  try {
    await fetch(`https://aprts_nutrihud/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data)
    });
  } catch (e) {}
}

// Funkce pro responzivní škálování obsahu
function updateResponsiveStyles(height) {
  const baseHeight = 80; // min-height z CSS
  const scale = Math.max(0.5, height / baseHeight); // Omezíme minimální škálu
  hud.style.setProperty('--hud-scale-factor', scale.toFixed(2));
}

function setDimensions(x, y, width, height) {
  if (x !== null && y !== null) {
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    wrapper.style.right = 'auto';
    wrapper.style.bottom = 'auto';
  }
  if (width !== null && height !== null) {
    hud.style.width = width + 'px';
    hud.style.height = height + 'px';
    updateResponsiveStyles(height);
  } else {
    // Pokud velikost není uložena, použijeme aktuální a nastavíme škálu
    const rect = hud.getBoundingClientRect();
    updateResponsiveStyles(rect.height);
  }
}

// Zpracování NUI zpráv
window.addEventListener('message', (e) => {
  const data = e.data || {};
  
  if (data.action === 'init') {
    setDimensions(data.x, data.y, data.width, data.height);
    console.log('Nastavení počátečních rozměrů a pozice HUDu:', data.x, data.y, data.width, data.height);
    hud.style.display = data.visible ? 'flex' : 'none';
  }
  if (data.action === 'visible') {
    hud.style.display = data.visible ? 'flex' : 'none';
  }
  if (data.action === 'update') {
    const clamp = (v) => Math.max(0, Math.min(100, Number(v || 0)));
    fills.protein.style.height = clamp(data.protein) + '%';
    fills.fats.style.height = clamp(data.fats) + '%';
    fills.carbs.style.height = clamp(data.carbs) + '%';
    fills.vitamins.style.height = clamp(data.vitamins) + '%';
  }
  if (data.action === 'toggleMoveControls') {
    document.body.classList.toggle('move-mode', data.show);
  }
});

// Drag & Drop
hud.addEventListener('mousedown', (ev) => {
  if (ev.target !== hud || !document.body.classList.contains('move-mode')) return;
  dragging = true;
  const rect = wrapper.getBoundingClientRect();
  dragOff.x = ev.clientX - rect.left;
  dragOff.y = ev.clientY - rect.top;
});

// Změna velikosti
resizeHandle.addEventListener('mousedown', (ev) => {
  if (!document.body.classList.contains('move-mode')) return;
  resizing = true;
  const rect = hud.getBoundingClientRect();
  initialSize.w = rect.width;
  initialSize.h = rect.height;
  dragOff.x = ev.clientX;
  dragOff.y = ev.clientY;
  ev.preventDefault();
  ev.stopPropagation();
});

// Pohyb myši
window.addEventListener('mousemove', (ev) => {
  if (dragging) {
    wrapper.style.left = (ev.clientX - dragOff.x) + 'px';
    wrapper.style.top = (ev.clientY - dragOff.y) + 'px';
  }
  if (resizing) {
    const minW = 130, minH = 80;
    const newWidth = Math.max(minW, initialSize.w + (ev.clientX - dragOff.x));
    const newHeight = Math.max(minH, initialSize.h + (ev.clientY - dragOff.y));
    hud.style.width = newWidth + 'px';
    hud.style.height = newHeight + 'px';
    updateResponsiveStyles(newHeight); // Aktualizujeme škálu při změně velikosti
  }
});

// Puštění myši
window.addEventListener('mouseup', () => {
  dragging = false;
  resizing = false;
});

// === NOVÁ LOGIKA PRO ESCAPE ===
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('move-mode')) {
    const rect = wrapper.getBoundingClientRect();
    const hudRect = hud.getBoundingClientRect();
    post('saveSettings', {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(hudRect.width),
      height: Math.round(hudRect.height),
    });
  }
});