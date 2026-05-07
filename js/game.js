// ── GAME STATE ──────────────────────────────────────────────────────────────
const G = {
  sol:    1,
  oxygen: 50,
  food:   50,
  power:  50,
  alloc:  { o2: 0, food: 0, power: 0 },
  running: false,
  lastEfficiency: 3,
};

// ── ALLOCATION CONTROLS ──────────────────────────────────────────────────────
function adjustAlloc(res, delta) {
  const total = G.alloc.o2 + G.alloc.food + G.alloc.power;
  if (delta > 0 && total >= 15) return; // hard cap at 15
  G.alloc[res] = Math.max(0, G.alloc[res] + delta);
  updateAllocUI();
}

function totalAlloc() {
  return G.alloc.o2 + G.alloc.food + G.alloc.power;
}

function updateAllocUI() {
  const total = totalAlloc();
  const remaining = 10 - total;

  document.getElementById('alloc-val-o2').textContent    = G.alloc.o2;
  document.getElementById('alloc-val-food').textContent  = G.alloc.food;
  document.getElementById('alloc-val-power').textContent = G.alloc.power;

  document.getElementById('alloc-fill-o2').style.width    = Math.min(100, (G.alloc.o2 / 10) * 100)    + '%';
  document.getElementById('alloc-fill-food').style.width  = Math.min(100, (G.alloc.food / 10) * 100)  + '%';
  document.getElementById('alloc-fill-power').style.width = Math.min(100, (G.alloc.power / 10) * 100) + '%';

  const hoursEl = document.getElementById('hours-remaining');
  hoursEl.textContent = remaining;
  hoursEl.classList.toggle('over', total > 10);

  const warning = document.getElementById('alloc-warning');
  warning.classList.toggle('hidden', total <= 10);
}

// ── RESOURCE UI ──────────────────────────────────────────────────────────────
function updateResourceUI() {
  const clamp100 = v => Math.min(100, Math.max(0, v));

  document.getElementById('val-o2').textContent    = G.oxygen;
  document.getElementById('val-food').textContent  = G.food;
  document.getElementById('val-power').textContent = G.power;

  document.getElementById('bar-o2').style.width    = clamp100(G.oxygen) + '%';
  document.getElementById('bar-food').style.width  = clamp100(G.food)   + '%';
  document.getElementById('bar-power').style.width = clamp100(G.power)  + '%';

  // Critical state (≤15)
  document.getElementById('block-o2').classList.toggle('critical',    G.oxygen <= 15);
  document.getElementById('block-food').classList.toggle('critical',  G.food   <= 15);
  document.getElementById('block-power').classList.toggle('critical', G.power  <= 15);

  // Sol progress
  const pct = ((G.sol - 1) / 20) * 100;
  document.getElementById('sol-progress').style.width = pct + '%';
  document.getElementById('sol-number').textContent   = G.sol;
  document.getElementById('sol-sub').textContent      = `${21 - G.sol} Sol${21 - G.sol !== 1 ? 's' : ''} remaining`;
}

// ── RANDOM EVENTS ────────────────────────────────────────────────────────────
function randomEvent() {
  const roll = Math.floor(Math.random() * 8);
  const events = [
    { msg: '⚡ DUST STORM! Solar panels are damaged.',          o2: 0,   food: 0,   power: -20, type: 'log-danger' },
    { msg: '🌬️ OXYGEN LEAK detected in Habitat B!',            o2: -20, food: 0,   power: 0,   type: 'log-danger' },
    { msg: '🐛 CROP BLIGHT! A fungus hit the food supply.',    o2: 0,   food: -20, power: 0,   type: 'log-danger' },
    { msg: '🔥 ELECTRICAL FIRE! Power and Oxygen taking damage.',o2:-10, food: 0,  power: -15, type: 'log-danger' },
    { msg: '☀️ CLEAR SKIES! Solar panels at peak efficiency.',  o2: 0,   food: 0,   power: +10, type: 'log-success'},
    { msg: '🌱 BUMPER HARVEST! Greenhouse overproduced.',       o2: 0,   food: +10, power: 0,   type: 'log-success'},
    { msg: '🔧 REPAIR CREW SUCCESS! Oxygen systems optimized.', o2: +10, food: 0,   power: 0,   type: 'log-success'},
    { msg: '😴 ROUTINE DAY. No events to report, Commander.',   o2: 0,   food: 0,   power: 0,   type: 'log-info'  },
  ];
  const ev = events[roll];
  G.oxygen += ev.o2;
  G.food   += ev.food;
  G.power  += ev.power;
  clampResources();
  logEntry(ev.msg, ev.type);
}

