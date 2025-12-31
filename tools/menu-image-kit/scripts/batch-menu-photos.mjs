import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("ERROR: Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in environment.");
  process.exit(1);
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3-pro-image-preview";
const INPUT_DIR = process.env.INPUT_DIR || path.resolve("./data/gallery");
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve("./data/gallery_out");

const DEFAULT_STYLE_REF = path.resolve("./data/style_reference.png");
const STYLE_REF = process.env.STYLE_REF || (fs.existsSync(DEFAULT_STYLE_REF) ? DEFAULT_STYLE_REF : null);

const PROMPT_FILE = process.env.PROMPT_FILE || path.resolve("./prompts/prompt_upscale_cajun.txt");
const OVERWRITE = process.env.OVERWRITE === "1";
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || "1", 10));
const MAX_PROPS = Math.max(0, parseInt(process.env.MAX_PROPS || "2", 10));
const IMAGE_SIZE = process.env.IMAGE_SIZE || "2K";
const RETRIES = Math.max(0, parseInt(process.env.RETRIES || "3", 10));

const RUNS_DIR = path.resolve("./runs");
fs.mkdirSync(RUNS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runLogPath = path.join(RUNS_DIR, `run-${runId}.jsonl`);

const ai = new GoogleGenAI({ apiKey });

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function fileToInlinePart(filePath) {
  const bytes = fs.readFileSync(filePath);
  return { inlineData: { mimeType: mimeTypeFor(filePath), data: bytes.toString("base64") } };
}

function loadPromptText() {
  if (!fs.existsSync(PROMPT_FILE)) {
    console.error(`ERROR: Prompt file not found: ${PROMPT_FILE}`);
    process.exit(1);
  }
  let prompt = fs.readFileSync(PROMPT_FILE, "utf8").trim();
  if (MAX_PROPS === 0) prompt += "\n\nADDITIONAL CONSTRAINT: Do not add any props at all.";
  else prompt += `\n\nADDITIONAL CONSTRAINT: Use at most ${MAX_PROPS} props total (napkin/sauce dish/chopsticks only).`;
  return prompt;
}

function firstInlineImageB64(response) {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const p = parts.find((x) => x.inlineData?.data);
  return p?.inlineData?.data || null;
}

function sha1(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10);
}

function outPathFor(inputPath, suffix) {
  const baseName = path.basename(inputPath).replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return path.join(OUTPUT_DIR, `${baseName}__${suffix}.png`);
}

async function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function withRetries(fn, { retries }) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(attempt); }
    catch (err) {
      lastErr = err;
      const backoff = Math.min(10000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

async function editOne({ inputPath, aspectRatio, outSuffix, promptText }) {
  const targetOut = outPathFor(inputPath, outSuffix);
  if (!OVERWRITE && fs.existsSync(targetOut)) return { status: "skipped_exists", outPath: targetOut };

  const inputBytes = fs.readFileSync(inputPath);

  const parts = [
    { text: "Use the first image (if present) as a style/set reference. Match its tabletop, props vocabulary, lighting direction, and color grade. Do not copy food from the reference; only match the environment and styling." },
    { text: promptText },
  ];
  if (STYLE_REF) parts.push(fileToInlinePart(STYLE_REF));
  parts.push({ inlineData: { mimeType: mimeTypeFor(inputPath), data: inputBytes.toString("base64") } });

  const response = await withRetries(async () => {
    return await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { imageConfig: { aspectRatio, imageSize: IMAGE_SIZE } },
    });
  }, { retries: RETRIES });

  const imgB64 = firstInlineImageB64(response);
  if (!imgB64) throw new Error("No image returned (missing inlineData).");

  fs.writeFileSync(targetOut, Buffer.from(imgB64, "base64"));
  return { status: "ok", outPath: targetOut, inputHash: sha1(inputBytes) };
}

function listInputFiles(dir) {
  if (!fs.existsSync(dir)) { console.error(`ERROR: INPUT_DIR not found: ${dir}`); process.exit(1); }
  return fs.readdirSync(dir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map((f) => path.join(dir, f))
    .sort((a, b) => a.localeCompare(b));
}

function logJsonl(obj) { fs.appendFileSync(runLogPath, JSON.stringify(obj) + "\n"); }

async function worker(queue, promptText) {
  while (true) {
    const next = queue.shift();
    if (!next) return;
    const { inputPath } = next;
    const base = path.basename(inputPath);
    const startedAt = new Date().toISOString();

    try {
      const hero = await editOne({ inputPath, aspectRatio: "4:3", outSuffix: "hero_4x3", promptText });
      logJsonl({ input: base, crop: "hero_4x3", startedAt, finishedAt: new Date().toISOString(), ...hero });

      const sq = await editOne({ inputPath, aspectRatio: "1:1", outSuffix: "square_1x1", promptText });
      logJsonl({ input: base, crop: "square_1x1", startedAt, finishedAt: new Date().toISOString(), ...sq });

      console.log(`OK: ${base}`);
    } catch (err) {
      console.error(`FAILED: ${base}: ${err.message}`);
      logJsonl({ input: base, crop: "both", startedAt, finishedAt: new Date().toISOString(), status: "error", error: String(err?.message || err) });
    }
  }
}

async function main() {
  const promptText = loadPromptText();
  const files = listInputFiles(INPUT_DIR);

  console.log(`Model: ${MODEL}`);
  console.log(`Input: ${INPUT_DIR} (${files.length} images)`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Prompt: ${PROMPT_FILE}`);
  console.log(`Style ref: ${STYLE_REF || "(none)"}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Log: ${runLogPath}`);

  const queue = files.map((inputPath) => ({ inputPath }));
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker(queue, promptText));
  await Promise.all(workers);

  console.log("Done.");
}

main();
