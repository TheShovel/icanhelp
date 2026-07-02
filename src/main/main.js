const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const { streamLLM, validateConfig, fetchModels } = require("./llm");
const { loadConfig, saveConfig } = require("./store");

let mainWindow;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 88,
    height: 88,
    x: width - 108,
    y: height - 108,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    type: "toolbar",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  ipcMain.on("drag-window", (event, { deltaX, deltaY }) => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  });

  ipcMain.on("resize-window", (event, { width, height }) => {
    const [x, y] = mainWindow.getPosition();
    const [currentW, currentH] = mainWindow.getSize();
    mainWindow.setBounds({
      x: x + currentW - width,
      y: y + currentH - height,
      width,
      height,
    });
  });

  ipcMain.on("start-llm-stream", async (event, messages) => {
    const stream = await streamLLM(messages);
    if (stream === null) {
      event.sender.send("llm-chunk", {
        error:
          "No API key configured. Open the assistant and use the setup screen to configure your LLM provider.",
      });
      return;
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const choice = parsed.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta || {};
          const content = delta.content || "";
          if (content) {
            event.sender.send("llm-chunk", { text: content });
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    event.sender.send("llm-chunk", { done: true });
  });

  ipcMain.handle("get-config", () => {
    const cfg = loadConfig();
    return cfg ? { provider: cfg.provider, model: cfg.model, endpoint: cfg.endpoint } : null;
  });

  ipcMain.handle("has-config", () => {
    return loadConfig() !== null;
  });

  ipcMain.handle("save-config", async (_event, config) => {
    const result = await validateConfig(config);
    if (!result.valid) {
      throw new Error(result.error);
    }
    saveConfig(config);
    return true;
  });

  ipcMain.handle("validate-stored-config", async () => {
    const cfg = loadConfig();
    if (!cfg) return { valid: false, error: "No config found" };
    return await validateConfig(cfg);
  });

  ipcMain.handle("fetch-models", async (_event, config) => {
    return await fetchModels(config);
  });

  if (process.env.ELECTRON_DEV) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
