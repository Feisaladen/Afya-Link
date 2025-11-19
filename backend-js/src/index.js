import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..", "..");
const localEnvPath = path.resolve(__dirname, "..", ".env");
const legacyEnvPath = path.resolve(projectRoot, "backend", "env.file");

if (fs.existsSync(legacyEnvPath)) {
  dotenv.config({ path: legacyEnvPath });
}

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
}

dotenv.config({ path: path.resolve(projectRoot, ".env"), override: true });

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  GEMINI_API_KEY,
  GEMINI_KEY,
  GEMINI_MODEL = "gemini-2.0-flash",
  PORT = 5000
} = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_KEY.");
  process.exit(1);
}

const GEMINI_SECRET = GEMINI_API_KEY || GEMINI_KEY;
if (!GEMINI_SECRET) {
  console.warn("Warning: GEMINI_API_KEY (or GEMINI_KEY) is not set. /ai_advice will return an error.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const symptomsPath = path.resolve(__dirname, "..", "symptoms.json");
let offlineSymptoms = {};
try {
  offlineSymptoms = JSON.parse(fs.readFileSync(symptomsPath, "utf8"));
} catch (error) {
  console.warn("Failed to load symptoms.json. Offline checker will be limited.", error);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
};

const parseGeminiResponse = (text = "", symptom) => {
  const clean = text.replace(/```json/gi, "```").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return {
      description: clean || `No description returned for ${symptom}.`,
      causes: [],
      remedies: []
    };
  }

  try {
    const parsed = JSON.parse(clean.slice(start, end + 1));
    return {
      description: parsed.description || `Summary for ${symptom}`,
      causes: normalizeList(parsed.causes),
      remedies: normalizeList(parsed.remedies)
    };
  } catch (error) {
    return {
      description: clean || `No description returned for ${symptom}.`,
      causes: [],
      remedies: []
    };
  }
};

async function saveHistory(email, symptom, result, source = "offline") {
  if (!email) return;
  const entry = {
    email,
    symptom,
    description: result.description,
    causes: JSON.stringify(result.causes ?? []),
    remedies: JSON.stringify(result.remedies ?? []),
    source,
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from("history").insert(entry);
  if (error) console.error("Failed to save history:", error);
}

app.get("/", (_req, res) => {
  res.json({ message: "Afya Link API running ✅ (Node)" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ status: "success", user: data.user?.email });
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ status: "success", user: data.user?.email });
});

app.post("/check_symptom", async (req, res) => {
  const symptom = (req.body.symptom || "").toLowerCase().trim();
  const email = req.body.email;

  if (!symptom) {
    return res.status(400).json({ error: "No symptom provided." });
  }

  const result = offlineSymptoms[symptom];

  if (result) {
    await saveHistory(email, symptom, result, "offline");
    return res.json({ source: "offline", result });
  }

  const unknown = {
    description: `We could not recognize '${symptom}' as a known symptom.`,
    causes: ["Unknown"],
    remedies: ["Please enter a correct symptom for accurate offline guidance, or use AI Advice."]
  };
  await saveHistory(email, symptom, unknown, "offline_unknown");
  res.json({
    source: "not_found",
    result: unknown,
    message: `'${symptom}' is not recognized as a known symptom. Enter a correct symptom or try AI Advice.`
  });
});

app.post("/ai_advice", async (req, res) => {
  const { symptom, email } = req.body;

  if (!symptom) {
    return res.status(400).json({ error: "No symptom provided." });
  }
  if (!GEMINI_SECRET) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  try {
    const prompt = [
      `User reports symptom: '${symptom}'.`,
      "Provide a concise description, possible causes, and personalized remedies.",
      "Respond ONLY with valid JSON (no markdown) using this exact structure:",
      "{",
      '  "description": string,',
      '  "causes": string[] or string,',
      '  "remedies": string[] or string',
      "}"
    ].join(" ");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload?.error?.message || `Gemini request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const aiText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const result = parseGeminiResponse(aiText, symptom);

    await saveHistory(email, symptom, result, "ai");
    res.json({ source: "ai", result });
  } catch (error) {
    console.error("AI advice failed:", error);
    res.status(500).json({ error: `AI advice failed: ${error.message}` });
  }
});

app.get("/history/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ history: data });
});

app.listen(PORT, () => {
  console.log(`Afya Link Node backend running on port ${PORT}`);
});


