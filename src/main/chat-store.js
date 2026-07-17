const fs = require("fs");
const path = require("path");
const os = require("os");

const CHATS_DIR = path.join(os.homedir(), ".config", "icanhelp", "chats");

function ensureDir() {
  if (!fs.existsSync(CHATS_DIR)) {
    fs.mkdirSync(CHATS_DIR, { recursive: true, mode: 0o700 });
  }
}

function fileFor(id, suffix) {
  return path.join(CHATS_DIR, id + suffix);
}

function atomicWrite(filePath, data) {
  ensureDir();
  const json = JSON.stringify(data, null, 2);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmp = path.join(dir, "." + base + "." + Date.now() + ".tmp");

  fs.writeFileSync(tmp, json, { mode: 0o600 });
  const fd = fs.openSync(tmp, "r");
  fs.fsyncSync(fd);
  fs.closeSync(fd);

  try {
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, filePath + ".bak");
    }
  } catch (_) {}

  fs.renameSync(tmp, filePath);
}

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function loadChatFile(id) {
  const primary = fileFor(id, ".json");
  const backup = fileFor(id, ".json.bak");

  const data = loadJSON(primary);
  if (data && data.id === id) return data;

  const bak = loadJSON(backup);
  if (bak && bak.id === id) {
    try { fs.copyFileSync(backup, primary); } catch (_) {}
    return bak;
  }

  return null;
}

function saveChat(chat) {
  if (!chat || !chat.id) return false;
  ensureDir();
  atomicWrite(fileFor(chat.id, ".json"), chat);
  return true;
}

function loadAllChats() {
  ensureDir();
  const chats = [];
  let entries;
  try {
    entries = fs.readdirSync(CHATS_DIR);
  } catch (_) {
    return [];
  }
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const id = entry.replace(/\.json$/, "");
    const chat = loadChatFile(id);
    if (chat && chat.id) {
      chats.push(chat);
    }
  }
  return chats;
}

function deleteChat(id) {
  const files = [".json", ".json.bak", ".json.old"];
  for (const suffix of files) {
    try {
      const p = fileFor(id, suffix);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }
}

function migrateFromConfig(configChats) {
  if (!Array.isArray(configChats) || configChats.length === 0) return 0;
  ensureDir();
  let count = 0;
  for (const chat of configChats) {
    if (chat && chat.id) {
      saveChat(chat);
      count++;
    }
  }
  return count;
}

module.exports = {
  loadAllChats,
  saveChat,
  loadChatFile,
  deleteChat,
  migrateFromConfig,
};
