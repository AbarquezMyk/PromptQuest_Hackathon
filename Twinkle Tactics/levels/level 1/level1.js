// === Canvas Setup ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// === HUD Elements ===
const goldEl = document.getElementById('gold-amount');
const fairyEl = document.getElementById('fairy-amount');
const wpnLevelEl = document.getElementById('wpn-level');
const wpnAtkEl = document.getElementById('wpn-atk');
const wpnSpdEl = document.getElementById('wpn-spd');
const wpnBoltsEl = document.getElementById('wpn-bolts');
const levelLabel = document.getElementById('game-level');
const enhanceBtn = document.getElementById('enhance-btn');
const enhanceMsg = document.getElementById('enhance-msg');
const progressFill = document.getElementById('progress-fill');
const waveMsg = document.getElementById('wave-msg');
const pointsEl = document.getElementById('upgrade-points');

// === Modals ===
const overlayEl = document.getElementById('overlay');
const levelCompleteModal = document.getElementById('modal-level-complete');
const nextLevelBtn = document.getElementById('next-level-btn');
const gameOverModal = document.getElementById('modal-game-over');
const retryBtn = document.getElementById('retry-btn');
const quitBtn = document.getElementById('quit-btn');

// === Game State ===
let gold = parseInt(goldEl.textContent, 10) || 0;
let fairy = parseInt(fairyEl.textContent, 10) || 0;
let keys = new Set();
let bullets = [];
let enemyBullets = [];
let bossBullets = [];
let enemies = [];
let boss = null;
let lastTs = performance.now();
let spawnTimer = 0;
let bossSpawned = false;
let progress = 0;
let points = 0;
let currentLevel = 1;
const MAX_LEVEL = 1;

// === Player & Weapon ===
const player = { x: 160, y: H / 2, r: 18, speed: 3.2, hp: 100, invuln: 0 };
const weapon = {
  name: 'Starburst Wand',
  level: 1,
  atk: 120,
  bonus: 30,
  atkSpd: 0.60,
  cooldown: 0,
  projectiles: 1
};

// === Level Config ===
const LEVELS = {
  1: {
    spawnInterval: 500,
    enemyHP: [80, 120],
    enemySpeed: [1.2, 2.0],
    bossHP: 1200,
    bossSpeed: 1.1
  }
};

// === Ambient Stars ===
const stars = Array.from({ length: 90 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  s: Math.random() * 2 + 0.5,
  speed: Math.random() * 0.6 + 0.2
}));

// === UI Helpers ===
function updateWeaponUI() {
  wpnLevelEl.textContent = weapon.level;
  wpnAtkEl.textContent = weapon.atk;
  wpnSpdEl.textContent = weapon.atkSpd.toFixed(2) + 's';
  wpnBoltsEl.textContent = weapon.projectiles;
  levelLabel.textContent = `${currentLevel} / ${MAX_LEVEL}`;
}
updateWeaponUI();

function flash(el, text) {
  el.textContent = text;
  el.classList.remove('sparkle');
  void el.offsetWidth;
  el.classList.add('sparkle');
  setTimeout(() => { el.textContent = ''; }, 1200);
}

const style = document.createElement('style');
style.textContent = `
  .sparkle { animation: sparkle 1.1s ease-out forwards; }
  @keyframes sparkle {
    0% { opacity: 0; transform: translateY(-4px) scale(0.98); }
    25% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-12px) scale(1.03); }
  }
`;
document.head.appendChild(style);

// === Input ===
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['w','a','s','d'].includes(k)) keys.add(k);
});
document.addEventListener('keyup', e => {
  keys.delete(e.key.toLowerCase());
});

// === Enhance Button ===
enhanceBtn.addEventListener('click', () => {
  if (gold < 15) return flash(enhanceMsg, 'Not enough Diamond Coins!');
  gold -= 15;
  goldEl.textContent = gold;
  weapon.level += 1;
  const atkGain = 35 + Math.floor(Math.random() * 35);
  weapon.atk += atkGain;
  weapon.bonus += Math.floor(Math.random() * 25) + 10;
  weapon.atkSpd = Math.max(0.22, weapon.atkSpd - 0.03);
  weapon.projectiles += 1;
  updateWeaponUI();
  flash(enhanceMsg, `Enhanced! +${atkGain} ATK, +1 bolt`);
});

// === Spawners ===
function spawnEnemy() {
  const cfg = LEVELS[currentLevel];
  const y = 40 + Math.random() * (H - 80);
  const r = 14 + Math.random() * 10;
  const hp = randBetween(cfg.enemyHP[0], cfg.enemyHP[1]);
  const speed = randBetween(cfg.enemySpeed[0], cfg.enemySpeed[1]);
  enemies.push({ x: W + 30, y, r, hp, speed, shootCooldown: Math.random() * 1000 });
}

function spawnBoss() {
  const cfg = LEVELS[currentLevel];
  boss = {
    x: W + 60,
    y: H / 2,
    r: 44,
    hp: cfg.bossHP,
    speed: cfg.bossSpeed,
    dir: 1,
    shootCooldown: 1000 + Math.random() * 500
  };
  bossSpawned = true;
  flash(waveMsg, 'Boss Appears!');
}

