// ── GAME STATE ──────────────────────────────────────────────────────────────
const G = {
  sol:    1,
  oxygen: 50,
  food:   50,
  power:  50,
  alloc:  { o2: 0, food: 0, power: 0 },
  running: false,
  mgmtOpen: false,
  lastEfficiency: 3,
};

// ── MANAGEMENT MODAL ─────────────────────────────────────────────────────────
function openMgmt() {
  if (!G.running) return;
  G.mgmtOpen = true;
  document.getElementById('mgmt-modal').classList.remove('hidden');
  document.getElementById('mgmt-sol').textContent = G.sol;
  document.getElementById('lock-prompt').classList.remove('hidden');
  // Release pointer lock
  if (document.pointerLockElement) document.exitPointerLock();
}

function closeMgmt() {
  G.mgmtOpen = false;
  document.getElementById('mgmt-modal').classList.add('hidden');
}
window.closeMgmt = closeMgmt;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (!G.running) return;
    G.mgmtOpen ? closeMgmt() : openMgmt();
  }
  if (e.key === 'Escape' && G.mgmtOpen) {
    closeMgmt();
  }
});

// ── ALLOCATION ───────────────────────────────────────────────────────────────
function adjustAlloc(res, delta) {
  const total = G.alloc.o2 + G.alloc.food + G.alloc.power;
  if (delta > 0 && total >= 15) return;
  G.alloc[res] = Math.max(0, G.alloc[res] + delta);
  updateAllocUI();
}
window.adjustAlloc = adjustAlloc;

function totalAlloc() { return G.alloc.o2 + G.alloc.food + G.alloc.power; }

function updateAllocUI() {
  const total = totalAlloc();
  const remaining = 10 - total;
  ['o2','food','power'].forEach(r => {
    document.getElementById(`alloc-val-${r}`).textContent = G.alloc[r];
    document.getElementById(`alloc-fill-${r}`).style.width = Math.min(100,(G.alloc[r]/10)*100)+'%';
  });
  const hEl = document.getElementById('hours-remaining');
  hEl.textContent = remaining;
  hEl.classList.toggle('over', total > 10);
  document.getElementById('alloc-warning').classList.toggle('hidden', total <= 10);
}

// ── HUD UPDATE ───────────────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hud-sol').textContent     = G.sol;
  document.getElementById('hud-sol-sub').textContent = `/ 20`;
  document.getElementById('hud-val-o2').textContent    = G.oxygen;
  document.getElementById('hud-val-food').textContent  = G.food;
  document.getElementById('hud-val-power').textContent = G.power;
  document.getElementById('hud-o2').style.width    = Math.min(100,Math.max(0,G.oxygen))+'%';
  document.getElementById('hud-food').style.width  = Math.min(100,Math.max(0,G.food))+'%';
  document.getElementById('hud-power').style.width = Math.min(100,Math.max(0,G.power))+'%';

  // Critical pulse class
  ['o2','food','power'].forEach(r => {
    const val = r==='o2'?G.oxygen:r==='food'?G.food:G.power;
    document.getElementById(`hud-${r}`).closest('.hud-bar-row')?.classList.toggle('critical', val<=15);
  });
}

function updateMgmtResources() {
  document.getElementById('val-o2').textContent    = G.oxygen;
  document.getElementById('val-food').textContent  = G.food;
  document.getElementById('val-power').textContent = G.power;
  document.getElementById('bar-o2').style.width    = Math.min(100,Math.max(0,G.oxygen))+'%';
  document.getElementById('bar-food').style.width  = Math.min(100,Math.max(0,G.food))+'%';
  document.getElementById('bar-power').style.width = Math.min(100,Math.max(0,G.power))+'%';
  document.getElementById('block-o2').classList.toggle('critical',    G.oxygen <= 15);
  document.getElementById('block-food').classList.toggle('critical',  G.food   <= 15);
  document.getElementById('block-power').classList.toggle('critical', G.power  <= 15);
}

// ── EVENTS ───────────────────────────────────────────────────────────────────
function randomEvent() {
  const roll = Math.floor(Math.random() * 8);
  const events = [
    { msg:'⚡ DUST STORM! Solar panels damaged.',          o2:0,   food:0,   power:-20, type:'log-danger'  },
    { msg:'🌬️ OXYGEN LEAK in Habitat B!',                 o2:-20, food:0,   power:0,   type:'log-danger'  },
    { msg:'🐛 CROP BLIGHT! Fungus hit food supply.',      o2:0,   food:-20, power:0,   type:'log-danger'  },
    { msg:'🔥 ELECTRICAL FIRE! Power & O2 damaged.',      o2:-10, food:0,   power:-15, type:'log-danger'  },
    { msg:'☀️ CLEAR SKIES! Solar at peak efficiency.',    o2:0,   food:0,   power:+10, type:'log-success' },
    { msg:'🌱 BUMPER HARVEST! Greenhouse overproduced.',  o2:0,   food:+10, power:0,   type:'log-success' },
    { msg:'🔧 REPAIR SUCCESS! O2 systems optimized.',     o2:+10, food:0,   power:0,   type:'log-success' },
    { msg:'😴 ROUTINE NIGHT. No incidents, Commander.',   o2:0,   food:0,   power:0,   type:'log-info'    },
  ];
  const ev = events[roll];
  G.oxygen += ev.o2; G.food += ev.food; G.power += ev.power;
  clamp();
  logEntry(ev.msg, ev.type);
  hudFlash(ev.msg, ev.type);
}

function clamp() {
  G.oxygen = Math.min(100,Math.max(0,G.oxygen));
  G.food   = Math.min(100,Math.max(0,G.food));
  G.power  = Math.min(100,Math.max(0,G.power));
}

