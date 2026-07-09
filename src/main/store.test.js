const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const TEST_DIR = path.join(os.tmpdir(), "icanhelp-test-" + Date.now());
const CONFIG_DIR = path.join(TEST_DIR, ".config", "icanhelp");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.enc");

const origHome = os.homedir;
const origConfigDir = path.join(origHome(), ".config", "icanhelp");
const origConfigFile = path.join(origConfigDir, "config.enc");

function setupTestEnv() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const testMachineId = path.join(TEST_DIR, "machine-id");
  fs.writeFileSync(testMachineId, "test-machine-id-12345");

  os.homedir = () => TEST_DIR;
  fs.readFileSync = (origRead => {
    return (filePath, ...args) => {
      if (filePath === "/etc/machine-id") return "test-machine-id-12345";
      return origRead(filePath, ...args);
    };
  })(fs.readFileSync);
}

function cleanupTestEnv() {
  os.homedir = origHome;
  fs.readFileSync = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(fs),
    "readFileSync"
  )?.value || fs.readFileSync;

  try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (_) {}
}

test("store - round-trip config save/load", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const config = { theme: "dark", fontSize: 14, chats: [] };
    store.saveConfig(config);
    const loaded = store.loadConfig();
    assert.deepStrictEqual(loaded, config);
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadConfig returns null when no config file exists", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
    const result = store.loadConfig();
    assert.strictEqual(result, null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveWindowPosition and loadWindowPosition", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveWindowPosition(100, 200);
    const pos = store.loadWindowPosition();
    assert.deepStrictEqual(pos, { x: 100, y: 200 });
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadWindowPosition returns null when not set", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const result = store.loadWindowPosition();
    assert.strictEqual(result, null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadWindowPosition returns null when partial", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");
    store.saveConfig({ windowX: 100 });
    const result = store.loadWindowPosition();
    assert.strictEqual(result, null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveChats and loadChats", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const chats = [
      { id: "1", name: "Chat 1", messages: [] },
      { id: "2", name: "Chat 2", messages: [] },
    ];
    store.saveChats(chats);
    const loaded = store.loadChats();
    assert.deepStrictEqual(loaded, chats);
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadChats returns empty array when no chats", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const result = store.loadChats();
    assert.deepStrictEqual(result, []);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveChats preserves other config keys", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveWindowPosition(50, 60);
    store.saveChats([{ id: "a", name: "Test", messages: [] }]);

    const cfg = store.loadConfig();
    assert.strictEqual(cfg.windowX, 50);
    assert.strictEqual(cfg.windowY, 60);
    assert.deepStrictEqual(cfg.chats, [{ id: "a", name: "Test", messages: [] }]);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveChats preserves theme settings", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveTheme("dark", { "--bg-panel": "#111" });
    store.saveActiveTheme("dark");
    store.saveChats([{ id: "x", name: "Chat", messages: [] }]);

    const cfg = store.loadConfig();
    assert.strictEqual(cfg.activeTheme, "dark");
    assert.ok(cfg.themes && cfg.themes.dark);
    assert.deepStrictEqual(cfg.chats, [{ id: "x", name: "Chat", messages: [] }]);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveTheme and loadThemes", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveTheme("ocean", { "--bg-panel": "#001f3f", "--accent": "#0074d9" });
    const themes = store.loadThemes();
    assert.ok(themes.ocean);
    assert.deepStrictEqual(themes.ocean.properties, {
      "--bg-panel": "#001f3f",
      "--accent": "#0074d9",
    });
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadThemes returns empty object when no themes", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    assert.deepStrictEqual(store.loadThemes(), {});
  } finally {
    cleanupTestEnv();
  }
});

test("store - deleteTheme removes theme", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveTheme("vapor", { "--bg-panel": "#ff69b4" });
    store.saveTheme("ocean", { "--bg-panel": "#001f3f" });
    store.deleteTheme("vapor");

    const themes = store.loadThemes();
    assert.strictEqual(themes.vapor, undefined);
    assert.ok(themes.ocean);
  } finally {
    cleanupTestEnv();
  }
});

