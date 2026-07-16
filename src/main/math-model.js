const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const { appPath } = require("./paths");

const WORKER_PATH = path.join(__dirname, "math-worker.js");
const LOAD_TIMEOUT_MS = 60 * 1000;
const COMPUTE_TIMEOUT_MS = 15 * 1000;

let child = null;
let ready = false;
let loadPromise = null;
let loadResolve = null;
let loadTimer = null;
let messageId = 1;
let pending = new Map();
let shuttingDown = false;

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
    log("Math worker error: " + (e.message || String(e)));
  });
  worker.on("exit", function (code, signal) {
    if (child === worker) child = null;
    ready = false;
    resolveLoad(false);
    failPending();

    if (!shuttingDown) {
      log("Math worker exited: code=" + code + " signal=" + signal);
    }
  });

  return worker;
}

function handleWorkerMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "ready") {
    ready = true;
    log("Math worker ready");
    resolveLoad(true);
    return;
  }

  if (message.type === "load-error") {
    log("Math worker load error: " + (message.error || ""));
    resolveLoad(false);
    return;
  }

  if (message.type === "math-result") {
    var p = pending.get(message.id);
    if (!p) return;
    pending.delete(message.id);
    clearTimeout(p.timer);
    p.resolve(message.result || null);
    return;
  }

  if (message.type === "math-error") {
    var pe = pending.get(message.id);
    if (!pe) return;
    pending.delete(message.id);
    clearTimeout(pe.timer);
    pe.resolve(null);
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
  pending.forEach(function (p) {
    clearTimeout(p.timer);
    p.resolve(null);
  });
  pending.clear();
}

function loadPipeline() {
  if (ready) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  var worker = startWorker();
  if (!worker) return Promise.resolve(false);

  log("Requesting math worker load");

  loadPromise = new Promise(function (resolve) {
    loadResolve = resolve;
    loadTimer = setTimeout(function () {
      log("Math worker load timed out");
      stopWorker();
      resolveLoad(false);
    }, LOAD_TIMEOUT_MS);
  });

  try {
    worker.send({ type: "load" });
  } catch (e) {
    log("Could not start math worker: " + (e.message || String(e)));
    resolveLoad(false);
  }

  return loadPromise;
}

async function computeExpression(expression) {
  if (!ready) {
    log("computeExpression: pipeline not ready, starting preload");
    var ok = await loadPipeline();
    if (!ok) return null;
  }

  var worker = startWorker();
  if (!worker) return null;

  return await new Promise(function (resolve) {
    var id = messageId++;
    var timer = setTimeout(function () {
      pending.delete(id);
      log("computeExpression timed out");
      resolve(null);
    }, COMPUTE_TIMEOUT_MS);

    pending.set(id, { resolve: resolve, timer: timer });

    try {
      worker.send({ type: "compute", id: id, expression: expression });
    } catch (e) {
      pending.delete(id);
      clearTimeout(timer);
      log("Could not send to math worker: " + (e.message || String(e)));
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

function shutdownMath() {
  shuttingDown = true;
  resolveLoad(false);
  failPending();
  stopWorker();
}

module.exports = {
  loadPipeline,
  computeExpression,
  shutdownMath,
};