// === Utilities ===
function randBetween(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// === Shooting ===
function shoot(dt) {
  weapon.cooldown -= dt;
  if (weapon.cooldown <= 0) {
    const total = weapon.projectiles;
    const spread = 10;
    const offset = (total - 1) * spread / 2;
    for (let i = 0; i < total; i++) {
      bullets.push({
        x: player.x + player.r + 2,
        y: player.y - offset + i * spread,
        vx: 7.0,
        vy: 0,
        dmg: weapon.atk + weapon.bonus
      });
    }
    weapon.cooldown = weapon.atkSpd * 1000;
  }
}

// === Progress ===
function addProgress(v) {
  progress = Math.min(100, progress + v);
  progressFill.style.width = progress + '%';
  if (progress >= 100) {
    progress = 0;
    progressFill.style.width = '0%';
    points += 1;
    pointsEl.textContent = 'Points: ' + points;
    flash(waveMsg, '+1 Upgrade Point!');
  }
}
// === Level Lifecycle ===
function startLevel(lv) {
  currentLevel = lv;
  enemies = [];
  bullets = [];
  enemyBullets = [];
  bossBullets = [];
  boss = null;
  bossSpawned = false;
  spawnTimer = 0;
  progress = 0;
  progressFill.style.width = '0%';
  player.hp = 100;
  player.invuln = 0;
  player.x = 160;
  player.y = H / 2;
  spawnInterval = LEVELS[lv].spawnInterval;
  updateWeaponUI();
  flash(waveMsg, `Level ${lv} Start!`);
}
startLevel(1);

// === Update Loop ===
function update(ts) {
  const dt = ts - lastTs;
  lastTs = ts;

  stars.forEach(s => {
    s.x -= s.speed * 0.6;
    if (s.x < -3) {
      s.x = W + 3;
      s.y = Math.random() * H;
    }
  });

  let vx = 0, vy = 0;
  if (keys.has('w')) vy -= 1;
  if (keys.has('s')) vy += 1;
  if (keys.has('a')) vx -= 1;
  if (keys.has('d')) vx += 1;
  if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
  player.x = clamp(player.x + vx * player.speed, player.r, W - player.r);
  player.y = clamp(player.y + vy * player.speed, player.r, H - player.r);
  if (player.invuln > 0) player.invuln -= dt;

  shoot(dt);

  bullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x > W + 40) return bullets.splice(i, 1);

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.abs(b.x - e.x) < e.r + 6 && Math.abs(b.y - e.y) < e.r + 6) {
        e.hp -= b.dmg;
        bullets.splice(i, 1);
        return;
      }
    }

    if (boss && Math.abs(b.x - boss.x) < boss.r + 8 && Math.abs(b.y - boss.y) < boss.r + 8) {
      boss.hp -= b.dmg;
      bullets.splice(i, 1);
    }
  });

  enemyBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -40) return enemyBullets.splice(i, 1);

    if (player.invuln <= 0 && Math.hypot(player.x - b.x, player.y - b.y) < player.r + 6) {
      player.hp -= b.dmg;
      player.invuln = 600;
      flash(waveMsg, 'Hit by enemy!');
      enemyBullets.splice(i, 1);
    }
  });

  bossBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -40) return bossBullets.splice(i, 1);

    if (player.invuln <= 0 && Math.hypot(player.x - b.x, player.y - b.y) < player.r + 8) {
      player.hp -= b.dmg;
      player.invuln = 700;
      flash(waveMsg, 'Boss blast!');
      bossBullets.splice(i, 1);
    }
  });

  enemies.forEach((e, i) => {
    const dy = player.y - e.y;
    e.y += Math.sign(dy) * Math.min(Math.abs(dy), e.speed * 0.6);
    e.x -= e.speed * 1.2;

    e.shootCooldown -= dt;
    if (e.shootCooldown <= 0) {
      enemyBullets.push({
        x: e.x - e.r,
        y: e.y,
        vx: -4.2,
        vy: 0,
        dmg: 10
      });
      e.shootCooldown = 1200 + Math.random() * 800;
    }

    if (player.invuln <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r) {
      player.hp -= 10;
      player.invuln = 800;
      flash(waveMsg, 'Ouch!');
    }

    if (e.hp <= 0) {
      addProgress(10);
      if (Math.random() < 0.35) { gold += 3; goldEl.textContent = gold; flash(waveMsg, '+3 💎'); }
      else if (Math.random() < 0.15) { fairy += 1; fairyEl.textContent = fairy; flash(waveMsg, '+1 🧚'); }
      enemies.splice(i, 1);
    } else if (e.x < -40) {
      enemies.splice(i, 1);
    }
  });

  if (boss) {
    boss.x -= boss.speed;
    boss.y += boss.dir * 1.4;
    if (boss.y < 80 || boss.y > H - 80) boss.dir *= -1;

    boss.shootCooldown -= dt;
    if (boss.shootCooldown <= 0) {
      bossBullets.push({
        x: boss.x - boss.r,
        y: boss.y,
        vx: -5.5,
        vy: 0,
        dmg: 20
      });
      boss.shootCooldown = 1000 + Math.random() * 600;
    }

    if (player.invuln <= 0 && Math.hypot(player.x - boss.x, player.y - boss.y) < player.r + boss.r + 4) {
      player.hp -= 20;
      player.invuln = 900;
      flash(waveMsg, 'Boss hit!');
    }

    if (boss.hp <= 0) {
      boss = null;
      onLevelComplete();
    }
  }

  if (!bossSpawned && enemies.length < 20) {
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnEnemy();
      spawnInterval = Math.max(300, spawnInterval - 5);
    }
  }

  if (!bossSpawned && enemies.length >= 30) {
    spawnBoss();
  }

  if (player.hp <= 0) onGameOver();
}

