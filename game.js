const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startButton = document.getElementById("start-button");

const scale = canvas.height / 640;

const config = {
  gravity: 0.38 * scale,
  flapPower: -7 * scale,
  pipeGap: 170 * scale,
  pipeWidth: 72 * scale,
  pipeSpeed: 2.45 * scale,
  pipeSpacing: 245 * scale,
  groundHeight: 92 * scale,
};

const powerupConfig = {
  durationFrames: 60 * 3,
  speedBoost: 1.12,
  pipeSlowdown: 0.88,
  gapBonus: 28 * scale,
  spawnMinFrames: 320,
  spawnJitterFrames: 220,
  width: 18 * scale,
  height: 18 * scale,
};

const game = {
  state: "ready",
  angel: {
    x: 112 * scale,
    y: canvas.height / 2,
    width: 42 * scale,
    height: 32 * scale,
    velocity: 0,
  },
  pipes: [],
  score: 0,
  bestScore: Number(localStorage.getItem("skyhopper-best") || 0),
  bubbles: [],
  powerups: [],
  boostUntil: 0,
  nextPowerupAt: 0,
  frameId: null,
  elapsed: 0,
};

bestScoreEl.textContent = String(game.bestScore);

function updateScore() {
  scoreEl.textContent = String(game.score);
}

function isBoostActive() {
  return game.elapsed < game.boostUntil;
}

function getPipeSpeed() {
  return config.pipeSpeed * (isBoostActive() ? powerupConfig.pipeSlowdown : 1);
}

function getPipeGap() {
  return config.pipeGap + (isBoostActive() ? powerupConfig.gapBonus : 0);
}

function getFlapPower() {
  return config.flapPower * (isBoostActive() ? powerupConfig.speedBoost : 1);
}

function getGravity() {
  return config.gravity * (isBoostActive() ? powerupConfig.speedBoost : 1);
}

function scheduleNextPowerup() {
  const jitter = Math.floor(Math.random() * powerupConfig.spawnJitterFrames);
  game.nextPowerupAt = game.elapsed + powerupConfig.spawnMinFrames + jitter;
}

function showOverlay(title, text, buttonLabel) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonLabel;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetRound() {
  game.state = "running";
  game.angel.y = canvas.height / 2;
  game.angel.velocity = 0;
  game.pipes = [];
  game.powerups = [];
  game.boostUntil = 0;
  game.score = 0;
  game.elapsed = 0;
  scheduleNextPowerup();
  updateScore();
  hideOverlay();
}

function flap() {
  if (game.state === "ready") {
    resetRound();
  }

  if (game.state === "gameover") {
    return;
  }

  game.angel.velocity = getFlapPower();
}

function createPipe() {
  const minTop = 70 * scale;
  const gap = getPipeGap();
  const maxTop = canvas.height - config.groundHeight - gap - 70 * scale;
  const topHeight = minTop + Math.random() * (maxTop - minTop);

  game.pipes.push({
    x: canvas.width + 10,
    topHeight,
    gap,
    counted: false,
  });
}

function spawnPowerup() {
  const yMin = 40 * scale;
  const yMax = canvas.height - config.groundHeight - 46 * scale;
  game.powerups.push({
    x: canvas.width + 30,
    y: yMin + Math.random() * (yMax - yMin),
    width: powerupConfig.width,
    height: powerupConfig.height,
    wobble: Math.random() * Math.PI * 2,
  });
}

function updatePowerups() {
  if (game.elapsed >= game.nextPowerupAt) {
    spawnPowerup();
    scheduleNextPowerup();
  }

  const pipeSpeed = getPipeSpeed();
  for (const powerup of game.powerups) {
    powerup.x -= pipeSpeed;
    powerup.wobble += 0.08;
    powerup.y += Math.sin(powerup.wobble) * 0.35;
  }

  game.powerups = game.powerups.filter((powerup) => powerup.x + powerup.width > -20);
}

