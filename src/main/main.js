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
const os = require("os");
const { execFile } = require("child_process");
const { marked } = require("marked");
const { runLocalChatLoop } = require("./llm-local");
const { preloadModel } = require("./llm-local");
const { disposeModel } = require("./llm-local");
const {
  RECOMMENDED_MODELS,
  listDownloadedModels,
  deleteModel,
  downloadModel,
  getSystemInfo,
  getCompatibleModels,
} = require("./model-manager");
const {
  loadConfig,
  saveConfig,
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
const { searchKnowledge } = require("./rag");

marked.setOptions({ breaks: true, gfm: true });

let mainWindow;
let pendingSudo = null;
let pendingConfirm = null;

function requestSudoPassword(event) {
  event.sender.send("llm-chunk", { sudo_prompt: {} });
  return new Promise(function (resolve) {
    pendingSudo = resolve;
  });
}

function createWindow() {
  var startupCfg = loadConfig();
  console.log(
    "[main] startup config:",
    startupCfg ? "keys: " + Object.keys(startupCfg).join(", ") : "NULL",
  );
  if (startupCfg) {
    console.log(
      "[main]   themes:",
      startupCfg.themes
        ? Object.keys(startupCfg.themes).length + " themes"
        : "none",
    );
    console.log(
      "[main]   chats:",
      startupCfg.chats ? startupCfg.chats.length + " chats" : "none",
    );
  }
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
  var pendingConfirm = null;

  ipcMain.on("confirm-response", function (_, ok) {
    if (pendingConfirm) {
      pendingConfirm(ok);
      pendingConfirm = null;
    }
  });

  ipcMain.on("close-window", function () {});
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
    var cfg = loadConfig() || {};
    console.log("[main] start-llm-stream, modelPath:", cfg.modelPath);
    runLocalLLMLoop(
      event,
      payload.messages,
      payload.effort,
      currentAbort.signal,
    ).catch(function (err) {
      event.sender.send("llm-chunk", { error: err.message });
      event.sender.send("llm-chunk", { done: true });
    });
  });

  async function runLocalLLMLoop(event, messages, effort, signal) {
    if (signal && signal.aborted) return;
    var cfg = loadConfig() || {};
    const { tools } = require("./tools/registry");
    const { executeToolCall } = require("./tools/registry");

    // Auto-search knowledge base for the latest user message
    try {
      var lastUser = messages
        .filter(function (m) {
          return m.role === "user";
        })
        .pop();
      if (lastUser && lastUser.content) {
        var kbResult = await searchKnowledge(lastUser.content, 5);
        var kbParsed = JSON.parse(kbResult);
        if (kbParsed.results && kbParsed.results.length > 0) {
          var highValue = kbParsed.results.filter(function (r) {
            return parseFloat(r.similarity) > 0.35;
          });
          if (highValue.length > 0) {
            var contextLines = highValue.map(function (r) {
              return "[KB: " + r.similarity + "] " + r.text;
            });
            messages.unshift({
              role: "system",
              content:
                "Relevant knowledge base entries:\n" + contextLines.join("\n"),
            });
            console.log(
              "[main] Injected " + highValue.length + " knowledge entries",
            );
          }
        }
      }
    } catch (e) {
      console.log("[main] Auto-knowledge search failed:", e.message);
    }

    var pendingConfirm = null;
    var retries = 0;
    var maxRetries = 2;

    while (true) {
      var loopError = null;

      await runLocalChatLoop({
        modelPath: cfg.modelPath,
        messages: messages,
        tools: tools,
        config: cfg,
        signal: signal,
        onChunk: function (chunk) {
          if (chunk.error) {
            console.log("[main] LLM error:", chunk.error);
            if (
              chunk.error.indexOf("stuck in a loop") !== -1 &&
              retries < maxRetries
            ) {
              loopError = chunk.error;
              return;
            }
            event.sender.send("llm-chunk", { error: chunk.error });
          }
          if (loopError) return;
          if (chunk.text) event.sender.send("llm-chunk", { text: chunk.text });
          if (chunk.thinking)
            event.sender.send("llm-chunk", { thinking: chunk.thinking });
          if (chunk.replaceText !== undefined)
            event.sender.send("llm-chunk", { replaceText: chunk.replaceText });
          if (chunk.sudo_prompt) {
            event.sender.send("llm-chunk", { sudo_prompt: chunk.sudo_prompt });
          }
        },
        onToolStart: async function (info) {
          console.log(
            "[main] tool_start:",
            info.name,
            JSON.stringify(info.args),
          );
          event.sender.send("llm-chunk", {
            tool_start: { name: info.name, args: info.args },
          });
        },
        onToolEnd: function (info) {
          console.log(
            "[main] tool_end:",
            info.name,
            "output len:",
            info.output.length,
          );
          event.sender.send("llm-chunk", {
            tool_end: { name: info.name, output: info.output },
          });
        },
        executeTool: async function (name, args) {
          var tc = {
            id: "local-" + Date.now(),
            function: { name: name, arguments: JSON.stringify(args) },
          };

          var onSudoPrompt = async function () {
            return await requestSudoPassword(event);
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
            onOutput:
              name === "run_bash"
                ? function (chunk) {
                    event.sender.send("llm-chunk", {
                      tool_chunk: { name: name, chunk: chunk },
                    });
                  }
                : null,
          });

          if (name === "set_theme") {
            try {
              var props = args.properties;
              if (typeof props === "string") props = JSON.parse(props);
              if (
                props &&
                typeof props === "object" &&
                Object.keys(props).length > 0
              ) {
                var themeName = args.name || "custom-" + Date.now();
                console.log(
                  "[main] saving theme:",
                  themeName,
                  "keys:",
                  Object.keys(props).length,
                );
                mainWindow.webContents.send("apply-theme", props);
                saveTheme(themeName, props);
                saveActiveTheme(themeName);
                mainWindow.webContents.send("themes-changed");
                console.log("[main] theme saved");
              } else {
                console.log(
                  "[main] set_theme skipped, props type:",
                  typeof props,
                  "keys:",
                  props ? Object.keys(props).length : 0,
                );
              }
            } catch (e) {}
          }
          if (name === "delete_theme") {
            try {
              deleteTheme(args.name);
              mainWindow.webContents.send("themes-changed");
            } catch (e) {}
          }
          if (name === "apply_theme") {
            try {
              var themes = loadThemes();
              var theme = themes[args.name];
              if (theme && theme.properties) {
                saveActiveTheme(args.name);
                mainWindow.webContents.send("apply-theme", theme.properties);
                mainWindow.webContents.send("themes-changed");
              }
            } catch (e) {}
          }
          if (name === "list_themes") {
            var allThemes = loadThemes();
            return JSON.stringify({ themes: Object.keys(allThemes) });
          }

          return String(result);
        },
      });

      if (!loopError) break;

      retries++;
      console.log(
        "[main] Retrying after loop detection (attempt " +
          retries +
          "/" +
          maxRetries +
          ")",
      );
      event.sender.send("llm-chunk", { replaceText: "" });
    }

    console.log("[main] Sending done");
    event.sender.send("llm-chunk", { done: true });
    console.log("[main] Done sent");
  }

  ipcMain.handle("get-config", () => {
    const cfg = loadConfig();
    return cfg
      ? {
          modelPath: cfg.modelPath || "",
          gpu: cfg.gpu !== false,
          contextSize: cfg.contextSize || 8192,
        }
      : null;
  });

  ipcMain.handle("has-config", () => {
    return loadConfig() !== null;
  });

  ipcMain.handle("save-config", async (_event, config) => {
    var existing = loadConfig() || {};
    Object.assign(existing, config);
    saveConfig(existing);
    return true;
  });

  ipcMain.handle("load-chats", function () {
    return loadChats();
  });
  ipcMain.handle("save-chats", function (_, chats) {
    console.log("[main] save-chats IPC, count:", chats ? chats.length : 0);
    saveChats(chats);
    console.log("[main] save-chats done");
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

  ipcMain.handle("get-recommended-models", function () {
    return RECOMMENDED_MODELS;
  });

  ipcMain.handle("get-system-info", function () {
    return getSystemInfo();
  });

  ipcMain.handle("get-compatible-models", function () {
    return getCompatibleModels();
  });

  ipcMain.handle("list-downloaded-models", function () {
    return listDownloadedModels();
  });

  ipcMain.handle("download-model", async function (event, modelId) {
    try {
      return await downloadModel(modelId, function (progress) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("model-download-progress", progress);
        }
      });
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("delete-model", function (_, filename) {
    return deleteModel(filename);
  });

  ipcMain.handle("preload-model", async function () {
    var cfg = loadConfig() || {};
    if (!cfg.modelPath) return { error: "No model configured" };

    try {
      await preloadModel(cfg.modelPath, cfg, function (info) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("model-preload-progress", info);
        }
      });
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("reset-all-data", function () {
    const dirs = [
      path.join(os.homedir(), ".config", "icanhelp"),
      path.join(os.homedir(), ".cache", "icanhelp", "models"),
      path.join(os.homedir(), ".cache", "icanhelp", "knowledge.json"),
      path.join(os.homedir(), ".cache", "icanhelp", "vision.log"),
      path.join(os.homedir(), ".cache", "icanhelp", "ocr.log"),
    ];
    var errors = [];
    for (var p of dirs) {
      try {
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      } catch (e) {
        errors.push(p + ": " + e.message);
      }
    }
    if (errors.length > 0) return { ok: false, errors: errors };
    return { ok: true };
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

  function execCommand(cmd, args) {
    return new Promise(function (resolve, reject) {
      execFile(
        cmd,
        args,
        {
          timeout: 3000,
          env: Object.assign({}, process.env),
        },
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  function detectDistro() {
    try {
      var content = fs.readFileSync("/etc/os-release", "utf8");
      var id = "";
      var idLike = "";
      content.split("\n").forEach(function (line) {
        if (line.startsWith("ID=")) id = line.slice(3).replace(/"/g, "");
        if (line.startsWith("ID_LIKE="))
          idLike = line.slice(8).replace(/"/g, "");
      });
      var combined = id + " " + idLike;
      if (/arch/i.test(combined)) return "arch";
      if (/debian|ubuntu/i.test(combined)) return "debian";
      return id || "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  function installCommand(distro, pkg) {
    if (distro === "arch") return "sudo pacman -S --noconfirm " + pkg;
    if (distro === "debian") return "sudo apt-get install -y " + pkg;
    return null;
  }

  function execSudoCommand(cmd, args, password) {
    return new Promise(function (resolve, reject) {
      var child = require("child_process").spawn("sudo", ["-S"].concat(args), {
        stdio: ["pipe", "ignore", "ignore"],
      });
      child.stdin.write(password + "\n");
      child.stdin.end();
      child.on("close", function (code) {
        if (code === 0) resolve();
        else reject(new Error("sudo exited with code " + code));
      });
      child.on("error", reject);
    });
  }

  ipcMain.handle("take-screenshot", async (event) => {
    var tmpDir = path.join(os.tmpdir(), "icanhelp");
    fs.mkdirSync(tmpDir, { recursive: true });
    var dest = path.join(tmpDir, "screenshot_" + Date.now() + ".png");

    var tools = [
      { cmd: "spectacle", args: ["-b", "-n", "-o", dest] },
      { cmd: "gnome-screenshot", args: ["-f", dest] },
      { cmd: "grim", args: [dest], wayland: true },
      { cmd: "import", args: ["-silent", "-window", "root", dest] },
      { cmd: "maim", args: [dest] },
      { cmd: "scrot", args: [dest] },
    ];

    var triedGrim = false;
    for (var i = 0; i < tools.length; i++) {
      try {
        await execCommand(tools[i].cmd, tools[i].args);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
          return await prepareAttachment(dest);
        }
        if (tools[i].wayland && !triedGrim) {
          triedGrim = true;
          try {
            fs.unlinkSync(dest);
          } catch (e) {}
          var outputs = require("child_process")
            .execSync("grim -o", { env: process.env, timeout: 3000 })
            .toString()
            .trim()
            .split("\n");
          if (outputs.length > 0 && outputs[0]) {
            await execCommand("grim", ["-o", outputs[0], dest]);
            if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
              return await prepareAttachment(dest);
            }
          }
        }
      } catch (e) {}
    }

    var script = [
      "import mss",
      "with mss.mss() as sct:",
      "    sct.shot(output=" + JSON.stringify(dest) + ")",
    ].join("\n");
    try {
      await execCommand("python3", ["-c", script]);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
        return await prepareAttachment(dest);
      }
    } catch (e) {}

    throw new Error(
      "No screenshot tool found. Install grim, gnome-screenshot, imagemagick, maim, or scrot.",
    );
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
  disposeModel();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
