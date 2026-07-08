const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".config", "icanhelp");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.enc");

function machineKey() {
  try {
    return fs.readFileSync("/etc/machine-id", "utf-8").trim();
  } catch {
    return os.hostname();
  }
}

function deriveKey() {
  return crypto.createHash("sha256").update(machineKey()).digest();
}

function encrypt(text) {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let enc = cipher.update(text, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return JSON.stringify({ iv: iv.toString("hex"), tag, data: enc });
}

function decrypt(encoded) {
  const { iv, tag, data } = JSON.parse(encoded);
  const key = deriveKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  let dec = decipher.update(data, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(decrypt(raw));
  } catch {
    return null;
  }
}

function saveConfig(config) {
  ensureDir();
  const enc = encrypt(JSON.stringify(config, null, 2));
  fs.writeFileSync(CONFIG_FILE, enc, { mode: 0o600 });
  fs.chmodSync(CONFIG_FILE, 0o600);
}

function saveEffort(effort) {
  var cfg = loadConfig() || {};
  cfg.reasoningEffort = effort;
  saveConfig(cfg);
}

function saveModel(model) {
  var cfg = loadConfig() || {};
  cfg.model = model;
  saveConfig(cfg);
}

function saveWindowPosition(x, y) {
  var cfg = loadConfig() || {};
  cfg.windowX = x;
  cfg.windowY = y;
  saveConfig(cfg);
}

function loadWindowPosition() {
  var cfg = loadConfig();
  if (
    cfg &&
    typeof cfg.windowX === "number" &&
    typeof cfg.windowY === "number"
  ) {
    return { x: cfg.windowX, y: cfg.windowY };
  }
  return null;
}

function loadChats() {
  var cfg = loadConfig();
  return (cfg && cfg.chats) || [];
}

function saveChats(chats) {
  var cfg = loadConfig() || {};
  cfg.chats = chats;
  saveConfig(cfg);
}

module.exports = {
  loadConfig,
  saveConfig,
  saveEffort,
  saveModel,
  saveWindowPosition,
  loadWindowPosition,
  loadChats,
  saveChats,
};
