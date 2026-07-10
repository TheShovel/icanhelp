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
  } catch (e) {
    console.error("[store] loadConfig failed:", e.message);
    return null;
  }
}

function saveConfig(config) {
  ensureDir();
  const enc = encrypt(JSON.stringify(config, null, 2));
  console.log("[store] saveConfig, keys:", Object.keys(config).join(", "));
  fs.writeFileSync(CONFIG_FILE, enc, { mode: 0o600 });
  fs.chmodSync(CONFIG_FILE, 0o600);
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
  var cfg = loadConfig();
  console.log(
    "[store] saveChats, cfg:",
    cfg ? "loaded (keys: " + Object.keys(cfg).join(",") + ")" : "NULL",
  );
  if (!cfg) cfg = {};
  cfg.chats = chats;
  saveConfig(cfg);
}

var DEFAULT_THEMES = {
  "Default Light": {
    properties: {
      "--bg-panel": "#f6f5f4",
      "--bg-header": "#fafafa",
      "--bg-body": "#ffffff",
      "--bg-input": "#ffffff",
      "--bg-hover": "rgba(0,0,0,0.06)",
      "--bg-code": "#f0f0f0",
      "--bg-tool": "#f0f0f0",
      "--bg-tool-out": "#f5f5f5",
      "--bg-overlay": "rgba(0,0,0,0.3)",
      "--bg-list-item-hover": "#f0f0f0",
      "--bg-list-item-active": "rgba(53,132,228,0.1)",
      "--border": "#deddda",
      "--border-strong": "#c0bfbc",
      "--border-focus": "#3584e4",
      "--fg": "#2d2d2d",
      "--fg-dim": "#5e5c64",
      "--fg-muted": "#77767b",
      "--fg-placeholder": "#9a9996",
      "--accent": "#3584e4",
      "--accent-hover": "#1a5fb4",
      "--accent-press": "#15539e",
      "--accent-fg": "#ffffff",
      "--user-bubble-bg": "#3584e4",
      "--user-bubble-fg": "#ffffff",
      "--thinking-fg": "#986a44",
      "--thinking-border": "#c4a46c",
      "--tool-fg": "#4a7c59",
      "--tool-border": "#8cb88a",
      "--tool-text-fg": "#3a6347",
      "--danger": "#c01c28",
      "--confirm-cmd-fg": "#813d9c",
      "--scrollbar-thumb": "rgba(128,128,128,0.3)",
      "--scrollbar-thumb-list": "rgba(128,128,128,0.25)",
    },
  },
  "Default Dark": {
    properties: {
      "--bg-panel": "#242424",
      "--bg-header": "#2d2d2d",
      "--bg-body": "#1e1e1e",
      "--bg-input": "#3a3a3a",
      "--bg-hover": "rgba(255,255,255,0.08)",
      "--bg-code": "#333333",
      "--bg-tool": "#2a2a2a",
      "--bg-tool-out": "#2a2a2a",
      "--bg-overlay": "rgba(0,0,0,0.5)",
      "--bg-list-item-hover": "#333333",
      "--bg-list-item-active": "rgba(53,132,228,0.15)",
      "--border": "#3a3a3a",
      "--border-strong": "#4a4a4a",
      "--border-focus": "#5a9cf8",
      "--fg": "#e0e0e0",
      "--fg-dim": "#bbbbbb",
      "--fg-muted": "#999999",
      "--fg-placeholder": "#666666",
      "--accent": "#5a9cf8",
      "--accent-hover": "#7ab4ff",
      "--accent-press": "#3584e4",
      "--accent-fg": "#ffffff",
      "--user-bubble-bg": "#5a9cf8",
      "--user-bubble-fg": "#ffffff",
      "--thinking-fg": "#d4a85c",
      "--thinking-border": "#8b6914",
      "--tool-fg": "#66bb6a",
      "--tool-border": "#4a7c59",
      "--tool-text-fg": "#a5d6a7",
      "--danger": "#f28b82",
      "--confirm-cmd-fg": "#d4a85c",
      "--scrollbar-thumb": "rgba(255,255,255,0.2)",
      "--scrollbar-thumb-list": "rgba(255,255,255,0.15)",
    },
  },
};

function getDefaultThemeNames() {
  return Object.keys(DEFAULT_THEMES);
}

function isDefaultTheme(name) {
  return DEFAULT_THEMES.hasOwnProperty(name);
}

function loadThemes() {
  var cfg = loadConfig();
  var saved = (cfg && cfg.themes) || {};
  return Object.assign({}, DEFAULT_THEMES, saved);
}

function saveTheme(name, properties) {
  if (isDefaultTheme(name)) return false;
  var cfg = loadConfig() || {};
  if (!cfg.themes) cfg.themes = {};
  cfg.themes[name] = { properties: properties };
  saveConfig(cfg);
  return true;
}

function deleteTheme(name) {
  if (isDefaultTheme(name)) return false;
  var cfg = loadConfig();
  if (!cfg || !cfg.themes) return false;
  delete cfg.themes[name];
  if (cfg.activeTheme === name) delete cfg.activeTheme;
  saveConfig(cfg);
  return true;
}

function loadActiveTheme() {
  var cfg = loadConfig();
  return (cfg && cfg.activeTheme) || null;
}

function saveActiveTheme(name) {
  var cfg = loadConfig() || {};
  cfg.activeTheme = name || undefined;
  saveConfig(cfg);
}

module.exports = {
  loadConfig,
  saveConfig,
  saveWindowPosition,
  loadWindowPosition,
  loadChats,
  saveChats,
  loadThemes,
  saveTheme,
  deleteTheme,
  isDefaultTheme,
  getDefaultThemeNames,
  loadActiveTheme,
  saveActiveTheme,
};