// ── HUD EVENT FLASH ───────────────────────────────────────────────────────────
function hudFlash(msg, type) {
  const el = document.getElementById('hud-events');
  const div = document.createElement('div');
  div.className = `hud-event ${type}`;
  div.textContent = msg;
  el.prepend(div);
  setTimeout(() => div.classList.add('fade-out'), 4000);
  setTimeout(() => div.remove(), 5000);
}

// ── LOG ───────────────────────────────────────────────────────────────────────
function logEntry(msg, cls = 'log-info') {
  const log = document.getElementById('event-log');
  const div = document.createElement('div');
  div.className = `log-entry ${cls}`;
  div.innerHTML = `<span class="log-sol">[SOL ${G.sol}]</span>${msg}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function showEfficiency(eff) {
  const stars = eff>=5?'⭐⭐⭐⭐⭐':eff>=4?'⭐⭐⭐⭐':eff>=3?'⭐⭐⭐':eff>=2?'⭐⭐':'⭐';
  document.getElementById('eff-stars').textContent = stars;
  document.getElementById('eff-value').textContent = `${eff} units / hr`;
}

// ── CONFIRM SOL ───────────────────────────────────────────────────────────────
function confirmSol() {
  if (!G.running) return;
  const total = totalAlloc();
  const eff = Math.floor(Math.random()*5)+1;
  G.lastEfficiency = eff;
  let eEff = eff;
  if (total > 10) {
    eEff = Math.max(1, eff-2);
    logEntry(`⚠️ Over-allocation! Efficiency penalised to ${eEff}.`, 'log-warning');
  }
  G.oxygen += G.alloc.o2    * eEff;
  G.food   += G.alloc.food  * eEff;
  G.power  += G.alloc.power * eEff;
  clamp();
  G.oxygen -= 25; G.food -= 20; G.power -= 30;
  clamp();
  showEfficiency(eff);
  logEntry(`Efficiency: ${eff}/hr. +${G.alloc.o2*eEff} O2 | +${G.alloc.food*eEff} Food | +${G.alloc.power*eEff} Pwr`, 'log-info');
  randomEvent();

  if (G.oxygen<=0 || G.food<=0 || G.power<=0) {
    const dep=[];
    if(G.oxygen<=0)dep.push('Oxygen');
    if(G.food<=0)dep.push('Food');
    if(G.power<=0)dep.push('Power');
    updateHUD(); updateMgmtResources();
    closeMgmt();
    setTimeout(()=>endGame(false,dep), 600);
    return;
  }
  G.sol++;
  if (G.sol > 20) {
    updateHUD(); updateMgmtResources();
    closeMgmt();
    setTimeout(()=>endGame(true), 600);
    return;
  }
  updateHUD(); updateMgmtResources();
  G.alloc = {o2:0,food:0,power:0};
  updateAllocUI();
  closeMgmt();
}
window.confirmSol = confirmSol;

// ── END GAME ─────────────────────────────────────────────────────────────────
function endGame(victory, depletedRes=[]) {
  G.running = false;
  if (document.pointerLockElement) document.exitPointerLock();
  if (victory) {
    document.getElementById('end-icon').textContent    = '🚀';
    document.getElementById('end-title').textContent   = 'MISSION COMPLETE';
    document.getElementById('end-subtitle').textContent= 'The rescue ship has arrived. Well done, Commander.';
    const s = 1000, o=G.oxygen, f=G.food, p=G.power, tot=s+o+f+p;
    document.getElementById('score-survival').textContent = `+${s}`;
    document.getElementById('score-o2').textContent       = `+${o}`;
    document.getElementById('score-food').textContent     = `+${f}`;
    document.getElementById('score-power').textContent    = `+${p}`;
    document.getElementById('score-total').textContent    = tot;
    document.getElementById('score-card').style.display   = 'flex';
    const rank = tot>=1500?'Martian Legend':tot>=1350?'Senior Commander':tot>=1200?'Field Commander':tot>=1100?'Junior Commander':'Rookie Commander';
    document.getElementById('rank-name').textContent = rank;
  } else {
    document.getElementById('end-icon').textContent    = '☠️';
    document.getElementById('end-title').textContent   = 'MISSION FAILED';
    document.getElementById('end-subtitle').textContent= `CRITICAL: ${depletedRes.join(' & ')} depleted. Mars is a harsh mistress.`;
    document.getElementById('score-card').style.display= 'none';
  }
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('end-screen').classList.remove('hidden');
}

function restartGame() {
  G.sol=1; G.oxygen=50; G.food=50; G.power=50;
  G.alloc={o2:0,food:0,power:0}; G.running=true; G.mgmtOpen=false;
  document.getElementById('event-log').innerHTML =
    '<div class="log-entry log-info"><span class="log-sol">[SOL 0]</span>Mission re-initialized. Good luck, Commander.</div>';
  updateHUD(); updateMgmtResources(); updateAllocUI(); showEfficiency(3);
  document.getElementById('end-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
}
window.restartGame = restartGame;

// ── RESOURCE COLLECTION (called from scene.js) ───────────────────────────────
window.collectResource = function(type, amount) {
  if (!G.running) return;
  if (type === 'oxygen') G.oxygen = Math.min(100, G.oxygen + amount);
  if (type === 'food')   G.food   = Math.min(100, G.food   + amount);
  if (type === 'power')  G.power  = Math.min(100, G.power  + amount);
  updateHUD();
  updateMgmtResources();
  const icons = { oxygen:'⚗️', food:'🌱', power:'⚡' };
  const colors = { oxygen:'log-info', food:'log-success', power:'log-event' };
  hudFlash(`${icons[type]} Collected +${amount} ${type.toUpperCase()}!`, colors[type]);
};

// ── START ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  G.running = true;
  updateHUD(); updateAllocUI(); showEfficiency(3);
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
});
