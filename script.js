const canvas = document.getElementById("mindCanvas");
const ctx = canvas.getContext("2d");

const clearCanvasButton = document.getElementById("clearCanvas");
const clearChatButton = document.getElementById("clearChat");
const repaintButton = document.getElementById("repaintButton");
const sendButton = document.getElementById("sendButton");
const inspirationInput = document.getElementById("inspirationInput");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatLog = document.getElementById("chatLog");
const sizeControl = document.getElementById("sizeControl");
const strokeControl = document.getElementById("strokeControl");
const densityControl = document.getElementById("densityControl");
const sizeValue = document.getElementById("sizeValue");
const strokeValue = document.getElementById("strokeValue");
const densityValue = document.getElementById("densityValue");

const mindState = document.getElementById("mindState");
const lastDecision = document.getElementById("lastDecision");
const shapeCount = document.getElementById("shapeCount");
const thoughtMode = document.getElementById("thoughtMode");
const themeLabel = document.getElementById("themeLabel");
const apiStatus = document.getElementById("apiStatus");

const semanticThemes = [
  {
    name: "Calma estructurada",
    keywords: ["calma", "paz", "tranquilo", "equilibrio", "silencio", "respirar"],
    palette: ["#7df9c7", "#6bd3ff", "#c9f9ff", "#ffffff"],
    pattern: "orbit"
  },
  {
    name: "Tension creativa",
    keywords: ["caos", "energia", "crear", "idea", "fuego", "intenso", "explosion"],
    palette: ["#ffd36b", "#ff7e88", "#ffffff", "#d0a7ff"],
    pattern: "burst"
  },
  {
    name: "Decision y rumbo",
    keywords: ["elegir", "camino", "rumbo", "decision", "duda", "seguir", "cambiar"],
    palette: ["#6bd3ff", "#ffd36b", "#ffffff", "#7df9c7"],
    pattern: "axis"
  },
  {
    name: "Vinculo humano",
    keywords: ["amor", "amistad", "persona", "relacion", "extrano", "compan", "familia"],
    palette: ["#ff7e88", "#ffd36b", "#ffffff", "#6bd3ff"],
    pattern: "cluster"
  },
  {
    name: "Futuro y progreso",
    keywords: ["futuro", "trabajo", "mejorar", "crecer", "aprender", "meta", "proyecto"],
    palette: ["#7df9c7", "#ffd36b", "#ffffff", "#6bd3ff"],
    pattern: "ladder"
  }
];

const state = {
  responseCount: 0,
  latestVisualSeed: "calma y futuro"
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintBackground();
}

function paintBackground() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(5, 13, 23, 0.92)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getBaseSize() {
  return Number(sizeControl.value);
}

function getBaseStroke() {
  return Number(strokeControl.value);
}

