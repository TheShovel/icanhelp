const { app, BrowserWindow, ipcMain, screen, shell, Menu } = require("electron");
const path = require("path");
const { marked } = require("marked");
const { streamLLM, validateConfig, fetchModels } = require("./llm");
const { loadConfig, saveConfig, saveEffort, saveWindowPosition, loadWindowPosition } = require("./store");

marked.setOptions({ breaks: true, gfm: true });

let mainWindow;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  var savedPos = loadWindowPosition();

  mainWindow = new BrowserWindow({
    width: 88,
    height: 88,
    x: savedPos ? savedPos.x : width - 108,
    y: savedPos ? savedPos.y : height - 108,
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

  mainWindow.on("moved", function () {
    var pos = mainWindow.getPosition();
    saveWindowPosition(pos[0], pos[1]);
  });

  mainWindow.webContents.setWindowOpenHandler(function ({ url }) {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  ipcMain.on("drag-window", (event, { deltaX, deltaY }) => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
    saveWindowPosition(x + deltaX, y + deltaY);
  });

  ipcMain.on("resize-window", (event, { width, height }) => {
    const [x, y] = mainWindow.getPosition();
    const [currentW, currentH] = mainWindow.getSize();
    var newX = x + currentW - width;
    var newY = y + currentH - height;
    mainWindow.setBounds({ x: newX, y: newY, width, height });
    saveWindowPosition(newX, newY);
  });

  ipcMain.on("start-llm-stream", function (event, payload) {
    runLLMLoop(event, payload.messages, payload.effort);
  });

  async function runLLMLoop(event, messages, effort) {
    var stream;
    try {
      stream = await streamLLM(messages, effort);
    } catch (e) {
      event.sender.send("llm-chunk", { error: e.message });
      return;
    }

    if (stream === null) {
      event.sender.send("llm-chunk", {
        error:
          "No API key configured. Open the assistant and use the setup screen to configure your LLM provider.",
      });
      return;
    }

    var reader = stream.getReader();
    var decoder = new TextDecoder();
    var buf = "";
    var toolCalls = [];

    while (true) {
      var result = await reader.read();
      if (result.done) break;

      buf += decoder.decode(result.value, { stream: true });
      var lines = buf.split("\n");
      buf = lines.pop() || "";

      for (var line of lines) {
        var trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        var data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          var parsed = JSON.parse(data);
          var choice = parsed.choices?.[0];
          if (!choice) continue;
          var finish = choice.finish_reason;
          var delta = choice.delta || {};

          if (delta.content) {
            event.sender.send("llm-chunk", { text: delta.content });
          }
          if (delta.reasoning_content) {
            event.sender.send("llm-chunk", { thinking: delta.reasoning_content });
          }

          if (delta.tool_calls) {
            for (var tc of delta.tool_calls) {
              var idx = tc.index;
              if (!toolCalls[idx]) {
                toolCalls[idx] = {
                  id: tc.id || "",
                  function: { name: "", arguments: "" },
                };
              }
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function) {
                if (tc.function.name) toolCalls[idx].function.name = tc.function.name;
                if (tc.function.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
              }
            }
          }

          if (finish === "tool_calls") {
            // tool calls complete — execution happens after the loop
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    var pendingSudo = null;

    ipcMain.on("sudo-response", function (_, pw) {
      if (pendingSudo) {
        pendingSudo(pw);
        pendingSudo = null;
      }
    });

    if (toolCalls.length > 0) {
      var { executeToolCall } = require("./tools/registry");
      for (var tc of toolCalls) {
        if (!tc.id || !tc.function.name) continue;
        var args = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}

        event.sender.send("llm-chunk", {
          tool_start: { name: tc.function.name, args: args },
        });

        var onSudoPrompt = async function () {
          event.sender.send("llm-chunk", { sudo_prompt: {} });
          return await new Promise(function (resolve) {
            pendingSudo = resolve;
          });
        };

        var result = await executeToolCall(tc, { onSudoPrompt: onSudoPrompt });
        event.sender.send("llm-chunk", {
          tool_end: { name: tc.function.name, output: result },
        });
        messages.push({
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: tc.id,
              type: "function",
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            },
          ],
        });
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
      // loop for next response
      await runLLMLoop(event, messages, effort);
    } else {
      event.sender.send("llm-chunk", { done: true });
    }
  }

  ipcMain.handle("get-config", () => {
    const cfg = loadConfig();
    return cfg ? { provider: cfg.provider, model: cfg.model, endpoint: cfg.endpoint, reasoningEffort: cfg.reasoningEffort } : null;
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

  ipcMain.handle("save-effort", (_event, effort) => {
    saveEffort(effort);
    return true;
  });

  ipcMain.handle("parse-markdown", (_event, text) => {
    return marked.parse(text);
  });

  if (process.env.ELECTRON_DEV) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  ipcMain.on("show-context-menu", function () {
    var template = [
      {
        label: "Settings",
        click: function () {
          mainWindow.webContents.send("open-settings");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: function () { app.quit(); },
      },
    ];
    var menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });
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