test("store - deleteTheme clears activeTheme if it matches", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveTheme("night", { "--bg-panel": "#000" });
    store.saveActiveTheme("night");
    store.deleteTheme("night");

    assert.strictEqual(store.loadActiveTheme(), null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - deleteTheme does nothing if theme doesn't exist", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveTheme("existing", { "--bg-panel": "#eee" });
    store.deleteTheme("nonexistent");
    assert.ok(store.loadThemes().existing);
  } finally {
    cleanupTestEnv();
  }
});

test("store - saveActiveTheme and loadActiveTheme", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveActiveTheme("midnight");
    assert.strictEqual(store.loadActiveTheme(), "midnight");
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadActiveTheme returns null when not set", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    assert.strictEqual(store.loadActiveTheme(), null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - empty config after save is still loadable", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveConfig({});
    const loaded = store.loadConfig();
    assert.deepStrictEqual(loaded, {});
  } finally {
    cleanupTestEnv();
  }
});

test("store - encryption round-trip with special characters", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const config = {
      unicode: "こんにちは",
      newlines: "line1\nline2\nline3",
      quotes: 'he said "hello"',
      emoji: "🎉✨🚀",
    };
    store.saveConfig(config);
    const loaded = store.loadConfig();
    assert.deepStrictEqual(loaded, config);
  } finally {
    cleanupTestEnv();
  }
});

test("store - large chat history save and load", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const messages = [];
    for (let i = 0; i < 500; i++) {
      messages.push({
        role: i % 2 === 0 ? "user" : "assistant",
        content: "Message " + i + " with some extra padding to make it longer: " + "x".repeat(200),
      });
    }
    const chats = [
      { id: "large-chat", name: "Large Chat", messages, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" },
    ];
    store.saveChats(chats);
    const loaded = store.loadChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].messages.length, 500);
    assert.strictEqual(loaded[0].messages[0].role, "user");
    assert.strictEqual(loaded[0].messages[499].role, "assistant");
    assert.ok(loaded[0].messages[0].content.startsWith("Message 0"));
  } finally {
    cleanupTestEnv();
  }
});

test("store - multiple chat threads save and load", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    const chats = [];
    for (let i = 0; i < 20; i++) {
      chats.push({
        id: "chat-" + i,
        name: "Conversation " + i,
        messages: Array.from({ length: 10 + i }, (_, j) => ({
          role: j % 2 === 0 ? "user" : "assistant",
          content: "Chat " + i + " message " + j,
        })),
      });
    }
    store.saveChats(chats);
    const loaded = store.loadChats();
    assert.strictEqual(loaded.length, 20);
    assert.strictEqual(loaded[19].name, "Conversation 19");
    assert.strictEqual(loaded[19].messages.length, 29);
  } finally {
    cleanupTestEnv();
  }
});

test("store - loadWindowPosition with non-numeric values returns null", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveConfig({ windowX: "onehundred", windowY: 200 });
    assert.strictEqual(store.loadWindowPosition(), null);

    store.saveConfig({ windowX: 100, windowY: null });
    assert.strictEqual(store.loadWindowPosition(), null);
  } finally {
    cleanupTestEnv();
  }
});

test("store - overwrite existing config", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    store.saveConfig({ a: 1, b: 2 });
    store.saveConfig({ c: 3, d: 4 });
    const loaded = store.loadConfig();
    assert.deepStrictEqual(loaded, { c: 3, d: 4 });
  } finally {
    cleanupTestEnv();
  }
});

test("store - corrupted config file returns null", async (t) => {
  setupTestEnv();
  try {
    delete require.cache[require.resolve("./store")];
    const store = require("./store");

    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, "this is not valid encrypted data");
    fs.chmodSync(CONFIG_FILE, 0o600);

    const result = store.loadConfig();
    assert.strictEqual(result, null);
  } finally {
    cleanupTestEnv();
  }
});