// === Draw Loop ===
function draw() {
  ctx.clearRect(0, 0, W, H);

  stars.forEach(s => {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player
  ctx.save();
  const grd = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 22);
  grd.addColorStop(0, 'rgba(255, 223, 0, 1)');
  grd.addColorStop(1, 'rgba(176, 76, 229, 0.15)');
  ctx.fillStyle = grd;
  ctx.shadowColor = '#FFDF00';
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(player.x - 10, player.y - 5, 8, 4, -0.7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(player.x + 10, player.y - 5, 8, 4, 0.7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(16, 12, 160, 10);
  ctx.fillStyle = player.hp > 30 ? '#8be9fd' : '#ff7675';
  ctx.fillRect(16, 12, 160 * (player.hp / 100), 10);

  bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = '#FFDF00';
    ctx.shadowColor = '#FFDF00';
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  enemyBullets.forEach(b => {
    ctx.save();
  ctx.fillStyle = '#FF7675';
  ctx.shadowColor = '#FF7675';
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  });

  bossBullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = '#FF00FF';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  enemies.forEach(e => {
    ctx.save();
    ctx.fillStyle = 'rgba(120, 0, 160, 0.85)';
    ctx.shadowColor = '#B04CE5';
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFDF00';
    ctx.beginPath(); ctx.arc(e.x - 5, e.y - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + 5, e.y - 3, 2, 0, Math.PI * 2); ctx.fill();

    const w = e.r * 2;
    const hpPctE = Math.max(0, e.hp) / Math.max(1, LEVELS[currentLevel].enemyHP[1]);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 4);
    ctx.fillStyle = '#FFDF00';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * hpPctE, 4);
    ctx.restore();
  });

  if (boss) {
    ctx.save();
    ctx.fillStyle = 'rgba(180, 0, 220, 0.9)';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, boss.r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFDF00';
    ctx.beginPath(); ctx.arc(boss.x - 8, boss.y - 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(boss.x + 8, boss.y - 6, 3, 0, Math.PI * 2); ctx.fill();

    const bw = 360, bh = 12;
    const hpPctB = Math.max(0, boss.hp) / LEVELS[currentLevel].bossHP;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect((W - bw) / 2, 24, bw, bh);
    ctx.fillStyle = '#FFDF00';
    ctx.fillRect((W - bw) / 2, 24, bw * hpPctB, bh);
    ctx.restore();
  }
}

// === End States ===
function onLevelComplete() {
  showModal(levelCompleteModal);
  levelCompleteModal.querySelector('.modal-title').textContent = 'Victory!';
  levelCompleteModal.querySelector('.modal-body').textContent = 'You survived the Starfall Siege. Fairy legend begins.';
  nextLevelBtn.textContent = 'Back to Menu';
  nextLevelBtn.onclick = () => window.location.href = '../../play.html';
}

function onGameOver() {
  showModal(gameOverModal);
  spawnTimer = -1e9;
  weapon.cooldown = Infinity;
  retryBtn.onclick = () => { hideModals(); startLevel(currentLevel); };
}

// === Modal Helpers ===
function showModal(modal) {
  overlayEl.classList.remove('hidden');
  modal.classList.remove('hidden');
}
function hideModals() {
  overlayEl.classList.add('hidden');
  levelCompleteModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');
}

// === Main Game Loop ===
function loop(ts) {
  update(ts);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(ts => { lastTs = ts; loop(ts); });

// === Persist Coins ===
window.addEventListener('beforeunload', () => {
  try {
    localStorage.setItem('tt_gold', String(gold));
    localStorage.setItem('tt_fairy', String(fairy));
  } catch {}
});
window.addEventListener('DOMContentLoaded', () => {
  try {
    const g = localStorage.getItem('tt_gold');
    if (g !== null) { gold = parseInt(g, 10) || gold; goldEl.textContent = gold; }
    const f = localStorage.getItem('tt_fairy');
    if (f !== null) { fairy = parseInt(f, 10) || fairy; fairyEl.textContent = fairy; }
  } catch {}
});
