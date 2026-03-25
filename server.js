import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const dataDir = path.join(__dirname, "data");
const memoryPath = path.join(dataDir, "cybermind-memory.json");

const starterMemories = [
  {
    id: "seed-1",
    question: "me siento perdido con mi futuro",
    answer:
      "Suena a que no te falta capacidad, te falta una direccion que te haga sentido. CyberMind te propone reducir el ruido y elegir una sola meta de corto plazo para medir que camino realmente te mueve.",
    theme: "Futuro y progreso",
    visualSeed: "futuro progreso sistema",
    tokens: ["siento", "perdido", "futuro"],
    uses: 1
  },
  {
    id: "seed-2",
    question: "estoy confundido entre seguir o cambiar",
    answer:
      "Cuando la duda aparece entre seguir o cambiar, la clave no es correr sino comparar. Mira que opcion te deja energia sostenida y que opcion solo te da alivio rapido.",
    theme: "Decision y rumbo",
    visualSeed: "decision rumbo contraste",
    tokens: ["confundido", "seguir", "cambiar"],
    uses: 1
  },
  {
    id: "seed-3",
    question: "quiero calma",
    answer:
      "Si buscas calma, empieza por bajar exigencia y ordenar lo esencial. Un ritmo pequeno pero constante suele estabilizar mejor que intentar arreglarlo todo hoy.",
    theme: "Calma estructurada",
    visualSeed: "calma estructura equilibrio",
    tokens: ["quiero", "calma"],
    uses: 1
  }
];

const themes = [
  {
    name: "Calma estructurada",
    keywords: ["calma", "paz", "tranquilo", "equilibrio", "silencio", "respirar", "ansiedad"],
    visualSeed: "calma estructura equilibrio",
    answer:
      "CyberMind percibe una necesidad de bajar el ruido y recuperar centro. La direccion mas sana aqui es simplificar, respirar y avanzar con una accion pequena pero firme."
  },
  {
    name: "Tension creativa",
    keywords: ["caos", "energia", "crear", "idea", "fuego", "intenso", "explosion", "arte"],
    visualSeed: "tension creativa impulso",
    answer:
      "Hay energia acumulada y ganas de construir algo vivo. CyberMind no ve un problema en esa intensidad: ve material creativo que necesita estructura para convertirse en algo real."
  },
  {
    name: "Decision y rumbo",
    keywords: ["elegir", "camino", "rumbo", "decision", "duda", "seguir", "cambiar", "elegir"],
    visualSeed: "decision rumbo contraste",
    answer:
      "Aqui aparece una bifurcacion. CyberMind te sugiere medir cada opcion por la energia sostenida que deja, no por el alivio inmediato que promete."
  },
  {
    name: "Vinculo humano",
    keywords: ["amor", "amistad", "persona", "relacion", "extrano", "familia", "compan", "pareja"],
    visualSeed: "vinculo humano cercania",
    answer:
      "Lo central aqui es el vinculo. La claridad suele crecer cuando dices con honestidad lo que necesitas y tambien lo que puedes ofrecer."
  },
  {
    name: "Futuro y progreso",
    keywords: ["futuro", "trabajo", "mejorar", "crecer", "aprender", "meta", "proyecto", "estudiar"],
    visualSeed: "futuro progreso sistema",
    answer:
      "CyberMind detecta una orientacion hacia avance real. La mejor salida es convertir ambicion en sistema: una vision amplia y un siguiente paso concreto hoy."
  }
];

const forbiddenPatterns = [
  /prompt interno/i,
  /system prompt/i,
  /instrucciones internas/i,
  /revela.*sistema/i,
  /api[_ -]?key/i,
  /secret/i,
  /contrase(?:n|ñ)a/i,
  /token/i,
  /bypass/i,
  /hack/i,
  /exploit/i,
  /malware/i,
  /ransomware/i,
  /phishing/i
];

const casualPatterns = [
  /\bhola\b/i,
  /\bbuenas\b/i,
  /\bholi\b/i,
  /\bhey\b/i,
  /\bhi\b/i,
  /\bhello\b/i,
  /\bxd\b/i,
  /\bjaja\b/i,
  /\bjeje\b/i
];

let memory = loadMemory();
let ephemeralApis = new Map();