function collectPowerups() {
  for (let i = game.powerups.length - 1; i >= 0; i -= 1) {
    const powerup = game.powerups[i];
    if (intersects(game.angel, powerup)) {
      game.powerups.splice(i, 1);
      game.boostUntil = Math.max(game.boostUntil, game.elapsed) + powerupConfig.durationFrames;
    }
  }
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function spawnBubble(initial = false) {
  const yMin = 38;
  const yMax = canvas.height - config.groundHeight - 24;
  game.bubbles.push({
    x: initial ? Math.random() * canvas.width : canvas.width + 12,
    y: yMin + Math.random() * (yMax - yMin),
    radius: 6 + Math.random() * 14,
    speed: 0.35 + Math.random() * 0.55,
    wobble: Math.random() * Math.PI * 2,
    tint: Math.random() > 0.5 ? "pink" : "blue",
  });
}

function updateBubbles() {
  while (game.bubbles.length < 14) {
    spawnBubble(game.state !== "running");
  }

  for (const bubble of game.bubbles) {
    const flow = game.state === "running" ? config.pipeSpeed * 0.24 : 0.4;
    bubble.x -= bubble.speed + flow;
    bubble.wobble += 0.04;
    bubble.y += Math.sin(bubble.wobble) * 0.24;
  }

  game.bubbles = game.bubbles.filter((bubble) => bubble.x + bubble.radius > -20);
}

function endGame() {
  game.state = "gameover";

  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    localStorage.setItem("skyhopper-best", String(game.bestScore));
    bestScoreEl.textContent = String(game.bestScore);
  }

  showOverlay(
    "Crashed!",
    `You scored ${game.score}. Keep hopping and beat ${game.bestScore}.`,
    "Play Again"
  );
}

