const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const { appPath, modelsDir } = require("./paths");

const WORKER_PATH = path.join(__dirname, "extract-worker.js");
const LOAD_TIMEOUT_MS = 60 * 1000;
const EXTRACT_TIMEOUT_MS = 30 * 1000;

let child = null;
let ready = false;
let progressCallback = null;
let loadPromise = null;
let loadResolve = null;
let loadTimer = null;
let messageId = 1;
let pendingExtractions = new Map();
let shuttingDown = false;

function setProgressCallback(cb) {
  progressCallback = cb;
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

function nodeExecPath() {
  if (process.env.ICANHELP_NODE_PATH) return process.env.ICANHELP_NODE_PATH;
  if (process.env.npm_node_execpath) return process.env.npm_node_execpath;
  if (path.basename(process.execPath).toLowerCase().includes("electron")) {
    return "node";
  }
  return process.execPath;
}

function startWorker() {
  if (child && !child.killed) return child;

  var worker = fork(WORKER_PATH, [], {
    execPath: nodeExecPath(),
    stdio: ["ignore", "ignore", "ignore", "ipc"],
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" }),
  });

  child = worker;
  ready = false;

  worker.on("message", handleWorkerMessage);
  worker.on("error", function (e) {
    log("Extract worker error: " + (e.message || String(e)));
  });
  worker.on("exit", function (code, signal) {
    if (child === worker) child = null;
    ready = false;
    resolveLoad(false);
    failPending();

    if (!shuttingDown) {
      log("Extract worker exited: code=" + code + " signal=" + signal);
    }
  });

  return worker;
}

function handleWorkerMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "ready") {
    ready = true;
    log("Extract worker ready");
    resolveLoad(true);
    return;
  }

  if (message.type === "load-error") {
    log("Extract worker load error: " + (message.error || ""));
    resolveLoad(false);
    return;
  }

  if (message.type === "extract-result") {
    var pending = pendingExtractions.get(message.id);
    if (!pending) return;
    pendingExtractions.delete(message.id);
    clearTimeout(pending.timer);
    pending.resolve({ text: message.text, method: message.method });
    return;
  }

  if (message.type === "log") {
    log("worker: " + message.message);
  }
}

function resolveLoad(value) {
  if (loadTimer) {
    clearTimeout(loadTimer);
    loadTimer = null;
  }
  if (loadResolve) {
    loadResolve(value);
    loadResolve = null;
  }
  loadPromise = null;
}

function failPending() {
  pendingExtractions.forEach(function (pending) {
    clearTimeout(pending.timer);
    pending.resolve(null);
  });
  pendingExtractions.clear();
}

function loadPipeline() {
  if (ready) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  var worker = startWorker();
  if (!worker) return Promise.resolve(false);

  log("Requesting extract worker load");

  loadPromise = new Promise(function (resolve) {
    loadResolve = resolve;
    loadTimer = setTimeout(function () {
      log("Extract worker load timed out");
      stopWorker();
      resolveLoad(false);
    }, LOAD_TIMEOUT_MS);
  });

  try {
    worker.send({ type: "load" });
  } catch (e) {
    log("Could not start extract worker: " + (e.message || String(e)));
    resolveLoad(false);
  }

  return loadPromise;
}

function findBestExtractModel() {
  var models = modelsDir();
  var candidates = [
    "LFM2-1.2B-Extract-Q4_K_M.gguf",
    "LFM2-350M-Extract-Q4_K_M.gguf",
  ];
  for (var i = 0; i < candidates.length; i++) {
    var p = path.join(models, candidates[i]);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function extractText(html) {
  var modelPath = findBestExtractModel();
  if (!modelPath) {
    return null;
  }
  if (!ready) {
    loadPipeline();
    return null;
  }

  var worker = startWorker();
  if (!worker) return null;

  return await new Promise(function (resolve) {
    var id = messageId++;
    var timer = setTimeout(function () {
      pendingExtractions.delete(id);
      log("extractText timed out");
      resolve(null);
    }, EXTRACT_TIMEOUT_MS);

    pendingExtractions.set(id, { resolve: resolve, timer: timer });

    try {
      worker.send({ type: "extract", id: id, html: html });
    } catch (e) {
      pendingExtractions.delete(id);
      clearTimeout(timer);
      log("Could not send to extract worker: " + (e.message || String(e)));
      resolve(null);
    }
  });
}

function stopWorker() {
  var worker = child;
  child = null;
  ready = false;
  if (worker && !worker.killed) {
    try {
      worker.kill();
    } catch (_) {}
  }
}

function shutdownExtract() {
  shuttingDown = true;
  resolveLoad(false);
  failPending();
  if (child && !child.killed) {
    try {
      child.send({ type: "shutdown" });
    } catch (_) {}
  }
  stopWorker();
}

module.exports = {
  extractText,
  setProgressCallback,
  loadPipeline,
  shutdownExtract,
};
