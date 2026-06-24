const TILE_SIZE = 24;
const MOVE_DELAY = 150;
const SPRINT_DELAY = 85;

const state = {
  started: false,
  hp: 20,
  maxHp: 20,
  echoes: 0,
  roomId: "null-transit",
  player: { x: 8, y: 6 },
  memoryRecovered: new Set(),
  noticeSeen: new Set(),
  battle: null,
  endingShown: false,
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
  },
  lastMoveTime: 0,
  lastHazardTrigger: 0,
  quests: [
    {
      id: "main",
      title: "Restore the scattered memories (6)",
      progress: 0,
      goal: 6,
      complete: false,
    },
    {
      id: "dream",
      title: "Search the Dreamspace route",
      progress: 0,
      goal: 3,
      complete: false,
    },
    {
      id: "liminal",
      title: "Search the Liminal route",
      progress: 0,
      goal: 3,
      complete: false,
    },
  ],
};

const roomHazards = {
  "velvet-sea": [
    { x: 4, y: 2 },
    { x: 8, y: 5 },
  ],
  "glass-orchard": [
    { x: 4, y: 4 },
    { x: 9, y: 2 },
  ],
  "murmur-library": [
    { x: 5, y: 3 },
    { x: 9, y: 3 },
  ],
  "yellow-hall": [
    { x: 11, y: 4 },
    { x: 5, y: 9 },
  ],
  "silent-arcade": [
    { x: 9, y: 4 },
    { x: 6, y: 9 },
  ],
  "rooftop-lot": [
    { x: 11, y: 6 },
    { x: 6, y: 4 },
  ],
};