function update() {
  if (game.state !== "running") {
    return;
  }

  game.elapsed += 1;
  updateBubbles();
  updatePowerups();
  collectPowerups();

  const pipeSpeed = getPipeSpeed();

  if (game.elapsed % Math.floor(config.pipeSpacing / pipeSpeed) === 0) {
    createPipe();
  }

  game.angel.velocity += getGravity();
  game.angel.y += game.angel.velocity;

  const groundY = canvas.height - config.groundHeight;
  if (game.angel.y + game.angel.height >= groundY || game.angel.y <= 0) {
    endGame();
    return;
  }

  for (const pipe of game.pipes) {
    pipe.x -= pipeSpeed;

    if (!pipe.counted && pipe.x + config.pipeWidth < game.angel.x) {
      pipe.counted = true;
      game.score += 1;
      updateScore();
    }

    const topRect = {
      x: pipe.x,
      y: 0,
      width: config.pipeWidth,
      height: pipe.topHeight,
    };

    const bottomRect = {
      x: pipe.x,
      y: pipe.topHeight + pipe.gap,
      width: config.pipeWidth,
      height: canvas.height,
    };

    if (intersects(game.angel, topRect) || intersects(game.angel, bottomRect)) {
      endGame();
      return;
    }
  }

  game.pipes = game.pipes.filter((pipe) => pipe.x + config.pipeWidth > -10);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fdf3ff");
  gradient.addColorStop(0.46, "#e7f8ff");
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Radial gradient halo effects
  const haloGrad = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.2, 10, canvas.width * 0.2, canvas.height * 0.2, 150);
  haloGrad.addColorStop(0, "rgba(255, 200, 240, 0.15)");
  haloGrad.addColorStop(1, "rgba(255, 200, 240, 0)");
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const haloGrad2 = ctx.createRadialGradient(canvas.width * 0.85, canvas.height * 0.3, 10, canvas.width * 0.85, canvas.height * 0.3, 140);
  haloGrad2.addColorStop(0, "rgba(169, 231, 255, 0.12)");
  haloGrad2.addColorStop(1, "rgba(169, 231, 255, 0)");
  ctx.fillStyle = haloGrad2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative striped pattern
  ctx.fillStyle = "rgba(255, 221, 243, 0.2)";
  for (let y = 0; y < canvas.height; y += 6) {
    ctx.fillRect(0, y, 58, 3);
  }

  // Scrolling clouds like dinosaur game
  const cloudSpeed = 1.5 * scale;
  const cloudOffset = (game.elapsed * cloudSpeed) % (canvas.width + 200);

  // Function to draw a cloud
  const drawCloud = (x, y, opacity) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 36 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 31 * scale, y, 32 * scale, 17 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 16 * scale, y - 19 * scale, 34 * scale, 19 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw multiple clouds in a repeating pattern
  const clouds = [
    { initialX: 60, y: 60 * scale, opacity: 0.75 },
    { initialX: 280, y: 100 * scale, opacity: 0.65 },
    { initialX: 480, y: 50 * scale, opacity: 0.7 },
    { initialX: 680, y: 120 * scale, opacity: 0.8 },
  ];

  for (const cloud of clouds) {
    const cloudX = cloud.initialX - cloudOffset;
    
    // Draw cloud and its repeat to the right for seamless looping
    drawCloud(cloudX, cloud.y, cloud.opacity);
    drawCloud(cloudX + canvas.width + 200, cloud.y, cloud.opacity);
  }

  // Sparkling stars/twinkles
  const drawStar = (cx, cy, size, opacity) => {
    const twinkle = Math.sin(game.elapsed * 0.15 + cx) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * twinkle})`;
    ctx.fillRect(cx - size, cy, size * 2, size);
    ctx.fillRect(cx, cy - size, size, size * 2);
  };

  drawStar(48 * scale, 65 * scale, 3 * scale, 0.9);
  drawStar(365 * scale, 140 * scale, 2 * scale, 0.7);
  drawStar(120 * scale, 50 * scale, 2 * scale, 0.8);
  drawStar(300 * scale, 40 * scale, 2.5 * scale, 0.75);

  // Hearts scattered around
  const drawHeart = (hx, hy, hsize, hcolor) => {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.fillStyle = hcolor;
    
    // Simple pixelated heart
    const s = hsize;
    ctx.fillRect(-s, 0, s, s);
    ctx.fillRect(0, 0, s, s);
    ctx.fillRect(-s/2, -s, s/2, s);
    ctx.fillRect(s/2, -s, s/2, s);
    ctx.fillRect(-s/2, s, s, s/2);
    
    ctx.restore();
  };

  const heartBob = (idx) => Math.sin(game.elapsed * 0.08 + idx) * 3;
  drawHeart(60 * scale, 200 * scale + heartBob(0), 6 * scale, "rgba(255, 172, 223, 0.5)");
  drawHeart(340 * scale, 210 * scale + heartBob(1), 5 * scale, "rgba(169, 200, 255, 0.45)");
  drawHeart(180 * scale, 50 * scale + heartBob(2), 4 * scale, "rgba(255, 182, 227, 0.4)");

  // Original sparkle animation
  const sparkleY = 65 * scale + Math.sin(game.elapsed * 0.08) * (5 * scale);
  ctx.fillStyle = "rgba(255, 255, 200, 0.8)";
  ctx.fillRect(48 * scale, sparkleY, 2 * scale, 8 * scale);
  ctx.fillRect(45 * scale, sparkleY + 3 * scale, 8 * scale, 2 * scale);
  ctx.fillRect(364 * scale, sparkleY + 74 * scale, 2 * scale, 8 * scale);
  ctx.fillRect(361 * scale, sparkleY + 77 * scale, 8 * scale, 2 * scale);

  // Pink floating accent
  ctx.fillStyle = "rgba(255, 172, 223, 0.45)";
  ctx.beginPath();
  ctx.arc(70 * scale, 185 * scale + heartBob(3), 8 * scale, 0, Math.PI * 2);
  ctx.arc(84 * scale, 183 * scale + heartBob(4), 7 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(63 * scale, 186 * scale);
  ctx.lineTo(77 * scale, 203 * scale);
  ctx.lineTo(91 * scale, 186 * scale);
  ctx.closePath();
  ctx.fill();

  // Bubble particles
  for (const bubble of game.bubbles) {
    const bubbleGrad = ctx.createRadialGradient(
      bubble.x - bubble.radius * 0.35,
      bubble.y - bubble.radius * 0.35,
      bubble.radius * 0.2,
      bubble.x,
      bubble.y,
      bubble.radius
    );

    if (bubble.tint === "pink") {
      bubbleGrad.addColorStop(0, "rgba(255, 237, 248, 0.8)");
      bubbleGrad.addColorStop(1, "rgba(255, 182, 227, 0.4)");
    } else {
      bubbleGrad.addColorStop(0, "rgba(238, 252, 255, 0.82)");
      bubbleGrad.addColorStop(1, "rgba(171, 231, 255, 0.4)");
    }

    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.radius * 0.32, bubble.y - bubble.radius * 0.35, bubble.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipes() {
  for (const pipe of game.pipes) {
    const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + config.pipeWidth, 0);
    pipeGradient.addColorStop(0, "#ffd1ed");
    pipeGradient.addColorStop(0.52, "#c5efff");
    pipeGradient.addColorStop(1, "#e2d3ff");

    ctx.fillStyle = pipeGradient;
    ctx.fillRect(pipe.x, 0, config.pipeWidth, pipe.topHeight);
    ctx.fillRect(
      pipe.x,
      pipe.topHeight + pipe.gap,
      config.pipeWidth,
      canvas.height - (pipe.topHeight + pipe.gap)
    );

    // Enhanced caps with gradient
    const capGrad = ctx.createLinearGradient(pipe.x, pipe.topHeight - 18, pipe.x, pipe.topHeight);
    capGrad.addColorStop(0, "#7860b8");
    capGrad.addColorStop(1, "#9788dc");
    ctx.fillStyle = capGrad;
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 18, config.pipeWidth + 8, 18);
    ctx.fillRect(pipe.x - 4, pipe.topHeight + pipe.gap, config.pipeWidth + 8, 18);

    // Highlight strip
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(pipe.x + 9, 0, 5, pipe.topHeight);
    ctx.fillRect(
      pipe.x + 9,
      pipe.topHeight + pipe.gap,
      5,
      canvas.height - (pipe.topHeight + pipe.gap)
    );

    // Decorative dots on pipes
    ctx.fillStyle = "rgba(255, 182, 223, 0.3)";
    for (let py = 0; py < pipe.topHeight; py += 25) {
      ctx.fillRect(pipe.x + 20, py + 10, 4, 4);
    }
    for (let py = pipe.topHeight + pipe.gap; py < canvas.height; py += 25) {
      ctx.fillRect(pipe.x + 20, py + 10, 4, 4);
    }
  }
}

function drawPowerups() {
  for (const powerup of game.powerups) {
    const cx = powerup.x + powerup.width / 2;
    const cy = powerup.y + powerup.height / 2;
    const pulse = Math.sin(game.elapsed * 0.2 + powerup.wobble) * 0.5 + 0.5;

    const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, powerup.width * 1.4);
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.4 + pulse * 0.28})`);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, powerup.width * 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff0a6";
    ctx.beginPath();
    ctx.moveTo(cx, cy - powerup.height * 0.55);
    ctx.lineTo(cx + powerup.width * 0.22, cy - powerup.height * 0.15);
    ctx.lineTo(cx + powerup.width * 0.6, cy - powerup.height * 0.12);
    ctx.lineTo(cx + powerup.width * 0.3, cy + powerup.height * 0.1);
    ctx.lineTo(cx + powerup.width * 0.38, cy + powerup.height * 0.52);
    ctx.lineTo(cx, cy + powerup.height * 0.27);
    ctx.lineTo(cx - powerup.width * 0.38, cy + powerup.height * 0.52);
    ctx.lineTo(cx - powerup.width * 0.3, cy + powerup.height * 0.1);
    ctx.lineTo(cx - powerup.width * 0.6, cy - powerup.height * 0.12);
    ctx.lineTo(cx - powerup.width * 0.22, cy - powerup.height * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(cx - powerup.width * 0.05, cy - powerup.height * 0.36, powerup.width * 0.1, powerup.height * 0.26);
  }
}