function getDensity() {
  return Number(densityControl.value);
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function detectTheme(input) {
  const normalized = normalizeText(input || inspirationInput.value);
  let bestMatch = semanticThemes[0];
  let bestScore = 0;

  for (const theme of semanticThemes) {
    let score = 0;
    for (const keyword of theme.keywords) {
      if (normalized.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = theme;
    }
  }

  return bestMatch;
}

function addChatBubble(role, text) {
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<strong>${role === "user" ? "Tu" : "CyberMind"}</strong><span>${text}</span>`;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function drawConstellation(cx, cy, radius, colors) {
  const points = [];
  const count = 4 + Math.floor(randomBetween(0, getDensity()));
  const stroke = Math.max(1, getBaseStroke() * 0.7);

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + randomBetween(-0.25, 0.25);
    const distance = randomBetween(radius * 0.35, radius);
    points.push({
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance
    });
  }

  ctx.lineWidth = stroke;
  ctx.strokeStyle = colors[1] || colors[0];
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, randomBetween(4, radius * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = `${randomItem(colors)}44`;
    ctx.fill();
    ctx.strokeStyle = randomItem(colors);
    ctx.stroke();
  }
}

function drawOrbitField(colors) {
  const centerX = canvas.clientWidth / 2;
  const centerY = canvas.clientHeight / 2;
  const layers = Math.max(3, Math.floor(getDensity() / 2));

  for (let i = 0; i < layers; i += 1) {
    const radiusX = getBaseSize() * (0.7 + i * 0.42);
    const radiusY = getBaseSize() * (0.4 + i * 0.26);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, randomBetween(-0.5, 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = randomItem(colors);
    ctx.lineWidth = Math.max(1, getBaseStroke() - 1 + i * 0.35);
    ctx.stroke();
  }

  drawConstellation(centerX, centerY, getBaseSize() * 1.6, colors);
}

function drawBurstField(colors) {
  const centerX = randomBetween(canvas.clientWidth * 0.25, canvas.clientWidth * 0.75);
  const centerY = randomBetween(canvas.clientHeight * 0.25, canvas.clientHeight * 0.75);
  const rays = 10 + getDensity();

  for (let i = 0; i < rays; i += 1) {
    const angle = (Math.PI * 2 * i) / rays;
    const length = randomBetween(getBaseSize() * 0.8, getBaseSize() * 2.3);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length);
    ctx.strokeStyle = randomItem(colors);
    ctx.lineWidth = randomBetween(1, getBaseStroke() + 2);
    ctx.stroke();
  }

  drawConstellation(centerX, centerY, getBaseSize() * 1.1, colors);
}

function drawAxisField(colors) {
  const leftX = canvas.clientWidth * 0.25;
  const rightX = canvas.clientWidth * 0.75;
  const centerY = canvas.clientHeight * 0.55;

  ctx.strokeStyle = colors[0];
  ctx.lineWidth = getBaseStroke();
  ctx.beginPath();
  ctx.moveTo(leftX, centerY);
  ctx.lineTo(rightX, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvas.clientWidth / 2, canvas.clientHeight * 0.18);
  ctx.lineTo(canvas.clientWidth / 2, canvas.clientHeight * 0.84);
  ctx.stroke();

  drawConstellation(leftX, centerY, getBaseSize() * 0.9, colors);
  drawConstellation(rightX, centerY, getBaseSize() * 0.9, colors);
}

function drawClusterField(colors) {
  const groups = 2 + Math.floor(getDensity() / 2);
  for (let i = 0; i < groups; i += 1) {
    drawConstellation(
      randomBetween(canvas.clientWidth * 0.18, canvas.clientWidth * 0.82),
      randomBetween(canvas.clientHeight * 0.22, canvas.clientHeight * 0.78),
      randomBetween(getBaseSize() * 0.55, getBaseSize() * 1.05),
      colors
    );
  }
}

function drawLadderField(colors) {
  const steps = 4 + Math.floor(getDensity() / 2);
  const startX = canvas.clientWidth * 0.18;
  const startY = canvas.clientHeight * 0.78;
  const stepWidth = getBaseSize() * 0.72;
  const stepHeight = getBaseSize() * 0.34;

  for (let i = 0; i < steps; i += 1) {
    const x = startX + i * stepWidth * 0.75;
    const y = startY - i * stepHeight * 0.72;
    ctx.fillStyle = `${randomItem(colors)}22`;
    ctx.strokeStyle = randomItem(colors);
    ctx.lineWidth = randomBetween(1, getBaseStroke() + 1);
    ctx.fillRect(x, y, stepWidth, stepHeight);
    ctx.strokeRect(x, y, stepWidth, stepHeight);
  }
}

function renderSemanticScene(seedText) {
  const theme = detectTheme(seedText);
  const colors = theme.palette;

  paintBackground();

  if (theme.pattern === "orbit") {
    drawOrbitField(colors);
  } else if (theme.pattern === "burst") {
    drawBurstField(colors);
  } else if (theme.pattern === "axis") {
    drawAxisField(colors);
  } else if (theme.pattern === "cluster") {
    drawClusterField(colors);
  } else {
    drawLadderField(colors);
  }

  for (let i = 0; i < getDensity() - 1; i += 1) {
    drawConstellation(
      randomBetween(80, canvas.clientWidth - 80),
      randomBetween(80, canvas.clientHeight - 80),
      randomBetween(getBaseSize() * 0.25, getBaseSize() * 0.62),
      colors
    );
  }

  themeLabel.textContent = theme.name;
  thoughtMode.textContent = "Interpretativo";
  lastDecision.textContent = `Visualizando: ${theme.name}`;
}

function setBusy(isBusy) {
  sendButton.disabled = isBusy;
  chatInput.disabled = isBusy;
  sendButton.textContent = isBusy ? "Pensando..." : "Preguntar";
  apiStatus.textContent = isBusy ? "Consultando..." : apiStatus.textContent;
}

async function askCyberMind(message) {
  setBusy(true);
  mindState.textContent = "Pensando con motor local";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo obtener respuesta del modelo.");
    }

    state.responseCount += 1;
    shapeCount.textContent = String(state.responseCount);
    apiStatus.textContent = data.apiName || (data.learned ? "Micro-API de memoria" : "Micro-API activa");
    mindState.textContent = "Respuesta recibida";

    const visualSeed = data.visualSeed || data.answer || message;
    state.latestVisualSeed = visualSeed;
    inspirationInput.value = visualSeed;
    renderSemanticScene(visualSeed);

    return data.answer;
  } catch (error) {
    apiStatus.textContent = "Micro-API fallida";
    mindState.textContent = "No se pudo responder";
    throw error;
  } finally {
    setBusy(false);
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  addChatBubble("user", message);
  chatInput.value = "";

  try {
    const answer = await askCyberMind(message);
    addChatBubble("assistant", answer);
  } catch (error) {
    addChatBubble("assistant", `No pude hablar con OpenAI: ${error.message}`);
  }
});

clearCanvasButton.addEventListener("click", () => {
  paintBackground();
  mindState.textContent = "Lienzo limpiado";
  lastDecision.textContent = "Sin interpretar aun";
});

clearChatButton.addEventListener("click", async () => {
  chatLog.innerHTML = "";
  state.responseCount = 0;
  shapeCount.textContent = "0";
  apiStatus.textContent = "Sin crear";
  mindState.textContent = "Memoria borrada";
  addChatBubble("assistant", "Conversacion reiniciada. Puedes empezar desde cero.");

  try {
    await fetch("/api/reset", { method: "POST" });
  } catch (error) {
    apiStatus.textContent = "Reinicio local";
  }
});

repaintButton.addEventListener("click", () => {
  renderSemanticScene(state.latestVisualSeed || inspirationInput.value);
  mindState.textContent = "Respuesta reinterpretada";
});

sizeControl.addEventListener("input", () => {
  sizeValue.textContent = sizeControl.value;
  renderSemanticScene(state.latestVisualSeed || inspirationInput.value);
});

strokeControl.addEventListener("input", () => {
  strokeValue.textContent = strokeControl.value;
  renderSemanticScene(state.latestVisualSeed || inspirationInput.value);
});

densityControl.addEventListener("input", () => {
  densityValue.textContent = densityControl.value;
  renderSemanticScene(state.latestVisualSeed || inspirationInput.value);
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
sizeValue.textContent = sizeControl.value;
strokeValue.textContent = strokeControl.value;
densityValue.textContent = densityControl.value;
renderSemanticScene(state.latestVisualSeed);
addChatBubble("assistant", "Soy CyberMind. Ahora funciono con una IA local propia: aprendo de las conversaciones, respondo sin depender de servicios externos y mantengo limites de seguridad.");
