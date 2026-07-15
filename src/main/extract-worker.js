const path = require("path");
const fs = require("fs");
const { modelsDir, appPath } = require("./paths");

const EXTRACT_MODEL_FILE = "LFM2-350M-Extract-Q4_K_M.gguf";
const LOAD_TIMEOUT_MS = 60 * 1000;
const EXTRACT_TIMEOUT_MS = 30 * 1000;
const MAX_HTML_LENGTH = 30000;

let llama = null;
let model = null;
let context = null;
let session = null;
let ready = false;
let shuttingDown = false;

function send(msg) {
  if (process.send) process.send(msg);
}

function log(msg) {
  try {
    var dir = appPath();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, "extract.log"),
      new Date().toISOString() + " " + msg + "\n",
    );
  } catch (_) {}
}

async function loadModel() {
  if (ready) return true;

  var modelPath = path.join(modelsDir(), EXTRACT_MODEL_FILE);
  if (!fs.existsSync(modelPath)) {
    log("Extract model not found: " + modelPath);
    send({ type: "load-error", error: "Extract model not downloaded." });
    setTimeout(function () { process.exit(0); }, 100);
    return false;
  }

  try {
    send({ type: "log", message: "Loading extraction model..." });
    var { getLlama, LlamaChatSession } = await import("node-llama-cpp");

    llama = await getLlama();
    model = await llama.loadModel({
      modelPath: modelPath,
      gpuLayers: 0,
    });

    context = await model.createContext({
      contextSize: 4096,
      batchSize: 256,
    });

    session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt: "You are a text extraction tool. Extract the main content from HTML or web pages. Return only the clean, readable text. Remove navigation, ads, and boilerplate. Preserve important structure like headings and paragraphs.",
    });

    ready = true;
    log("Extraction model loaded");
    send({ type: "ready" });
    return true;
  } catch (e) {
    log("Failed to load extraction model: " + (e.message || String(e)));
    send({ type: "load-error", error: e.message || String(e) });
    return false;
  }
}

function stripHtmlBasic(html) {
  var text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");

  text = text
    .replace(/<\/?(div|p|h[1-6]|li|tr|br|article|section|main|pre|blockquote|table|ul|ol|dl)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();

  var lines = text.split("\n").filter(function (line) {
    var t = line.trim();
    return t.length > 3 || /^[A-Z][a-z]/.test(t);
  });

  return lines.join("\n").trim();
}

async function extractWithModel(html) {
  if (html.length > MAX_HTML_LENGTH) {
    html = html.slice(0, MAX_HTML_LENGTH);
  }

  var prompt = "Extract the main readable content from this HTML. Remove navigation, ads, sidebars, and boilerplate. Return only the clean text with headings and paragraphs preserved:\n\n" + html;

  try {
    var result = await session.prompt(prompt, {
      maxTokens: 2048,
      temperature: 0.1,
      repeatPenalty: { penalty: 1.05 },
    });
    return result.trim();
  } catch (e) {
    log("Model extraction failed: " + (e.message || String(e)));
    return null;
  }
}

async function extractText(id, html) {
  if (!ready) {
    send({ type: "extract-result", id: id, text: stripHtmlBasic(html), method: "basic" });
    return;
  }

  try {
    var text = await extractWithModel(html);
    if (text && text.length > 20) {
      send({ type: "extract-result", id: id, text: text, method: "model" });
    } else {
      send({ type: "extract-result", id: id, text: stripHtmlBasic(html), method: "basic-fallback" });
    }
  } catch (e) {
    send({ type: "extract-result", id: id, text: stripHtmlBasic(html), method: "basic-fallback" });
  }
}

function shutdown() {
  shuttingDown = true;
  ready = false;
  try {
    if (session) { session.dispose(); session = null; }
    if (context) { context.dispose(); context = null; }
    if (model) { model.dispose(); model = null; }
    if (llama) { llama.dispose(); llama = null; }
  } catch (e) {
    log("Shutdown error: " + (e.message || String(e)));
  }
}

process.on("message", async function (message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "load") {
    try {
      await loadModel();
    } catch (e) {
      send({ type: "load-error", error: e.message || String(e) });
    }
    return;
  }

  if (message.type === "extract") {
    extractText(message.id, message.html);
    return;
  }

  if (message.type === "shutdown") {
    shutdown();
    process.exit(0);
  }
});

process.on("disconnect", function () {
  shutdown();
  process.exit(0);
});