const rooms = {
  "null-transit": {
    dimension: "Null Transit",
    description: "A station in fractured starlight. Dream and liminal gates pulse in opposite rhythms.",
    map: [
      "################",
      "#......P.......#",
      "#..............#",
      "#....N.........#",
      "#..............#",
      "#..............#",
      "#..............#",
      "#..............#",
      "#..............#",
      "#.......P......#",
      "#..............#",
      "################",
    ],
    spawn: { x: 8, y: 6 },
    portals: [
      { x: 7, y: 1, to: "velvet-sea", spawn: { x: 2, y: 9 } },
      { x: 8, y: 9, to: "yellow-hall", spawn: { x: 12, y: 2 } },
    ],
    notices: [
      {
        x: 5,
        y: 3,
        id: "transit-note",
        text: "Noticeboard fragment: \"When the Archive forgets, names collapse first. Protect your own.\"",
      },
    ],
    memories: [],
  },
  "velvet-sea": {
    dimension: "Dreamspace - Velvet Sea",
    description: "Midnight cloth waves under your boots. A lighthouse blinks backwards.",
    map: [
      "################",
      "#....~......P..#",
      "#..~~~~........#",
      "#...~~.....M...#",
      "#..............#",
      "#......~~~.....#",
      "#..............#",
      "#......N.......#",
      "#..............#",
      "#P.............#",
      "#..............#",
      "################",
    ],
    spawn: { x: 2, y: 9 },
    portals: [
      { x: 1, y: 9, to: "null-transit", spawn: { x: 7, y: 2 } },
      { x: 12, y: 1, to: "glass-orchard", spawn: { x: 2, y: 8 } },
    ],
    notices: [
      {
        x: 7,
        y: 7,
        id: "velvet-note",
        text: "The sea whispers: \"Forgotten songs become weather.\"",
      },
    ],
    memories: [
      {
        x: 10,
        y: 3,
        id: "tide-memory",
        text: "Memory recovered: Your mother humming while repairing a broken radio.",
        enemy: {
          name: "Cherub of Lullabies",
          appearance: "A halo of static feathers hums over porcelain wings.",
          hp: 10,
          mercyAct: 35,
          damage: [1, 3],
        },
      },
    ],
  },
  "glass-orchard": {
    dimension: "Dreamspace - Glass Orchard",
    description: "Mirror-trees ring like tiny bells. Every fruit reflects a life you almost lived.",
    map: [
      "################",
      "#P.....*.......#",
      "#...*......*...#",
      "#......M.......#",
      "#...*..........#",
      "#..............#",
      "#.......N......#",
      "#..............#",
      "#..P...........#",
      "#..............#",
      "#..............#",
      "################",
    ],
    spawn: { x: 2, y: 8 },
    portals: [
      { x: 1, y: 1, to: "velvet-sea", spawn: { x: 11, y: 2 } },
      { x: 3, y: 8, to: "murmur-library", spawn: { x: 12, y: 2 } },
    ],
    notices: [
      {
        x: 8,
        y: 6,
        id: "orchard-note",
        text: "A cracked mirror reads: \"Every version of you wants to be remembered.\"",
      },
    ],
    memories: [
      {
        x: 7,
        y: 3,
        id: "orchard-memory",
        text: "Memory recovered: The first lie you told to protect a friend.",
        enemy: {
          name: "Mirror Seraph",
          appearance: "Crystalline wings refract your reflection into a choir.",
          hp: 12,
          mercyAct: 30,
          damage: [2, 4],
        },
      },
    ],
  },
  "murmur-library": {
    dimension: "Dreamspace - Murmur Library",
    description: "Shelves whisper unfinished names. Dust glows like fireflies trapped in thought.",
    map: [
      "################",
      "#......P.......#",
      "#...........P..#",
      "#...MMMM.......#",
      "#..............#",
      "#.....N........#",
      "#..............#",
      "#......M.......#",
      "#..............#",
      "#..............#",
      "#..............#",
      "################",
    ],
    spawn: { x: 12, y: 2 },
    portals: [
      { x: 7, y: 1, to: "null-transit", spawn: { x: 8, y: 8 } },
      { x: 12, y: 2, to: "glass-orchard", spawn: { x: 4, y: 7 } },
    ],
    notices: [
      {
        x: 6,
        y: 5,
        id: "library-note",
        text: "A catalog card says: \"If no one remembers the ending, does the story restart?\"",
      },
    ],
    memories: [
      {
        x: 7,
        y: 7,
        id: "library-memory",
        text: "Memory recovered: A city map where your old home was never erased.",
        enemy: {
          name: "Archivangel",
          appearance: "Ink-black wings cradle a burning ring of scripture.",
          hp: 14,
          mercyAct: 28,
          damage: [2, 5],
        },
      },
    ],
  },
  "yellow-hall": {
    dimension: "Liminal - Yellow Hall",
    description: "A pastel corridor of soft monitor glow, halos, and humming ceiling light like a sleeping desktop.",
    map: [
      "################",
      "#..P..W...H....#",
      "#...+.....N....#",
      "#..W....O......#",
      "#......M...H...#",
      "#....E.....W...#",
      "#..............#",
      "#.......P...O..#",
      "#..............#",
      "#..H...W.......#",
      "#..............#",
      "################",
    ],
    spawn: { x: 12, y: 2 },
    portals: [
      { x: 3, y: 1, to: "null-transit", spawn: { x: 8, y: 8 } },
      { x: 8, y: 7, to: "silent-arcade", spawn: { x: 3, y: 9 } },
    ],
    notices: [
      {
        x: 10,
        y: 2,
        id: "hall-note",
        text: "A flickering sign says: \"THIS FLOOR STILL THINKS YOU ARE A STUDENT.\"",
      },
    ],
    memories: [
      {
        x: 7,
        y: 4,
        id: "hall-memory",
        text: "Memory recovered: A school hallway right before graduation rain.",
        enemy: {
          name: "Halo Custodian",
          appearance: "An office angel with fluorescent wings and a shattered halo.",
          hp: 11,
          mercyAct: 33,
          damage: [1, 4],
        },
      },
    ],
  },
  "silent-arcade": {
    dimension: "Liminal - Silent Arcade",
    description: "An idle feed room where old UI windows float like prayers and hearts blink in pixel static.",
    map: [
      "################",
      "#..............#",
      "#..A..W..A..H..#",
      "#...+..N..E....#",
      "#..A..M..A..O..#",
      "#..............#",
      "#....A..W......#",
      "#..H........P..#",
      "#..............#",
      "#..P...E.......#",
      "#..............#",
      "################",
    ],
    spawn: { x: 3, y: 9 },
    portals: [
      { x: 3, y: 9, to: "yellow-hall", spawn: { x: 7, y: 6 } },
      { x: 12, y: 7, to: "rooftop-lot", spawn: { x: 2, y: 9 } },
    ],
    notices: [
      {
        x: 7,
        y: 3,
        id: "arcade-note",
        text: "An attract screen flashes: \"INSERT MEMORY TO CONTINUE.\"",
      },
    ],
    memories: [
      {
        x: 6,
        y: 4,
        id: "arcade-memory",
        text: "Memory recovered: The sound of your laugh when you were ten.",
        enemy: {
          name: "Cathedral Idol",
          appearance: "Neon wings fold around a heart-shaped relic core.",
          hp: 13,
          mercyAct: 32,
          damage: [2, 4],
        },
      },
    ],
  },
  "rooftop-lot": {
    dimension: "Liminal - Rooftop Lot",
    description: "A lavender rooftop shrine with wire silhouettes, halo pools, and postcard-soft sky haze.",
    map: [
      "################",
      "#..W...^..O....#",
      "#....+.....W...#",
      "#....N...H.....#",
      "#......E.......#",
      "#..............#",
      "#.......M..O...#",
      "#..............#",
      "#..............#",
      "#..P...W.......#",
      "#..............#",
      "################",
    ],
    spawn: { x: 2, y: 9 },
    portals: [
      { x: 3, y: 9, to: "silent-arcade", spawn: { x: 11, y: 7 } },
      { x: 7, y: 1, to: "null-transit", spawn: { x: 8, y: 3 } },
    ],
    notices: [
      {
        x: 5,
        y: 3,
        id: "roof-note",
        text: "A windless voice says: \"Parking lots are waiting rooms for forgotten futures.\"",
      },
    ],
    memories: [
      {
        x: 8,
        y: 6,
        id: "rooftop-memory",
        text: "Memory recovered: A promise to remember every world that helped you survive.",
        enemy: {
          name: "Parking Seraph",
          appearance: "A silver halo hovers above winged asphalt and radio snow.",
          hp: 15,
          mercyAct: 30,
          damage: [2, 5],
        },
      },
    ],
  },
};

