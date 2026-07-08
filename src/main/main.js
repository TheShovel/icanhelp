const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  shell,
  Menu,
  protocol,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { marked } = require("marked");
const { streamLLM, validateConfig, fetchModels } = require("./llm");
const {
  loadConfig,
  saveConfig,
  saveEffort,
  saveModel,
  saveWindowPosition,
  loadWindowPosition,
  loadChats,
  saveChats,
  loadThemes,
  saveTheme,
  deleteTheme,
  loadActiveTheme,
  saveActiveTheme,
} = require("./store");
const { createTray } = require("./tray");
const {
  setProgressCallback,
  loadPipeline,
  shutdownVision,
} = require("./vision");
const {
  prepareAttachment,
  supportedAttachmentExtensions,
} = require("./attachments");

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

  setProgressCallback(function (info) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("vision-download-progress", info);
    }
  });

  setTimeout(function () {
    loadPipeline();
  }, 500);

  mainWindow.webContents.on("did-finish-load", function () {
    var activeName = loadActiveTheme();
    if (activeName) {
      var themes = loadThemes();
      var theme = themes[activeName];
      if (theme && theme.properties) {
        mainWindow.webContents.send("apply-theme", theme.properties);
      }
    }
  });

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

  var currentAbort = null;

  ipcMain.on("cancel-stream", function () {
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
  });

  ipcMain.on("start-llm-stream", function (event, payload) {
    currentAbort = new AbortController();
    runLLMLoop(
      event,
      payload.messages,
      payload.effort,
      currentAbort.signal,
    ).catch(function (err) {
      event.sender.send("llm-chunk", { error: err.message });
      event.sender.send("llm-chunk", { done: true });
    });
  });

  async function runLLMLoop(event, messages, effort, signal) {
    if (signal && signal.aborted) return;
    var stream;
    try {
      stream = await streamLLM(messages, effort, signal);
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

    try {
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
              event.sender.send("llm-chunk", {
                thinking: delta.reasoning_content,
              });
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
                  if (tc.function.name)
                    toolCalls[idx].function.name = tc.function.name;
                  if (tc.function.arguments)
                    toolCalls[idx].function.arguments += tc.function.arguments;
                }
              }
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (e) {
      if (e.name === "AbortError") {
        event.sender.send("llm-chunk", { done: true });
      } else {
        event.sender.send("llm-chunk", { error: e.message });
      }
      return;
    }

    var pendingSudo = null;
    var pendingConfirm = null;

    ipcMain.on("sudo-response", function (_, pw) {
      if (pendingSudo) {
        pendingSudo(pw);
        pendingSudo = null;
      }
    });

    ipcMain.on("confirm-response", function (_, ok) {
      if (pendingConfirm) {
        pendingConfirm(ok);
        pendingConfirm = null;
      }
    });

    if (toolCalls.length > 0) {
      try {
        var { executeToolCall } = require("./tools/registry");
        for (var tc of toolCalls) {
          if (!tc.id || !tc.function.name) continue;
          var args = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {}

          event.sender.send("llm-chunk", {
            tool_start: { name: tc.function.name, args: args },
          });

          var onSudoPrompt = async function () {
            event.sender.send("llm-chunk", { sudo_prompt: {} });
            return await new Promise(function (resolve) {
              pendingSudo = resolve;
            });
          };

          var onConfirm = async function (cmd) {
            event.sender.send("llm-chunk", {
              confirm_prompt: { command: cmd },
            });
            return await new Promise(function (resolve) {
              pendingConfirm = resolve;
            });
          };

          var result = await executeToolCall(tc, {
            onSudoPrompt: onSudoPrompt,
            onConfirm: onConfirm,
          });

          if (tc.function.name === "set_theme") {
            try {
              var themeArgs = JSON.parse(tc.function.arguments);
              if (themeArgs.properties) {
                mainWindow.webContents.send(
                  "apply-theme",
                  themeArgs.properties,
                );
                if (themeArgs.name) {
                  saveTheme(themeArgs.name, themeArgs.properties);
                  mainWindow.webContents.send("themes-changed");
                }
              }
            } catch (e) {}
          }

          if (tc.function.name === "delete_theme") {
            try {
              var d = JSON.parse(tc.function.arguments);
              deleteTheme(d.name);
              mainWindow.webContents.send("themes-changed");
            } catch (e) {}
          }

          if (tc.function.name === "apply_theme") {
            try {
              var a = JSON.parse(tc.function.arguments);
              var themes = loadThemes();
              var theme = themes[a.name];
              if (theme && theme.properties) {
                saveActiveTheme(a.name);
                mainWindow.webContents.send("apply-theme", theme.properties);
                mainWindow.webContents.send("themes-changed");
              }
            } catch (e) {}
          }

          if (tc.function.name === "list_themes") {
            var allThemes = loadThemes();
            result = JSON.stringify({ themes: Object.keys(allThemes) });
          }

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
        await runLLMLoop(event, messages, effort, signal);
      } catch (e) {
        event.sender.send("llm-chunk", { error: "Tool error: " + e.message });
        event.sender.send("llm-chunk", { done: true });
      }
    } else {
      event.sender.send("llm-chunk", { done: true });
    }
  }

  ipcMain.handle("get-config", () => {
    const cfg = loadConfig();
    return cfg
      ? {
          provider: cfg.provider,
          model: cfg.model,
          endpoint: cfg.endpoint,
          reasoningEffort: cfg.reasoningEffort,
        }
      : null;
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

  ipcMain.handle("save-model", (_event, model) => {
    saveModel(model);
    return true;
  });

  ipcMain.handle("load-chats", function () {
    return loadChats();
  });
  ipcMain.handle("save-chats", function (_, chats) {
    saveChats(chats);
    return true;
  });

  ipcMain.handle("load-themes", function () {
    return loadThemes();
  });

  ipcMain.handle("save-theme", function (_, name, properties) {
    saveTheme(name, properties);
    return true;
  });

  ipcMain.handle("delete-theme", function (_, name) {
    deleteTheme(name);
    mainWindow.webContents.send("themes-changed");
    return true;
  });

  ipcMain.handle("load-active-theme", function () {
    var name = loadActiveTheme();
    if (!name) return null;
    var themes = loadThemes();
    var theme = themes[name];
    return theme ? { name: name, properties: theme.properties } : null;
  });

  ipcMain.handle("apply-theme", function (_, name) {
    var themes = loadThemes();
    var theme = themes[name];
    if (theme && theme.properties) {
      saveActiveTheme(name);
      mainWindow.webContents.send("apply-theme", theme.properties);
      mainWindow.webContents.send("themes-changed");
      return true;
    }
    return false;
  });

  ipcMain.handle("reset-active-theme", function () {
    saveActiveTheme(null);
    return true;
  });

  ipcMain.handle("parse-markdown", (_event, text) => {
    return marked.parse(text);
  });

  ipcMain.handle("select-attachment", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        {
          name: "Supported files",
          extensions: supportedAttachmentExtensions(),
        },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return await prepareAttachment(result.filePaths[0]);
  });

  if (process.env.ELECTRON_DEV) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  ipcMain.on("quit-app", () => app.quit());

  ipcMain.handle("open-file", async (_event, filePath) => {
    return await shell.openPath(filePath);
  });

  ipcMain.on("show-context-menu", function () {
    var template = [
      {
        label: "Chat History",
        click: function () {
          mainWindow.webContents.send("open-chat-list");
        },
      },
      {
        label: "Settings",
        click: function () {
          mainWindow.webContents.send("open-settings");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: function () {
          app.quit();
        },
      },
    ];
    var menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });
}

var assetsDir = path.join(__dirname, "..", "..", "assets");

app.whenReady().then(function () {
  protocol.handle("asset", function (request) {
    var url = new URL(request.url);
    var subdir = url.host === "buddyart" ? "buddyArt" : url.host;
    var filePath = path.join(assetsDir, subdir, url.pathname);
    try {
      return new Response(fs.readFileSync(filePath), {
        headers: { "content-type": "image/png" },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
  createWindow();
  createTray(mainWindow);
});

app.on("before-quit", function () {
  shutdownVision();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
