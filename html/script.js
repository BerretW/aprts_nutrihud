/* ================================================ */
/* FILE: html/script.js (OPRAVENO PŘEKRÝVÁNÍ)      */
/* ================================================ */
const wrapper = document.getElementById('hud-wrapper');
const hud = document.getElementById('hud');
const resizeHandle = document.getElementById('resize-handle');
const floatTextContainer = document.getElementById('float-text-container');

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

function updateResponsiveStyles(height) {
  const baseHeight = 80;
  const scale = Math.max(0.5, height / baseHeight);
  hud.style.setProperty('--hud-scale-factor', scale.toFixed(2));
}

function setDimensions(x, y, width, height) {
  if (x !== null && y !== null) {
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
  }
  if (width !== null && height !== null) {
    hud.style.width = width + 'px';
    hud.style.height = height + 'px';
    updateResponsiveStyles(height);
  } else {
    const rect = hud.getBoundingClientRect();
    updateResponsiveStyles(rect.height);
  }
}

// << UPRAVENÁ FUNKCE: Přidán parametr 'verticalOffset' >>
function showFloatingText(delta, statType, verticalOffset = 0) {
  const textElement = document.createElement('div');
  textElement.classList.add('float-text', statType);
  
  const text = (delta > 0 ? '+' : '') + delta;
  textElement.textContent = text;
  
  // Náhodný horizontální posun (zůstává)
  const randomHorizontalOffset = Math.random() * 120 - 60; // od -60px do +60px
  
  // << ZMĚNA: Nastavujeme počáteční pozici pomocí 'top' a 'left' >>
  // Tím zajistíme, že každý text začne jinde, než se spustí animace.
  textElement.style.top = `calc(50% + ${verticalOffset}px)`;
  textElement.style.left = `calc(50% + ${randomHorizontalOffset}px)`;

  textElement.addEventListener('animationend', () => {
    textElement.remove();
  });

  floatTextContainer.appendChild(textElement);
}

// Zpracování NUI zpráv
window.addEventListener('message', (e) => {
  const data = e.data || {};
  
  if (data.action === 'init') {
    setDimensions(data.x, data.y, data.width, data.height);
    hud.style.display = data.visible ? 'flex' : 'none';
  }
  if (data.action === 'visible') {
    hud.style.display = data.visible ? 'flex' : 'none';
  }
  if (data.action === 'update') {
    // Aktualizace barů v HUDu
    const clamp = (v) => Math.max(0, Math.min(100, Number(v || 0)));
    fills.protein.style.height = clamp(data.protein) + '%';
    fills.fats.style.height = clamp(data.fats) + '%';
    fills.carbs.style.height = clamp(data.carbs) + '%';
    fills.vitamins.style.height = clamp(data.vitamins) + '%';

    // << NOVÁ LOGIKA PRO ROZŘAZENÍ (STAGGERING) >>
    let staggerIndex = 0;
    const staggerAmountPx = 35; // O kolik pixelů posunout každý další text

    if (data.protein_delta) {
      showFloatingText(data.protein_delta, 'protein', staggerIndex * staggerAmountPx);
      staggerIndex++;
    }
    if (data.fats_delta) {
      showFloatingText(data.fats_delta, 'fats', staggerIndex * staggerAmountPx);
      staggerIndex++;
    }
    if (data.carbs_delta) {
      showFloatingText(data.carbs_delta, 'carbs', staggerIndex * staggerAmountPx);
      staggerIndex++;
    }
    if (data.vitamins_delta) {
      showFloatingText(data.vitamins_delta, 'vitamins', staggerIndex * staggerAmountPx);
      staggerIndex++;
    }
  }
  if (data.action === 'toggleMoveControls') {
    document.body.classList.toggle('move-mode', data.show);
  }
});

// Zbytek kódu pro drag & drop a resize zůstává naprosto stejný
hud.addEventListener('mousedown', (ev) => {
  if (ev.target !== hud || !document.body.classList.contains('move-mode')) return;
  dragging = true;
  const rect = wrapper.getBoundingClientRect();
  dragOff.x = ev.clientX - rect.left;
  dragOff.y = ev.clientY - rect.top;
});

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
    updateResponsiveStyles(newHeight);
  }
});

window.addEventListener('mouseup', () => {
  dragging = false;
  resizing = false;
});

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