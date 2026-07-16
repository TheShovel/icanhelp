const path = require("path");
const fs = require("fs");
const { modelsDir, appPath } = require("./paths");

const MATH_MODEL_FILE = "LFM2-350M-Math-Q4_K_M.gguf";
const LOAD_TIMEOUT_MS = 60 * 1000;

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
      path.join(dir, "math.log"),
      new Date().toISOString() + " " + msg + "\n",
    );
  } catch (_) {}
}

async function loadModel() {
  if (ready) return true;

  var modelPath = path.join(modelsDir(), MATH_MODEL_FILE);
  if (!fs.existsSync(modelPath)) {
    log("Math model not found: " + modelPath);
    send({ type: "load-error", error: "Math model not downloaded." });
    setTimeout(function () { process.exit(0); }, 100);
    return false;
  }

  try {
    send({ type: "log", message: "Loading math model..." });
    var { getLlama, LlamaChatSession } = await import("node-llama-cpp");

    llama = await getLlama();
    model = await llama.loadModel({
      modelPath: modelPath,
      gpuLayers: 0,
    });

    context = await model.createContext({
      contextSize: 2048,
      batchSize: 128,
    });

    session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt: "You are a math computation tool. Solve the given math problem or evaluate the expression. Return ONLY the numerical answer or simplified expression. No explanation. Be precise.",
    });

    ready = true;
    log("Math model loaded");
    send({ type: "ready" });
    return true;
  } catch (e) {
    log("Failed to load math model: " + (e.message || String(e)));
    send({ type: "load-error", error: e.message || String(e) });
    return false;
  }
}

async function compute(id, expression) {
  if (!ready) {
    send({ type: "math-error", id: id, error: "Math model not loaded" });
    return;
  }

  try {
    var result = await session.prompt(expression, {
      maxTokens: 256,
      temperature: 0.1,
    });
    var text = result.trim();
    log("Computed: " + expression.slice(0, 60) + " → " + text.slice(0, 60));
    send({ type: "math-result", id: id, result: text });
  } catch (e) {
    log("Math computation failed: " + (e.message || String(e)));
    send({ type: "math-error", id: id, error: e.message || String(e) });
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

  if (message.type === "compute") {
    compute(message.id, message.expression);
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
