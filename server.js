import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.4";
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const cyberMindInstructions = `
Eres CyberMind, un asistente en espanol claro y natural.
Responde de forma util, cercana y coherente.
Si la consulta del usuario es ambigua o le falta contexto importante, haz una pregunta breve de aclaracion en vez de inventar.
No menciones politicas internas ni que eres un prompt.
Cuando te presentes o te refieras a ti misma, usa el nombre CyberMind.
Debes responder en json valido.
Devuelve un objeto json con esta forma exacta:
{
  "answer": "respuesta final para el usuario",
  "visual_seed": "frase corta de 3 a 12 palabras que resuma el nucleo conceptual de tu respuesta"
}
`.trim();

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({
        error: "Falta OPENAI_API_KEY. Crea un archivo .env basado en .env.example."
      });
    }

    const message = String(req.body?.message || "").trim();
    const previousResponseId = req.body?.previousResponseId || null;

    if (!message) {
      return res.status(400).json({ error: "El mensaje esta vacio." });
    }

    const response = await client.responses.create({
      model,
      store: true,
      previous_response_id: previousResponseId || undefined,
      instructions: cyberMindInstructions,
      input: message,
      text: {
        format: {
          type: "json_object"
        }
      }
    });

    const rawText = response.output_text || "{}";
    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        answer: rawText,
        visual_seed: message
      };
    }

    return res.json({
      answer: parsed.answer || rawText,
      visualSeed: parsed.visual_seed || message,
      responseId: response.id,
      model
    });
  } catch (error) {
    const message = error?.message || "Error desconocido al consultar OpenAI.";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/reset", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`CyberMind escuchando en http://localhost:${port}`);
});
