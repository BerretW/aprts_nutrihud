const hud = document.getElementById('hud');
const chipAvg = document.getElementById('chip-avg');
const chipBal = document.getElementById('chip-bal');
const tagsWrap = document.getElementById('tags');

const fills = {
  protein: document.querySelector('.fill-protein'),
  fats: document.querySelector('.fill-fats'),
  carbs: document.querySelector('.fill-carbs'),
  vitamins: document.querySelector('.fill-vitamins'),
};
const vals = {
  protein: document.getElementById('val-protein'),
  fats: document.getElementById('val-fats'),
  carbs: document.getElementById('val-carbs'),
  vitamins: document.getElementById('val-vitamins'),
};

let locked = false;
let dragging = false;
let dragOff = { x:0, y:0 };

function setPos(x, y, persist=false){
  hud.style.left = x + 'px';
  hud.style.top = y + 'px';
  if(persist){
    fetch(`https://aprts_nutrihud/savePos`, {
      method:'POST',
      headers:{'Content-Type':'application/json; charset=UTF-8'},
      body: JSON.stringify({ x: Math.round(x), y: Math.round(y) })
    }).catch(()=>{});
  }
}

window.addEventListener('message', (e) => {
  const data = e.data || {};
  if(data.action === 'init'){
    setPos(data.x||30, data.y||30, false);
    hud.classList.toggle('locked', !!data.locked);
    locked = !!data.locked;
    hud.style.display = data.visible ? 'block' : 'none';
  }
  if(data.action === 'visible'){
    hud.style.display = data.visible ? 'block' : 'none';
  }
  if(data.action === 'lock'){
    locked = !!data.locked;
    hud.classList.toggle('locked', locked);
  }
  if(data.action === 'update'){
    const clamp = (v)=> Math.max(0, Math.min(100, Number(v||0)));

    const p = clamp(data.protein);
    const f = clamp(data.fats);
    const c = clamp(data.carbs);
    const v = clamp(data.vitamins);
    fills.protein.style.width = p + '%';
    fills.fats.style.width = f + '%';
    fills.carbs.style.width = c + '%';
    fills.vitamins.style.width = v + '%';

    vals.protein.textContent = p.toFixed(0);
    vals.fats.textContent = f.toFixed(0);
    vals.carbs.textContent = c.toFixed(0);
    vals.vitamins.textContent = v.toFixed(0);

    const avg = Math.max(0, Math.min(100, Number(data.avg||0)));
    const bal = Math.max(0, Math.min(100, Number(data.balance||0)));
    chipAvg.textContent = `AVG ${avg.toFixed(0)}`;
    chipBal.textContent = `BAL ${bal.toFixed(0)}`;

    // Tagy
    tagsWrap.innerHTML = '';
    const tags = Array.isArray(data.tags) ? data.tags : [];
    tags.forEach(t => {
      const el = document.createElement('span');
      el.className = 'tag ' + (['balanced_plus'].includes(t) ? 'good' : (['hungry','starving','unbalanced','low_protein','low_fats','low_carbs','low_vitamins','high_fats','sugar_spike'].includes(t) ? 'bad':''));
      el.textContent = t.replace('_',' ');
      tagsWrap.appendChild(el);
    });
  }
});

// Drag & drop
function onDown(ev){
  if(locked) return;
  dragging = true;
  const rect = hud.getBoundingClientRect();
  const x = (ev.touches ? ev.touches[0].clientX : ev.clientX);
  const y = (ev.touches ? ev.touches[0].clientY : ev.clientY);
  dragOff.x = x - rect.left;
  dragOff.y = y - rect.top;
  ev.preventDefault();
}

function onMove(ev){
  if(!dragging) return;
  const x = (ev.touches ? ev.touches[0].clientX : ev.clientX);
  const y = (ev.touches ? ev.touches[0].clientY : ev.clientY);
  setPos(x - dragOff.x, y - dragOff.y, false);
  ev.preventDefault();
}

function onUp(ev){
  if(!dragging) return;
  dragging = false;
  const rect = hud.getBoundingClientRect();
  setPos(rect.left, rect.top, true);
  ev.preventDefault();
}

hud.addEventListener('mousedown', onDown);
hud.addEventListener('touchstart', onDown, {passive:false});
window.addEventListener('mousemove', onMove);
window.addEventListener('touchmove', onMove, {passive:false});
window.addEventListener('mouseup', onUp);
window.addEventListener('touchend', onUp);