function drawGround() {
  const y = canvas.height - config.groundHeight;
  const floorGrad = ctx.createLinearGradient(0, y, 0, canvas.height);
  floorGrad.addColorStop(0, "#f7e8ff");
  floorGrad.addColorStop(1, "#d8f1ff");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, y, canvas.width, config.groundHeight);

  // Horizontal line pattern
  ctx.fillStyle = "rgba(144, 126, 212, 0.3)";
  for (let yy = y + 8; yy < canvas.height; yy += 10) {
    ctx.fillRect(0, yy, canvas.width, 2);
  }

  // Pixelated ground blocks
  ctx.fillStyle = "#fffbff";
  for (let x = 6; x < canvas.width; x += 28) {
    ctx.fillRect(x, y + 16, 10, 10);
    ctx.fillRect(x + 4, y + 33, 10, 10);
    ctx.fillRect(x + 10, y + 50, 10, 10);
  }

  // Add decorative pixel elements
  ctx.fillStyle = "rgba(255, 182, 227, 0.3)";
  for (let x = 15; x < canvas.width; x += 35) {
    ctx.fillRect(x, y + 5, 4, 4);
    ctx.fillRect(x + 8, y + 60, 4, 4);
  }

  ctx.fillStyle = "rgba(169, 231, 255, 0.25)";
  for (let x = 25; x < canvas.width; x += 35) {
    ctx.fillRect(x, y + 25, 3, 3);
    ctx.fillRect(x + 12, y + 70, 3, 3);
  }
}