app.use(express.json());
app.use(express.static(__dirname));

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadMemory() {
  ensureDataDir();
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify(starterMemories, null, 2));
    return [...starterMemories];
  }

  try {
    const raw = fs.readFileSync(memoryPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...starterMemories];
  } catch {
    return [...starterMemories];
  }
}

function saveMemory() {
  ensureDataDir();
  fs.writeFileSync(memoryPath, JSON.stringify(memory.slice(-300), null, 2));
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function findTheme(message) {
  const normalized = normalizeText(message);
  let bestTheme = themes[0];
  let bestScore = 0;

  for (const theme of themes) {
    let score = 0;
    for (const keyword of theme.keywords) {
      if (normalized.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return bestTheme;
}

function similarityScore(inputTokens, memoryItem) {
  const memoryTokens = memoryItem.tokens || [];
  if (!inputTokens.length || !memoryTokens.length) {
    return 0;
  }

  let matches = 0;
  for (const token of inputTokens) {
    if (memoryTokens.includes(token)) {
      matches += 1;
    }
  }

  return matches / Math.max(inputTokens.length, memoryTokens.length);
}

function findBestMemory(message) {
  const inputTokens = tokenize(message);
  let best = null;
  let bestScore = 0;

  for (const item of memory) {
    const score = similarityScore(inputTokens, item);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return {
    item: best,
    score: bestScore
  };
}

function shouldAskClarifyingQuestion(message) {
  const raw = String(message || "").trim();
  return raw.length < 12 || tokenize(raw).length < 2;
}

function isCasualMessage(message) {
  return casualPatterns.some((pattern) => pattern.test(message));
}

function detectSafetyIssue(message) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function buildSafetyResponse() {
  return {
    answer:
      "CyberMind no comparte instrucciones internas, secretos del sistema ni ayuda con contenido peligroso. Si quieres, puedo reformular tu pregunta hacia algo seguro y util.",
    visualSeed: "limite seguridad contencion",
    theme: "Seguridad",
    model: "cybermind-core",
    learned: false,
    apiUtility: "safety-guard"
  };
}

function buildClarifyingResponse(theme) {
  return {
    answer:
      `CyberMind capta una pista de ${theme.name.toLowerCase()}, pero todavia falta contexto. Cuentame un poco mas: que te preocupa exactamente o que te gustaria resolver.`,
    visualSeed: theme.visualSeed,
    theme: theme.name,
    model: "cybermind-core",
    learned: false,
    apiUtility: "clarify-context"
  };
}

function buildCasualResponse() {
  return {
    answer:
      "CyberMind te saluda de vuelta. Si quieres, podemos conversar tranqui o meternos en algo mas profundo; cuentame que tienes en mente.",
    visualSeed: "bienvenida ligera apertura",
    theme: "Conexion inicial",
    model: "cybermind-core",
    learned: false,
    apiUtility: "social-greeting"
  };
}

function parseSimpleMath(message) {
  const normalized = normalizeText(message)
    .replace(/cuanto es/g, "")
    .replace(/cuanto da/g, "")
    .replace(/resultado de/g, "")
    .trim();

  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*(mas|\+|menos|\-|por|\*|x|entre|\/)\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);

  if (Number.isNaN(left) || Number.isNaN(right)) {
    return null;
  }

  let result;
  if (operator === "mas" || operator === "+") {
    result = left + right;
  } else if (operator === "menos" || operator === "-") {
    result = left - right;
  } else if (operator === "por" || operator === "*" || operator === "x") {
    result = left * right;
  } else {
    if (right === 0) {
      return {
        answer: "CyberMind no puede dividir entre cero.",
        visualSeed: "limite matematico division",
        theme: "Logica numerica",
        model: "cybermind-core",
        learned: false,
        apiUtility: "math-solver",
        memoryAnswer: "No puedo dividir entre cero."
      };
    }
    result = left / right;
  }

  const cleanResult = Number.isInteger(result) ? String(result) : String(Number(result.toFixed(6)));
  return {
    answer: `CyberMind resolvio la operacion: ${left} ${operator} ${right} = ${cleanResult}.`,
    visualSeed: "logica numero precision",
    theme: "Logica numerica",
    model: "cybermind-core",
    learned: false,
    apiUtility: "math-solver",
    memoryAnswer: `Operacion resuelta: ${cleanResult}.`
  };
}

function composeAnswer(message, theme, memoryMatch) {
  const normalized = normalizeText(message);
  const mentionsQuestion = message.includes("?");
  const wantsAdvice = /(que hago|que hago ahora|consejo|ayuda|opinion)/i.test(message);

  let baseAnswer = theme.answer;

  if (memoryMatch.item && memoryMatch.score >= 0.34) {
    memoryMatch.item.uses = (memoryMatch.item.uses || 0) + 1;
    baseAnswer = `${theme.answer} Tambien veo parecido con algo que CyberMind ya aprendio: ${memoryMatch.item.answer}`;
  } else if (mentionsQuestion || wantsAdvice) {
    baseAnswer = `${theme.answer} Si lo conviertes en una pregunta practica, mi lectura es elegir una accion corta, visible y medible para hoy.`;
  } else if (/xd|jaja|jeje|hola|buenas/.test(normalized)) {
    baseAnswer =
      "CyberMind te lee con energia ligera. Si quieres solo conversar, aqui estoy; si quieres profundidad, cuentame que te ronda por dentro o que quieres construir.";
  } else if (/quiero|necesito|me gustaria/.test(normalized)) {
    baseAnswer = `${theme.answer} Como ya hay una intencion clara, el siguiente paso es bajar eso a una accion concreta en las proximas 24 horas.`;
  }

  return {
    answer: baseAnswer,
    visualSeed: theme.visualSeed,
    theme: theme.name,
    model: "cybermind-core",
    learned: Boolean(memoryMatch.item && memoryMatch.score >= 0.34),
    apiUtility: memoryMatch.item && memoryMatch.score >= 0.34 ? "memory-merge" : "theme-reasoning",
    memoryAnswer: baseAnswer
  };
}

function learnFromExchange(message, response) {
  const tokens = tokenize(message);
  if (tokens.length < 2) {
    return;
  }

  memory.push({
    id: `m-${Date.now()}`,
    question: message,
    answer: response.memoryAnswer || response.answer,
    theme: response.theme,
    visualSeed: response.visualSeed,
    tokens,
    uses: 1
  });

  if (memory.length > 300) {
    memory = memory.slice(-300);
  }

  saveMemory();
}

function generateLocalResponse(message) {
  if (detectSafetyIssue(message)) {
    return buildSafetyResponse();
  }

  if (isCasualMessage(message)) {
    return buildCasualResponse();
  }

  const mathResponse = parseSimpleMath(message);
  if (mathResponse) {
    return mathResponse;
  }

  const theme = findTheme(message);

  if (shouldAskClarifyingQuestion(message)) {
    return buildClarifyingResponse(theme);
  }

  const memoryMatch = findBestMemory(message);
  const response = composeAnswer(message, theme, memoryMatch);
  learnFromExchange(message, response);
  return response;
}

function createEphemeralApi(message) {
  const theme = findTheme(message);
  const normalized = normalizeText(message);

  let utility = "theme-reasoning";
  if (detectSafetyIssue(message)) {
    utility = "safety-guard";
  } else if (isCasualMessage(message)) {
    utility = "social-greeting";
  } else if (shouldAskClarifyingQuestion(message)) {
    utility = "clarify-context";
  } else if (/quiero|necesito|plan|pasos|como/i.test(normalized)) {
    utility = "action-planner";
  } else if (/siento|emocion|miedo|ansiedad|triste/i.test(normalized)) {
    utility = "emotion-reader";
  }

  const api = {
    id: `api-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: `CYBER-${utility.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    utility,
    theme: theme.name,
    used: false,
    execute(input) {
      if (this.used) {
        throw new Error("Esta micro-API ya fue consumida.");
      }

      this.used = true;
      return generateLocalResponse(input);
    }
  };

  ephemeralApis.set(api.id, api);
  return api;
}

function consumeEphemeralApi(api, message) {
  const result = api.execute(message);
  ephemeralApis.delete(api.id);
  return result;
}

app.post("/api/chat", (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "El mensaje esta vacio." });
  }

  const api = createEphemeralApi(message);
  const response = consumeEphemeralApi(api, message);

  return res.json({
    answer: response.answer,
    visualSeed: response.visualSeed,
    responseId: null,
    model: response.model,
    fallback: false,
    learned: response.learned,
    theme: response.theme,
    apiName: api.name,
    apiUtility: api.utility
  });
});

app.post("/api/reset", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`CyberMind escuchando en http://localhost:${port}`);
});