function clampResources() {
  G.oxygen = Math.min(100, Math.max(0, G.oxygen));
  G.food   = Math.min(100, Math.max(0, G.food));
  G.power  = Math.min(100, Math.max(0, G.power));
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

// ── EFFICIENCY STARS ──────────────────────────────────────────────────────────
function showEfficiency(eff) {
  const stars = eff >= 5 ? '⭐⭐⭐⭐⭐' : eff >= 4 ? '⭐⭐⭐⭐' : eff >= 3 ? '⭐⭐⭐' : eff >= 2 ? '⭐⭐' : '⭐';
  document.getElementById('eff-stars').textContent = stars;
  document.getElementById('eff-value').textContent = `${eff} units / hr`;
}

// ── CONFIRM SOL ───────────────────────────────────────────────────────────────
function confirmSol() {
  if (!G.running) return;

  const total = totalAlloc();
  const efficiency = Math.floor(Math.random() * 5) + 1; // 1–5
  G.lastEfficiency = efficiency;

  let effectiveEff = efficiency;
  if (total > 10) {
    effectiveEff = Math.max(1, efficiency - 2);
    logEntry(`⚠️ Over-allocation! Crew worked inefficiently. Efficiency penalised to ${effectiveEff}.`, 'log-warning');
  }

  // Add resources
  G.oxygen += G.alloc.o2    * effectiveEff;
  G.food   += G.alloc.food  * effectiveEff;
  G.power  += G.alloc.power * effectiveEff;
  clampResources();

  // Daily drain
  G.oxygen -= 25;
  G.food   -= 20;
  G.power  -= 30;
  clampResources();

  showEfficiency(efficiency);
  logEntry(`Crew efficiency: ${efficiency} units/hr. O2 +${G.alloc.o2 * effectiveEff} | Food +${G.alloc.food * effectiveEff} | Power +${G.alloc.power * effectiveEff}`, 'log-info');

  // Random event
  randomEvent();

  // Check game-over
  if (G.oxygen <= 0 || G.food <= 0 || G.power <= 0) {
    const depletedRes = [];
    if (G.oxygen <= 0) depletedRes.push('Oxygen');
    if (G.food   <= 0) depletedRes.push('Food');
    if (G.power  <= 0) depletedRes.push('Power');
    updateResourceUI();
    setTimeout(() => endGame(false, depletedRes), 600);
    return;
  }

  G.sol++;

  // Check victory
  if (G.sol > 20) {
    updateResourceUI();
    setTimeout(() => endGame(true), 600);
    return;
  }

  updateResourceUI();

  // Reset allocation
  G.alloc = { o2: 0, food: 0, power: 0 };
  updateAllocUI();
}

// ── END GAME ─────────────────────────────────────────────────────────────────
function endGame(victory, depletedRes = []) {
  G.running = false;

  if (victory) {
    document.getElementById('end-icon').textContent    = '🚀';
    document.getElementById('end-title').textContent   = 'MISSION COMPLETE';
    document.getElementById('end-subtitle').textContent= 'The rescue ship has arrived. Well done, Commander.';

    const survivalBonus = 1000;
    const oBonus  = G.oxygen;
    const fBonus  = G.food;
    const pBonus  = G.power;
    const total   = survivalBonus + oBonus + fBonus + pBonus;

    document.getElementById('score-survival').textContent = `+${survivalBonus}`;
    document.getElementById('score-o2').textContent       = `+${oBonus}`;
    document.getElementById('score-food').textContent     = `+${fBonus}`;
    document.getElementById('score-power').textContent    = `+${pBonus}`;
    document.getElementById('score-total').textContent    = total;
    document.getElementById('score-card').style.display   = 'flex';

    let rank;
    if (total >= 1500) rank = 'Martian Legend';
    else if (total >= 1350) rank = 'Senior Commander';
    else if (total >= 1200) rank = 'Field Commander';
    else if (total >= 1100) rank = 'Junior Commander';
    else rank = 'Rookie Commander';

    document.getElementById('rank-name').textContent = rank;
  } else {
    document.getElementById('end-icon').textContent    = '☠️';
    document.getElementById('end-title').textContent   = 'MISSION FAILED';
    document.getElementById('end-subtitle').textContent= `CRITICAL FAILURE: ${depletedRes.join(' & ')} depleted. Mars is a harsh mistress.`;
    document.getElementById('score-card').style.display= 'none';
  }

  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.remove('hidden');
}

// ── RESTART ───────────────────────────────────────────────────────────────────
function restartGame() {
  G.sol    = 1;
  G.oxygen = 50;
  G.food   = 50;
  G.power  = 50;
  G.alloc  = { o2: 0, food: 0, power: 0 };
  G.running = true;

  document.getElementById('event-log').innerHTML =
    '<div class="log-entry log-info"><span class="log-sol">[SOL 0]</span>Mission re-initialized. Good luck, Commander.</div>';

  updateResourceUI();
  updateAllocUI();
  showEfficiency(3);

  document.getElementById('end-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
}

// ── START ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  G.running = true;
  updateResourceUI();
  updateAllocUI();
  showEfficiency(3);
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
});