function drawAngelSparkleTrail() {
  const { x, y, width, height, velocity } = game.angel;
  const pixel = Math.max(1, Math.round(width / 14));
  const baseX = x - 3 * pixel;
  const baseY = y + height * 0.55;
  const speedGlow = Math.min(1, Math.abs(velocity) / (7 * scale));
  const sparkles = [
    { ox: 0, oy: -3, s: 1, c: "#fff8ff" },
    { ox: -2, oy: -1, s: 1, c: "#ffd6ef" },
    { ox: -4, oy: 2, s: 2, c: "#bfeeff" },
    { ox: -7, oy: 0, s: 1, c: "#fff8ff" },
    { ox: -9, oy: 3, s: 1, c: "#ffdbf3" },
  ];

  for (let i = 0; i < sparkles.length; i += 1) {
    const sp = sparkles[i];
    const twinkle = ((game.elapsed + i * 7) % 18) < 9 ? 1 : 0.7;
    const drift = (game.elapsed % 6) * 0.15;
    ctx.globalAlpha = (0.38 + speedGlow * 0.34) * twinkle;
    ctx.fillStyle = sp.c;
    ctx.fillRect(
      baseX + sp.ox * pixel - drift * i,
      baseY + sp.oy * pixel + Math.sin((game.elapsed + i) * 0.2) * pixel * 0.25,
      sp.s * pixel,
      sp.s * pixel
    );
  }

  ctx.globalAlpha = 1;
}

function drawAngel() {
  const { x, y, width, height, velocity } = game.angel;
  const unit = Math.max(1, Math.round(width / 12));
  const bob = Math.sin(game.elapsed * 0.2) * 0.5;

  const pRect = (gx, gy, gw, gh, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(gx * unit, gy * unit, gw * unit, gh * unit);
  };

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2 + bob);
  ctx.translate(-6 * unit, -7 * unit);

  // Purple heart - clean and symmetrical
  const heartColor = "#b387d8";
  const heartLight = "#d4b3e8";

  // Top left lobe
  pRect(2, 0, 2, 1, heartColor);
  pRect(1, 1, 4, 1, heartColor);
  pRect(1, 2, 4, 1, heartColor);

  // Top right lobe
  pRect(8, 0, 2, 1, heartColor);
  pRect(7, 1, 4, 1, heartColor);
  pRect(7, 2, 4, 1, heartColor);

  // Main body
  pRect(1, 3, 10, 2, heartColor);

  // Bottom narrowing
  pRect(2, 5, 8, 1, heartColor);
  pRect(3, 6, 6, 1, heartColor);
  pRect(4, 7, 4, 1, heartColor);
  pRect(5, 8, 2, 1, heartColor);

  // Highlights for shine
  pRect(2, 1, 1, 1, heartLight);
  pRect(9, 1, 1, 1, heartLight);

  ctx.restore();
}

function drawReadyHint() {
  if (game.state !== "ready") {
    return;
  }

  ctx.fillStyle = "rgba(98, 72, 183, 0.26)";
  ctx.font = "700 24px VT323";
  ctx.textAlign = "center";
  ctx.fillText("PRESS TO FLOAT", canvas.width / 2, canvas.height / 2 + 130);
}

function render() {
  drawBackground();
  drawPipes();
  drawPowerups();
  drawGround();
  drawAngelSparkleTrail();
  drawAngel();
  drawReadyHint();
}

function gameLoop() {
  update();
  render();
  game.frameId = requestAnimationFrame(gameLoop);
}

function handleInput(event) {
  if (event.type === "keydown") {
    const isFlapKey = [" ", "ArrowUp", "w", "W"].includes(event.key);
    if (!isFlapKey) {
      return;
    }
    event.preventDefault();
  }

  flap();
}

startButton.addEventListener("click", () => {
  if (game.state !== "running") {
    resetRound();
  }
});

window.addEventListener("keydown", handleInput);
canvas.addEventListener("pointerdown", handleInput);

showOverlay("Tap or Press Space", "Guide your angel through every dreamy gate and grab star boosts.", "Start Game");
for (let i = 0; i < 14; i += 1) {
  spawnBubble(true);
}
gameLoop();