const el = {
  canvas: document.getElementById("game-canvas"),
  dimensionName: document.getElementById("dimension-name"),
  playerHp: document.getElementById("player-hp"),
  echoCount: document.getElementById("echo-count"),
  memoryCount: document.getElementById("memory-count"),
  storyFeed: document.getElementById("story-feed"),
  questList: document.getElementById("quest-list"),
  locationText: document.getElementById("location-text"),
  choiceButtons: document.getElementById("choice-buttons"),
  battlePanel: document.getElementById("battle-panel"),
  enemyStatus: document.getElementById("enemy-status"),
  battleButtons: document.getElementById("battle-buttons"),
  enemyPortrait: document.getElementById("enemy-portrait"),
  mercyMeter: document.getElementById("mercy-meter"),
  startButton: document.getElementById("start-button"),
  restartButton: document.getElementById("restart-button"),
  howToButton: document.getElementById("howto-button"),
  closeMenuButton: document.getElementById("close-menu-button"),
  helpMenu: document.getElementById("help-menu"),
};

const ctx = el.canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const enemyCtx = el.enemyPortrait.getContext("2d");
enemyCtx.imageSmoothingEnabled = false;

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function randomRange([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentRoom() {
  return rooms[state.roomId];
}

function getRoomHazards(roomId) {
  return roomHazards[roomId] || [];
}

function isLiminalRoute(roomId) {
  return roomId === "yellow-hall" || roomId === "silent-arcade" || roomId === "rooftop-lot";
}

function logStory(text, style = "") {
  const entry = document.createElement("p");
  entry.className = `story-entry ${style}`.trim();
  entry.textContent = text;
  el.storyFeed.prepend(entry);
}

function updateHud() {
  const room = getCurrentRoom();
  el.dimensionName.textContent = room.dimension;
  el.playerHp.textContent = `${state.hp} / ${state.maxHp}`;
  el.echoCount.textContent = String(state.echoes);
  el.memoryCount.textContent = `${state.memoryRecovered.size} / 6`;
  el.locationText.textContent = room.description;
}

function updateQuests() {
  const mainQuest = state.quests.find((q) => q.id === "main");
  const dreamQuest = state.quests.find((q) => q.id === "dream");
  const liminalQuest = state.quests.find((q) => q.id === "liminal");

  mainQuest.progress = state.memoryRecovered.size;
  mainQuest.complete = mainQuest.progress >= mainQuest.goal;

  dreamQuest.progress = ["tide-memory", "orchard-memory", "library-memory"].filter((id) =>
    state.memoryRecovered.has(id)
  ).length;
  dreamQuest.complete = dreamQuest.progress >= dreamQuest.goal;

  liminalQuest.progress = ["hall-memory", "arcade-memory", "rooftop-memory"].filter((id) =>
    state.memoryRecovered.has(id)
  ).length;
  liminalQuest.complete = liminalQuest.progress >= liminalQuest.goal;

  el.questList.innerHTML = "";
  state.quests.forEach((quest) => {
    const li = document.createElement("li");
    li.className = `quest ${quest.complete ? "complete" : ""}`;
    li.textContent = `${quest.title} - ${quest.progress}/${quest.goal}`;
    el.questList.appendChild(li);
  });
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawOutline(x, y, color) {
  ctx.strokeStyle = color;
  ctx.strokeRect(x * TILE_SIZE + 0.5, y * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
}

const playerSprite = [
  "...1111...",
  "..1hhhh1..",
  ".1hhhhhhi.",
  ".1hfffffh.",
  ".1hfeefh1.",
  ".1hhhhhh1.",
  ".1bwwwwb1.",
  ".1bwwwwb1.",
  "..1wttw1..",
  "..1w11w1..",
  "...1ll1...",
  "...1ll1...",
];

const playerPalette = {
  "1": "#080910",
  h: "#171a25",
  i: "#2d3140",
  f: "#efe6d8",
  e: "#888ca0",
  b: "#0a0b12",
  w: "#f8f8fb",
  t: "#d5d7de",
  l: "#1b1e2b",
};

function drawPlayerSprite(tileX, tileY) {
  const pixelSize = 2;
  const spriteWidth = playerSprite[0].length * pixelSize;
  const spriteHeight = playerSprite.length * pixelSize;
  const baseX = tileX * TILE_SIZE + Math.floor((TILE_SIZE - spriteWidth) / 2);
  const baseY = tileY * TILE_SIZE + Math.floor((TILE_SIZE - spriteHeight) / 2);

  for (let row = 0; row < playerSprite.length; row += 1) {
    for (let col = 0; col < playerSprite[row].length; col += 1) {
      const pixel = playerSprite[row][col];
      if (pixel === ".") {
        continue;
      }
      ctx.fillStyle = playerPalette[pixel] || "#ffffff";
      ctx.fillRect(baseX + col * pixelSize, baseY + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

function drawLiminalDecor(symbol, tileX, tileY) {
  const px = tileX * TILE_SIZE;
  const py = tileY * TILE_SIZE;

  if (symbol === "W") {
    ctx.fillStyle = "#fff5ff";
    ctx.fillRect(px + 3, py + 5, 18, 14);
    ctx.fillStyle = "#bda7f0";
    ctx.fillRect(px + 3, py + 5, 18, 3);
    ctx.fillStyle = "#d8c8fb";
    ctx.fillRect(px + 5, py + 9, 14, 8);
    ctx.fillStyle = "#9f8fdf";
    ctx.fillRect(px + 6, py + 6, 2, 1);
    ctx.fillRect(px + 9, py + 6, 2, 1);
    ctx.fillRect(px + 12, py + 6, 2, 1);
  }

  if (symbol === "H") {
    ctx.fillStyle = "#f27dbe";
    ctx.fillRect(px + 9, py + 8, 6, 6);
    ctx.fillRect(px + 7, py + 10, 10, 4);
    ctx.fillRect(px + 8, py + 14, 8, 3);
    ctx.fillRect(px + 10, py + 17, 4, 2);
    ctx.fillStyle = "#ffd8ef";
    ctx.fillRect(px + 10, py + 9, 2, 2);
  }

  if (symbol === "O") {
    ctx.fillStyle = "#fff4c0";
    ctx.fillRect(px + 5, py + 7, 14, 2);
    ctx.fillRect(px + 4, py + 8, 16, 2);
    ctx.fillRect(px + 5, py + 10, 14, 2);
    ctx.fillStyle = "#f2d4ff";
    ctx.fillRect(px + 8, py + 8, 8, 2);
  }

  if (symbol === "+") {
    ctx.fillStyle = "#8a95c9";
    ctx.fillRect(px + 11, py + 3, 2, 18);
    ctx.fillRect(px + 4, py + 6, 16, 2);
    ctx.fillStyle = "#d7ccfb";
    ctx.fillRect(px + 6, py + 9, 3, 1);
    ctx.fillRect(px + 15, py + 11, 3, 1);
  }

  if (symbol === "E") {
    ctx.fillStyle = "#f5e9ff";
    ctx.fillRect(px + 5, py + 7, 14, 10);
    ctx.fillStyle = "#c1a7f0";
    ctx.fillRect(px + 5, py + 7, 14, 2);
    ctx.fillStyle = "#d4bdf6";
    ctx.fillRect(px + 6, py + 10, 12, 1);
    ctx.fillRect(px + 7, py + 11, 10, 1);
    ctx.fillStyle = "#f09bcf";
    ctx.fillRect(px + 11, py + 12, 2, 2);
  }
}

function drawMemoryMarker(tileX, tileY, recovered, now) {
  const px = tileX * TILE_SIZE;
  const py = tileY * TILE_SIZE;
  const pulse = recovered ? 0 : Math.sin(now / 210) * 1.5;
  const centerX = px + 12;
  const centerY = py + 12;
  const r = recovered ? 6 : 7 + pulse;

  ctx.fillStyle = recovered ? "#2f4f3d" : "#58dff7";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - r);
  ctx.lineTo(centerX + r, centerY);
  ctx.lineTo(centerX, centerY + r);
  ctx.lineTo(centerX - r, centerY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = recovered ? "#9be7b6" : "#e9fdff";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!recovered) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(centerX - 1, centerY - 3, 2, 6);
    ctx.fillRect(centerX - 3, centerY - 1, 6, 2);
  }
}

function drawHazardMarker(tileX, tileY) {
  const px = tileX * TILE_SIZE;
  const py = tileY * TILE_SIZE;

  drawTile(tileX, tileY, "#260d1d");
  ctx.fillStyle = "#6b1f3e";
  ctx.fillRect(px + 4, py + 4, 16, 16);
  ctx.strokeStyle = "#ff87b2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 6, py + 6);
  ctx.lineTo(px + 18, py + 18);
  ctx.moveTo(px + 18, py + 6);
  ctx.lineTo(px + 6, py + 18);
  ctx.stroke();
}

function drawEnemyPortrait(enemy) {
  enemyCtx.clearRect(0, 0, 72, 72);
  enemyCtx.fillStyle = "#140f1e";
  enemyCtx.fillRect(0, 0, 72, 72);

  enemyCtx.fillStyle = "#f8e8ff";
  enemyCtx.fillRect(32, 20, 8, 8);
  enemyCtx.fillRect(26, 28, 20, 16);

  enemyCtx.fillStyle = "#d4b7ff";
  enemyCtx.fillRect(14, 26, 12, 8);
  enemyCtx.fillRect(46, 26, 12, 8);
  enemyCtx.fillRect(10, 34, 16, 6);
  enemyCtx.fillRect(46, 34, 16, 6);

  enemyCtx.fillStyle = "#fff3ae";
  enemyCtx.fillRect(24, 10, 24, 3);
  enemyCtx.fillRect(22, 13, 28, 2);

  enemyCtx.fillStyle = "#ff9ccc";
  enemyCtx.fillRect(34, 32, 2, 2);
  enemyCtx.fillRect(30, 50, 12, 2);

  if (enemy.name.includes("Mirror") || enemy.name.includes("Archivangel")) {
    enemyCtx.fillStyle = "#9beeff";
    enemyCtx.fillRect(19, 22, 3, 3);
    enemyCtx.fillRect(50, 22, 3, 3);
  }
}

function renderWorld(now = 0) {
  const room = getCurrentRoom();
  const map = room.map;
  const liminalRoute = isLiminalRoute(state.roomId);
  const dreamRoute = state.roomId.includes("dream");

  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const symbol = map[y][x];
      let color = liminalRoute ? ((x + y) % 2 === 0 ? "#ecd8f6" : "#f4e4fb") : "#1a2233";

      if (dreamRoute) {
        color = "#21324a";
      }

      if (symbol === "#") {
        color = liminalRoute ? "#9d89d9" : "#0b0f16";
      }
      if (symbol === "~") {
        color = "#2f5b78";
      }
      if (symbol === "*") {
        color = "#4a566e";
      }
      if (symbol === "A") {
        color = "#1f2f33";
      }
      if (symbol === "^") {
        color = "#464553";
      }
      if (symbol === "W") {
        color = "#e7d6f7";
      }
      if (symbol === "H") {
        color = "#f2cbe8";
      }
      if (symbol === "O") {
        color = "#f7edcf";
      }
      if (symbol === "+") {
        color = "#d9cff4";
      }
      if (symbol === "E") {
        color = "#f7dff1";
      }

      drawTile(x, y, color);

      if (symbol === "P") {
        drawTile(x, y, "#a06b3b");
        drawOutline(x, y, "#f5cf8a");
      }
      if (symbol === "N") {
        drawTile(x, y, "#3b5843");
        drawOutline(x, y, "#a8d7b3");
      }

      if (liminalRoute) {
        drawLiminalDecor(symbol, x, y);
      }
    }
  }

  room.memories.forEach((memory) => {
    const recovered = state.memoryRecovered.has(memory.id);
    drawMemoryMarker(memory.x, memory.y, recovered, now);
  });

  getRoomHazards(state.roomId).forEach((hazard) => {
    drawHazardMarker(hazard.x, hazard.y);
  });

  drawPlayerSprite(state.player.x, state.player.y);
}

function isWalkable(x, y) {
  const room = getCurrentRoom();
  if (x < 0 || y < 0 || y >= room.map.length || x >= room.map[0].length) {
    return false;
  }
  return room.map[y][x] !== "#";
}

function findAtCoordinate(list, x, y) {
  return list.find((item) => item.x === x && item.y === y);
}

function tryMove(dx, dy) {
  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;

  if (!isWalkable(nextX, nextY)) {
    return;
  }

  state.player.x = nextX;
  state.player.y = nextY;
  handleTileInteraction();
}

function travelTo(roomId, spawn) {
  state.roomId = roomId;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  updateHud();
  renderWorld();
  logStory(`You enter ${rooms[roomId].dimension}.`);
}

function handleTileInteraction() {
  if (state.battle || !state.started) {
    return;
  }

  const room = getCurrentRoom();
  const portal = findAtCoordinate(room.portals, state.player.x, state.player.y);
  if (portal) {
    travelTo(portal.to, portal.spawn);
    return;
  }

  const notice = findAtCoordinate(room.notices, state.player.x, state.player.y);
  if (notice && !state.noticeSeen.has(notice.id)) {
    state.noticeSeen.add(notice.id);
    state.echoes += 1;
    logStory(notice.text, "event");
    updateHud();
  }

  const memory = findAtCoordinate(room.memories, state.player.x, state.player.y);
  if (memory && !state.memoryRecovered.has(memory.id)) {
    startBattle(memory.enemy, memory.id, memory.text);
    return;
  }

  const hazard = findAtCoordinate(getRoomHazards(state.roomId), state.player.x, state.player.y);
  if (hazard) {
    const now = performance.now();
    if (now - state.lastHazardTrigger > 120) {
      state.lastHazardTrigger = now;
      state.hp = clamp(state.hp - 3, 0, state.maxHp);
      state.echoes = Math.max(0, state.echoes - 1);
      logStory("Corrupted fragment burns your timeline: -3 HP, -1 Echo.", "warning");

      if (state.hp <= 0) {
        logStory("You collapse into static and reassemble at Null Transit.", "warning");
        state.hp = state.maxHp;
        state.battle = null;
        el.battlePanel.hidden = true;
        travelTo("null-transit", rooms["null-transit"].spawn);
      }

      updateHud();
    }
  }
}

function startBattle(enemyTemplate, rewardMemoryId, rewardText) {
  const enemy = {
    name: enemyTemplate.name,
    appearance: enemyTemplate.appearance || "A winged guardian blocks your path.",
    hp: enemyTemplate.hp,
    mercy: 0,
    mercyAct: enemyTemplate.mercyAct,
    damage: enemyTemplate.damage,
    rewardMemoryId,
    rewardText,
  };

  state.battle = enemy;
  el.battlePanel.hidden = false;
  logStory(`${enemy.name} descends with angelic force. ${enemy.appearance}`, "warning");
  renderBattle();
}

function enemyTurn() {
  if (!state.battle) {
    return;
  }

  const hit = randomRange(state.battle.damage);
  state.hp = clamp(state.hp - hit, 0, state.maxHp);
  logStory(`${state.battle.name} strikes for ${hit} damage.`, "warning");

  if (state.hp <= 0) {
    logStory("Your thread unravels. Null Transit stitches your form together.", "warning");
    state.hp = state.maxHp;
    state.battle = null;
    el.battlePanel.hidden = true;
    travelTo("null-transit", rooms["null-transit"].spawn);
  }

  updateHud();
}

function resolveVictory(spared = false) {
  const memoryId = state.battle.rewardMemoryId;
  state.memoryRecovered.add(memoryId);
  state.echoes += spared ? 3 : 2;
  state.hp = clamp(state.hp + 2, 0, state.maxHp);

  logStory(state.battle.rewardText, "event");
  logStory(
    spared
      ? `${state.battle.name} bows and dissolves peacefully.`
      : `${state.battle.name} shatters into soft static and leaves a bright trace.`,
    "event"
  );

  state.battle = null;
  el.battlePanel.hidden = true;
  updateHud();
  updateQuests();
  checkEnding();
  renderWorld();
}

function checkEnding() {
  if (state.memoryRecovered.size < 6 || state.endingShown) {
    return;
  }

  state.endingShown = true;
  logStory("All six memories ignite. The dimensions stop fading and start writing themselves again.", "event");
  logStory("Final choice unlocked: choose what the Archive preserves.", "event");

  const endings = [
    {
      label: "Preserve every painful memory",
      text: "You anchor the worlds with truth. They hurt, but they remain real.",
    },
    {
      label: "Keep only hopeful memories",
      text: "You soften the worlds. They shine, but some warnings are lost forever.",
    },
  ];

  el.choiceButtons.innerHTML = "";
  endings.forEach((ending) => {
    const button = document.createElement("button");
    button.textContent = ending.label;
    button.addEventListener("click", () => {
      logStory(ending.text, "event");
      logStory("Credits: Archive stable. Restart to choose a different fate.", "event");
      el.choiceButtons.innerHTML = "";
    });
    el.choiceButtons.appendChild(button);
  });
}

function renderBattle() {
  if (!state.battle) {
    return;
  }

  el.enemyStatus.textContent = `${state.battle.name} - HP ${state.battle.hp} - ${state.battle.appearance}`;
  drawEnemyPortrait(state.battle);
  el.mercyMeter.style.width = `${state.battle.mercy}%`;
  el.battleButtons.innerHTML = "";

  const actions = [
    {
      label: "Fight",
      run: () => {
        const hit = randomRange([3, 6]);
        state.battle.hp -= hit;
        logStory(`You strike ${state.battle.name} for ${hit}.`);
        if (state.battle.hp <= 0) {
          resolveVictory(false);
          return;
        }
        enemyTurn();
      },
    },
    {
      label: "Act (Recall)",
      run: () => {
        state.battle.mercy = clamp(state.battle.mercy + state.battle.mercyAct, 0, 100);
        logStory(`You share a memory fragment. Mercy rises to ${state.battle.mercy}%.`, "event");
        enemyTurn();
      },
    },
    {
      label: "Focus (+2 HP)",
      run: () => {
        state.hp = clamp(state.hp + 2, 0, state.maxHp);
        logStory("You steady your timeline. +2 HP.", "event");
        enemyTurn();
      },
    },
    {
      label: "Mercy",
      run: () => {
        if (state.battle.mercy >= 100) {
          resolveVictory(true);
        } else {
          logStory("Mercy is not ready. The creature still trembles.");
          enemyTurn();
        }
      },
    },
  ];

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = action.label;
    button.addEventListener("click", () => {
      if (!state.battle) {
        return;
      }
      action.run();
      updateHud();
      updateQuests();
      renderBattle();
      renderWorld();
    });
    el.battleButtons.appendChild(button);
  });
}

function handleMovement(now) {
  if (!state.started || state.battle) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (state.keys.up) dy = -1;
  else if (state.keys.down) dy = 1;
  else if (state.keys.left) dx = -1;
  else if (state.keys.right) dx = 1;

  if (dx === 0 && dy === 0) {
    return;
  }

  const delay = state.keys.sprint ? SPRINT_DELAY : MOVE_DELAY;
  if (now - state.lastMoveTime < delay) {
    return;
  }

  state.lastMoveTime = now;
  tryMove(dx, dy);
  updateHud();
  updateQuests();
  renderWorld();
}

function gameLoop(now) {
  handleMovement(now);
  renderWorld(now);
  requestAnimationFrame(gameLoop);
}

function mapKeyToState(event, pressed) {
  const key = event.key.toLowerCase();
  if (key === "w") state.keys.up = pressed;
  if (key === "s") state.keys.down = pressed;
  if (key === "a") state.keys.left = pressed;
  if (key === "d") state.keys.right = pressed;
  if (event.key === "Shift") state.keys.sprint = pressed;

  if (["w", "a", "s", "d", "shift"].includes(key) || event.key === "Shift") {
    event.preventDefault();
  }
}

function toggleHelpMenu(show) {
  el.helpMenu.hidden = !show;
}

function resetGame() {
  state.started = false;
  state.hp = 20;
  state.echoes = 0;
  state.roomId = "null-transit";
  state.player = { ...rooms["null-transit"].spawn };
  state.memoryRecovered = new Set();
  state.noticeSeen = new Set();
  state.battle = null;
  state.endingShown = false;
  state.lastMoveTime = 0;

  state.quests.forEach((quest) => {
    quest.progress = 0;
    quest.complete = false;
  });

  el.choiceButtons.innerHTML = "";
  el.battlePanel.hidden = true;
  el.storyFeed.innerHTML = "";
  logStory("The Rift opens. Press Begin Journey, then move with WASD.");
  updateHud();
  updateQuests();
  renderWorld();
}

function startGame() {
  if (state.started) {
    logStory("Your path is already moving.");
    return;
  }
  state.started = true;
  logStory("A pale hand of light drags you through a tear between dimensions.", "event");
  logStory("Quest accepted: Recover 6 memories before the worlds forget themselves.", "event");
}

window.addEventListener("keydown", (event) => mapKeyToState(event, true));
window.addEventListener("keyup", (event) => mapKeyToState(event, false));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleHelpMenu(false);
  }
});

el.startButton.addEventListener("click", startGame);
el.restartButton.addEventListener("click", resetGame);
el.howToButton.addEventListener("click", () => toggleHelpMenu(true));
el.closeMenuButton.addEventListener("click", () => toggleHelpMenu(false));
el.helpMenu.addEventListener("click", (event) => {
  if (event.target === el.helpMenu) {
    toggleHelpMenu(false);
  }
});

resetGame();
requestAnimationFrame(gameLoop);
