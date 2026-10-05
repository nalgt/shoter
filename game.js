const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const CONFIG = {
  WORLD: { width: 200, height: 200, depth: 100 },
  SCALE: 2.75,
  CAMERA: {
    fov: 55,
    near: 0.1,
    far: 2000,
  },
};

const state = {
  health: 100,
  maxHealth: 100,
  ammo: 30,
  reserve: 120,
  stamina: 100,
  elapsed: 0,
  objective: 0,
  objectiveLabel: 'FREE FOR ALL',
  objectiveSubtitle: 'Outlast the arena',
  paused: false,
  started: false,
  enemies: [],
};

function updateHUD() {
  const healthValue = document.getElementById('health-value');
  const healthMeter = document.getElementById('health-meter');
  const ammoValue = document.getElementById('ammo-value');
  const reserveValue = document.getElementById('reserve-value');
  const staminaMeter = document.getElementById('stamina-meter');
  const clockValue = document.getElementById('clock-value');
  const objectiveValue = document.getElementById('objective-value');
  const objectiveSubtitle = document.getElementById('objective-subtitle');
  const modeLabel = document.getElementById('mode-label');

  if (healthValue) healthValue.textContent = String(Math.round(state.health));
  if (healthMeter) healthMeter.style.width = `${(state.health / state.maxHealth) * 100}%`;
  if (ammoValue) ammoValue.textContent = String(state.ammo);
  if (reserveValue) reserveValue.textContent = String(state.reserve);
  if (staminaMeter) staminaMeter.style.width = `${state.stamina}%`;
  if (objectiveValue) objectiveValue.innerHTML = `ELIMINATIONS <b>${state.objective}</b>`;
  if (objectiveSubtitle) objectiveSubtitle.textContent = state.objectiveSubtitle;
  if (modeLabel) modeLabel.textContent = state.objectiveLabel;

  const seconds = Math.floor(state.elapsed);
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  if (clockValue) clockValue.textContent = `${minutes}:${remainingSeconds}`;
}

function buildEnemies(amount) {
  return Array.from({ length: amount }, (_, index) => ({
    id: index,
    x: Math.random() * CONFIG.WORLD.width - CONFIG.WORLD.width / 2,
    y: Math.random() * CONFIG.WORLD.height - CONFIG.WORLD.height / 2,
    radius: 10 + Math.random() * 12,
    speed: 0.6 + Math.random() * 0.8,
    hue: 10 + index * 17,
  }));
}

function bootGame() {
  const canvas = document.getElementById('game');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const startScreen = document.getElementById('start-screen');
  const pauseButton = document.getElementById('pause-button');
  const onlineIndicator = document.getElementById('online-indicator');

  if (startScreen) {
    const playButton = startScreen.querySelector('button, .button, [data-action="play"]');
    if (playButton) {
      playButton.addEventListener('click', () => {
        state.started = true;
        startScreen.classList.add('hidden');
        stateset();
      });
    }
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      state.paused = !state.paused;
      pauseButton.textContent = state.paused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('title', state.paused ? 'Resume game' : 'Pause');
      if (onlineIndicator) {
        onlineIndicator.textContent = state.paused ? 'BOT MATCH · PAUSED' : 'BOT MATCH · 3D';
      }
    });
  }

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  state.enemies = buildEnemies(12);
  updateHUD();

  const render = (timestamp) => {
    const time = timestamp / 1000;

    if (!state.paused) {
      state.elapsed += 0.016;
      state.stamina = clamp(state.stamina + 0.2, 0, 100);
      state.health = clamp(state.health - 0.02, 0, state.maxHealth);

      if (state.started) {
        state.enemies.forEach((enemy) => {
          enemy.x += Math.sin(time + enemy.id) * enemy.speed * 0.12;
          enemy.y += Math.cos(time * 0.8 + enemy.id) * enemy.speed * 0.12;
        });
      }
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0d1620';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const gridSize = 24;

    for (let x = 0; x < w; x += gridSize) {
      for (let y = 0; y < h; y += gridSize) {
        ctx.strokeStyle = 'rgba(127, 193, 255, 0.05)';
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    }

    ctx.beginPath();
    ctx.fillStyle = '#2dd4bf';
    ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
    ctx.fill();

    state.enemies.forEach((enemy) => {
      const px = centerX + enemy.x * 4;
      const py = centerY + enemy.y * 4;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${enemy.hue}, 85%, 65%, 0.9)`;
      ctx.arc(px, py, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.fillStyle = '#f8fafc';
    ctx.arc(centerX + 60, centerY - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i += 1) {
      const x = centerX + Math.cos(time * 1.2 + i) * 120;
      const y = centerY + Math.sin(time * 1.3 + i) * 80;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
      ctx.arc(x, y, 18 + i * 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    updateHUD();
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

function stateset() {
  if (state.started) {
    state.objective = 0;
    state.objectiveSubtitle = 'Sweep the arena';
    state.objectiveLabel = 'SURVIVE';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame, { once: true });
} else {
  bootGame();
}
