const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

const WORKER_PATH = path.join(__dirname, "vision-worker.js");
const LOAD_TIMEOUT_MS = 10 * 60 * 1000;
const DESCRIBE_TIMEOUT_MS = 20 * 1000;
const MAX_CRASHES = 2;
const CRASH_WINDOW_MS = 60 * 1000;

let child = null;
let pipelineReady = false;
let progressCallback = null;
let loadPromise = null;
let loadResolve = null;
let loadTimer = null;
let messageId = 1;
let pendingDescriptions = new Map();
let loadedByFile = new Map();
let totalByFile = new Map();
let lastEmit = 0;
let crashCount = 0;
let firstCrashAt = 0;
let shuttingDown = false;

function setProgressCallback(cb) {
  progressCallback = cb;
}

function emitAggregateProgress(status, pct) {
  if (!progressCallback) return;
  progressCallback({ percent: pct, status: status });
}

const { appPath } = require("./paths");

function log(msg) {
  try {
    var dir = appPath();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, "vision.log"),
      new Date().toISOString() + " " + msg + "\n",
    );
  } catch {}
}

function resetProgress() {
  loadedByFile = new Map();
  totalByFile = new Map();
  lastEmit = 0;
}

function handleProgress(p) {
  if (typeof p === "number") {
    emitThrottledProgress("downloading", Math.round(p));
    return;
  }
  if (!p || typeof p !== "object") return;

  if (typeof p.progress === "number") {
    emitThrottledProgress("downloading", Math.min(99, Math.round(p.progress)));
    return;
  }

  if (p.file && p.loaded != null && p.total != null && p.total > 0) {
    loadedByFile.set(p.file, Math.max(loadedByFile.get(p.file) || 0, p.loaded));
    totalByFile.set(p.file, p.total);
    var loadedBytes = 0;
    var totalBytes = 0;
    loadedByFile.forEach(function (loaded) {
      loadedBytes += loaded;
    });
    totalByFile.forEach(function (total) {
      totalBytes += total;
    });
    if (totalBytes > 0) {
      emitThrottledProgress(
        "downloading",
        Math.min(99, Math.round((loadedBytes / totalBytes) * 100)),
      );
    }
  }

  if (p.status === "done" || p.status === "ready") {
    emitAggregateProgress(p.status, 100);
  }
}

function emitThrottledProgress(status, percent) {
  var now = Date.now();
  if (now - lastEmit <= 250) return;
  lastEmit = now;
  emitAggregateProgress(status, percent);
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

function failPendingDescriptions() {
  pendingDescriptions.forEach(function (pending) {
    clearTimeout(pending.timer);
    pending.resolve(null);
  });
  pendingDescriptions.clear();
}

function resetCrashWindow() {
  var now = Date.now();
  if (!firstCrashAt || now - firstCrashAt > CRASH_WINDOW_MS) {
    firstCrashAt = now;
    crashCount = 0;
  }
}

function visionTemporarilyDisabled() {
  resetCrashWindow();
  return crashCount >= MAX_CRASHES;
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
  if (visionTemporarilyDisabled()) {
    log("Vision worker disabled after repeated crashes");
    emitAggregateProgress("error", 0);
    return null;
  }

  var worker = fork(WORKER_PATH, [], {
    execPath: nodeExecPath(),
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: "1" }),
  });

  // Capture stderr from the worker so we can see startup errors.
  var workerStderr = "";
  if (worker.stderr) {
    worker.stderr.on("data", function (chunk) {
      workerStderr += String(chunk);
    });
  }
  if (worker.stdout) {
    worker.stdout.resume();
  }

  child = worker;
  pipelineReady = false;

  worker.on("message", handleWorkerMessage);
  worker.on("error", function (e) {
    log("Vision worker error: " + (e.message || String(e)));
  });
  worker.on("exit", function (code, signal) {
    if (child === worker) child = null;
    pipelineReady = false;
    resolveLoad(false);
    failPendingDescriptions();

    if (!shuttingDown) {
      resetCrashWindow();
      crashCount += 1;
      var exitMsg = "Vision worker exited: code=" + code;
      if (workerStderr.trim()) exitMsg += " stderr=" + workerStderr.trim().slice(0, 200);
      log(exitMsg);
      emitAggregateProgress("error", 0);
      if (workerStderr.trim()) {
        progressCallback && progressCallback({ percent: 0, status: "Vision model failed: " + workerStderr.trim().slice(0, 80) });
      }
    }
  });

  return worker;
}

function handleWorkerMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "progress") {
    handleProgress(message.progress);
    return;
  }

  if (message.type === "ready") {
    pipelineReady = true;
    crashCount = 0;
    firstCrashAt = 0;
    log("Pipeline ready");
    emitAggregateProgress("ready", 100);
    resolveLoad(true);
    return;
  }

  if (message.type === "load-error") {
    log("Pipeline FAILED: " + (message.error || "unknown error"));
    emitAggregateProgress("error", 0);
    resolveLoad(false);
    return;
  }

  if (message.type === "result") {
    var pending = pendingDescriptions.get(message.id);
    if (!pending) return;
    pendingDescriptions.delete(message.id);
    clearTimeout(pending.timer);
    pending.resolve(message.caption || null);
    return;
  }

  if (message.type === "describe-error") {
    var failed = pendingDescriptions.get(message.id);
    if (!failed) return;
    log(
      "describeImage inference failed: " + (message.error || "unknown error"),
    );
    pendingDescriptions.delete(message.id);
    clearTimeout(failed.timer);
    failed.resolve(null);
    return;
  }

  if (message.type === "log") {
    log("worker: " + message.message);
  }
}

function loadPipeline() {
  if (pipelineReady) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  var worker = startWorker();
  if (!worker) return Promise.resolve(false);

  resetProgress();
  emitAggregateProgress("downloading", 0);
  log("Requesting vision worker pipeline load");

  loadPromise = new Promise(function (resolve) {
    loadResolve = resolve;
    loadTimer = setTimeout(function () {
      log("Pipeline load timed out");
      stopWorker();
      resolveLoad(false);
    }, LOAD_TIMEOUT_MS);
  });

  try {
    worker.send({ type: "load" });
  } catch (e) {
    log("Could not start vision worker load: " + (e.message || String(e)));
    resolveLoad(false);
  }

  return loadPromise;
}

async function describeImage(imagePath) {
  if (!pipelineReady) {
    log("describeImage: pipeline not ready, starting preload");
    loadPipeline();
    return null;
  }

  var worker = startWorker();
  if (!worker) return null;

  return await new Promise(function (resolve) {
    var id = messageId++;
    var timer = setTimeout(function () {
      pendingDescriptions.delete(id);
      log("describeImage timed out");
      stopWorker();
      resolve(null);
    }, DESCRIBE_TIMEOUT_MS);

    pendingDescriptions.set(id, { resolve: resolve, timer: timer });

    try {
      worker.send({ type: "describe", id: id, imagePath: imagePath });
    } catch (e) {
      pendingDescriptions.delete(id);
      clearTimeout(timer);
      log("Could not send image to vision worker: " + (e.message || String(e)));
      resolve(null);
    }
  });
}

function stopWorker() {
  var worker = child;
  child = null;
  pipelineReady = false;
  if (worker && !worker.killed) {
    try {
      worker.kill();
    } catch {}
  }
}

function shutdownVision() {
  shuttingDown = true;
  resolveLoad(false);
  failPendingDescriptions();
  stopWorker();
}

module.exports = {
  describeImage,
  setProgressCallback,
  loadPipeline,
  shutdownVision,
};
