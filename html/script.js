/* ================================================ */
/* FILE: html/script.js (FINÁLNÍ VERZE 2.0) */
/* ================================================ */

// ==================================================
// KONFIGURACE - Zde můžete měnit vzhled HUDu
// ==================================================
const CONFIG = {
  // Celková velikost HUDu v pixelech
  HUD_SIZE: 100,
  // Tloušťka jednotlivých oblouků
  STROKE_WIDTH: 6,
  // Mezera mezi jednotlivými oblouky
  ARC_GAP: 2,
  // Úhel, kde oblouk začíná (135 = vlevo dole)
  START_ANGLE: 0,
  // Jak velkou část kruhu oblouk zabírá (270 = 3/4 kruhu)
  SWEEP_ANGLE: 350, 
};
// ==================================================

const hud = document.getElementById('hud');
const svg = document.querySelector('.chart-svg');
const floatTextContainer = document.getElementById('float-text-container');
const centerTextValue = document.querySelector('#hud-center-text .value');

const nutrientData = {
  protein:  { el: document.getElementById('fill-protein')  },
  fats:     { el: document.getElementById('fill-fats')     },
  carbs:    { el: document.getElementById('fill-carbs')    },
  vitamins: { el: document.getElementById('fill-vitamins') },
};
const trackElements = document.querySelectorAll('.chart-track');

// --- Funkce pro generování SVG cest ---
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// --- Inicializace HUDu ---
function initializeHud() {
  // Nastavení velikosti
  hud.style.width = `${CONFIG.HUD_SIZE}px`;
  hud.style.height = `${CONFIG.HUD_SIZE}px`;
  document.documentElement.style.setProperty('--hud-size', `${CONFIG.HUD_SIZE}px`);

  const center = CONFIG.HUD_SIZE / 2;
  const maxRadius = center - (CONFIG.STROKE_WIDTH / 2);
  const endAngle = CONFIG.START_ANGLE + CONFIG.SWEEP_ANGLE;

  Object.values(nutrientData).forEach((data, i) => {
    const radius = maxRadius - (i * (CONFIG.STROKE_WIDTH + CONFIG.ARC_GAP));
    const pathDescription = describeArc(center, center, radius, CONFIG.START_ANGLE, endAngle);
    
    // Nastavení cesty pro vyplnění i pro pozadí
    data.el.setAttribute('d', pathDescription);
    data.el.style.strokeWidth = `${CONFIG.STROKE_WIDTH}px`;
    trackElements[i].setAttribute('d', pathDescription);
    trackElements[i].style.strokeWidth = `${CONFIG.STROKE_WIDTH}px`;
    
    // Výpočet délky cesty pro animaci
    const pathLength = data.el.getTotalLength();
    data.pathLength = pathLength;
    data.el.style.strokeDasharray = `${pathLength} ${pathLength}`;
    data.el.style.strokeDashoffset = pathLength;
  });
}

// --- Funkce pro aktualizaci oblouku ---
function updateArc(data, value) {
    const clampValue = Math.max(0, Math.min(100, Number(value || 0)));
    const offset = data.pathLength - (clampValue / 100) * data.pathLength;
    data.el.style.strokeDashoffset = offset;
}



// Zpracování NUI zpráv
window.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.action === 'init') {
    hud.style.display = data.visible ? 'flex' : 'none';
  } else if (data.action === 'visible') {
    hud.style.display = data.visible ? 'flex' : 'none';
  } else if (data.action === 'update') {
    updateArc(nutrientData.protein, data.protein);
    updateArc(nutrientData.fats, data.fats);
    updateArc(nutrientData.carbs, data.carbs);
    updateArc(nutrientData.vitamins, data.vitamins);

    const avg = Math.round(((data.protein||0) + (data.fats||0) + (data.carbs||0) + (data.vitamins||0)) / 4);
    centerTextValue.textContent = avg;

  }
});

// Spustíme inicializaci po načtení stránky
initializeHud();