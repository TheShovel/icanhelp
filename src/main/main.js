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
const katex = require("katex");
const { runLocalChatLoop, generateDocument, preloadModel, disposeModel, disposeCachedContext } = require("./llm-local");
const {
  RECOMMENDED_MODELS,
  listDownloadedModels,
  deleteModel,
  downloadModel,
  getSystemInfo,
  getCompatibleModels,
  getExtraModels,
} = require("./model-manager");
const {
  loadConfig,
  saveConfig,
  saveWindowPosition,
  loadWindowPosition,
  loadChats,
  saveChats,
  saveChat,
  deleteChat,
  loadThemes,
  saveTheme,
  deleteTheme,
  isDefaultTheme,
  getDefaultThemeNames,
  loadActiveTheme,
  saveActiveTheme,
  getActiveBuddySkin,
  setActiveBuddySkin,
} = require("./store");
const { createTray } = require("./tray");
const {
  setProgressCallback,
  setLowEndDevice,
  loadPipeline,
  shutdownVision,
} = require("./vision");
const {
  prepareAttachment,
  supportedAttachmentExtensions,
} = require("./attachments");
const { appPath, visionLog, ocrLog } =
  require("./paths");
const AdmZip = require("adm-zip");
const { buildDocxFromMarkdown } = require("./tools/docx");

marked.use({ breaks: true, gfm: true });

const CONFIG_DIR = path.join(os.homedir(), ".config", "icanhelp");
const BUDDY_SKINS_DIR = path.join(CONFIG_DIR, "buddySkins");

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

  ipcMain.on("sudo-response", function (_, password) {
    if (pendingSudo) {
      pendingSudo(password || "");
      pendingSudo = null;
    }
  });

  ipcMain.on("close-window", function () {});
  setProgressCallback(function (info) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("vision-download-progress", info);
    }
  });

  setTimeout(async function () {
    var totalRamGB = os.totalmem() / (1024 * 1024 * 1024);
    setLowEndDevice(totalRamGB < 8);
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
    disposeCachedContext();
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

  function gatherResearchContext(messages) {
    var research = [];
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      if (msg.role !== "tool") continue;
      try {
        var parsed = JSON.parse(msg.content);
        if (Array.isArray(parsed)) {
          for (var j = 0; j < parsed.length; j++) {
            if (parsed[j].title && parsed[j].snippet) {
              research.push(parsed[j]);
            }
          }
        } else if (parsed && parsed.title && (parsed.text || parsed.snippet)) {
          research.push({
            title: parsed.title,
            snippet: (parsed.text || parsed.snippet || "").slice(0, 2000),
            url: parsed.url || "",
          });
        }
      } catch (_) {}
    }
    return research;
  }

  async function runLocalLLMLoop(event, messages, effort, signal) {
    console.log("[main] runLocalLLMLoop started");
    if (signal && signal.aborted) return;
    var cfg = loadConfig() || {};
    console.log("[main] Config loaded:", cfg);
    const { tools } = require("./tools/registry");
    const { executeToolCall, resetToolBudget } = require("./tools/registry");
    resetToolBudget();

    // Detect document requests and inject a mandatory instruction.
    var lastUserMsg = "";
    for (var mi = messages.length - 1; mi >= 0; mi--) {
      if (messages[mi].role === "user") { lastUserMsg = messages[mi].content || ""; break; }
    }
    var isDocRequest = /\b(write|create|make|generate)\b.*\b(doc\b|docx|document|report|essay|article|letter|guide|spec|proposal|paper|write.?up)\b/i.test(lastUserMsg)
      || /\b(doc\b|docx|document|report|essay|article|letter|guide|spec|proposal|paper)\b.*\b(write|create|make|generate|draft)\b/i.test(lastUserMsg)
      || /\b(create|write|make|generate) (a|the) doc\b/i.test(lastUserMsg);

    // Don't re-trigger document generation if a docx was already produced in this conversation.
    var alreadyHasDoc = false;
    if (isDocRequest) {
      for (var mj = 0; mj < messages.length; mj++) {
        var mmsg = messages[mj];
        // Check tool results stored in assistant message metadata.
        var msgTools = mmsg.tools;
        if (!msgTools && mmsg.role === "tool") {
          // Legacy: standalone tool message.
          try { var pc = JSON.parse(mmsg.content); if (pc) msgTools = [pc]; } catch (_) {}
        }
        if (msgTools) {
          for (var tk = 0; tk < msgTools.length; tk++) {
            var t = msgTools[tk];
            if (t.name === "create_docx" && t.output) {
              try {
                var tco = JSON.parse(t.output);
                if (tco && tco.ok && tco.path && /\.docx$/i.test(tco.path)) {
                  alreadyHasDoc = true;
                  break;
                }
              } catch (_) {}
            }
          }
        }
        if (alreadyHasDoc) break;
      }
    }

    if (isDocRequest) {
      // If a document already exists in this conversation, nudge the LLM
      // that it CAN regenerate, but don't force it.
      var reminder = alreadyHasDoc
        ? "[SYSTEM NOTE: The user may be asking you to refine the existing document. If they want a new version, call create_docx with an updated description. Otherwise, just respond conversationally.]"
        : "[SYSTEM REMINDER: The user wants a document. You MUST call create_docx(description, filename) after 2-4 quick searches. Do not write the document yourself — call create_docx. Do this by tool 4 at the latest.]";
      console.log("[main] Document request detected, injecting instruction");
      messages = messages.slice();
      messages.splice(messages.length - 1, 0, {
        role: "user",
        content: reminder,
      });
    }

    var pendingDocSession = null;
    var gatheredResearch = [];
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
          if (chunk.tool_generating) {
            event.sender.send("llm-chunk", { tool_generating: chunk.tool_generating });
          }
        },
        onToolStart: async function (info) {
          console.log(
            "[main] onToolStart ENTER:", info.name, Date.now(),
          );
          event.sender.send("llm-chunk", {
            tool_start: { name: info.name, args: info.args },
          });
          console.log(
            "[main] onToolStart IPC sent:", info.name, Date.now(),
          );
        },
        onToolEnd: function (info) {
          console.log(
            "[main] tool_end:",
            info.name,
            "output len:",
            info.output.length,
          );
          // For create_docx with a pending doc session, suppress tool_end here.
          // The final tool_end (with the docx result) is sent after doc generation.
          if (pendingDocSession && info.name === "create_docx") {
            console.log("[main] Suppressing tool_end for create_docx (doc session pending)");
            return;
          }
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

          // Capture research results for document generation.
          if (name === "search_web" || name === "extract_webpage") {
            try {
              var parsed = JSON.parse(String(result));
              if (Array.isArray(parsed)) {
                for (var ri = 0; ri < parsed.length; ri++) {
                  if (parsed[ri].title && parsed[ri].snippet) {
                    gatheredResearch.push(parsed[ri]);
                  }
                }
              } else if (parsed && parsed.title && (parsed.text || parsed.snippet)) {
                gatheredResearch.push({
                  title: parsed.title,
                  snippet: (parsed.text || parsed.snippet || "").slice(0, 2000),
                  url: parsed.url || "",
                });
              }
            } catch (_) {}
          }

          // Detect document session request from create_docx.
          if (name === "create_docx") {
            try {
              var docParsed = JSON.parse(String(result));
              if (docParsed.__doc_pending__) {
                pendingDocSession = {
                  description: docParsed.description || args.description || "",
                  filename: docParsed.filename || args.filename || "document",
                };
                console.log("[main] Document session requested:", pendingDocSession.description);
              }
            } catch (_) {}
          }

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

    // After the main chat loop exits, check if a document session was requested.
    // Also auto-trigger if the user asked for a document but the model never called
    // create_docx (hit tool limit, timed out, etc).
    if (!pendingDocSession && isDocRequest && !alreadyHasDoc) {
      console.log("[main] Document was requested but never created — auto-triggering");
      var filename = "document";
      var description = lastUserMsg.slice(0, 200);
      // Try to extract a reasonable filename from the user's request.
      var fnMatch = lastUserMsg.match(/about\s+(.+?)(?:\s*\.|\s*$|\s+and|\s+with|\s+in|\s+for)/i);
      if (fnMatch && fnMatch[1]) {
        filename = fnMatch[1].replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 40) || "document";
      }
      pendingDocSession = { description: description, filename: filename };
    }

    if (pendingDocSession) {
      console.log("[main] Starting document generation session");
      console.log("[main] Research gathered during this turn:", gatheredResearch.length, "sources");

      event.sender.send("llm-chunk", {
        doc_stream_start: {
          filename: pendingDocSession.filename,
          description: pendingDocSession.description,
        },
      });

      var docSignal = new AbortController();
      var docAbortHandler = function () { docSignal.abort(); };
      if (signal) signal.addEventListener("abort", docAbortHandler);

      try {
        var markdown = await generateDocument({
          description: pendingDocSession.description,
          researchContext: gatheredResearch,
          filename: pendingDocSession.filename,
          config: cfg,
          signal: docSignal.signal,
          onChunk: function (chunk) {
            if (chunk.text) {
              event.sender.send("llm-chunk", { doc_stream_chunk: chunk.text });
            }
            if (chunk.doc_stream_think) {
              event.sender.send("llm-chunk", { doc_stream_think: chunk.doc_stream_think });
            }
            if (chunk.doc_status) {
              event.sender.send("llm-chunk", { doc_status: chunk.doc_status });
            }
            if (chunk.error) {
              event.sender.send("llm-chunk", { error: chunk.error });
            }
          },
        });

        if (markdown && markdown.trim()) {
          console.log("[main] Document generated, length:", markdown.length);
          var docxResult = buildDocxFromMarkdown(markdown, pendingDocSession.filename);
          console.log("[main] Docx result:", docxResult.ok ? "ok" : "error");

          event.sender.send("llm-chunk", {
            tool_end: {
              name: "create_docx",
              output: JSON.stringify(docxResult),
            },
          });
        } else {
          event.sender.send("llm-chunk", {
            tool_end: {
              name: "create_docx",
              output: JSON.stringify({ error: "Document generation produced no content." }),
            },
          });
        }
      } catch (e) {
        console.error("[main] Document generation failed:", e.message);
        event.sender.send("llm-chunk", {
          tool_end: {
            name: "create_docx",
            output: JSON.stringify({ error: "Document generation failed: " + (e.message || String(e)) }),
          },
        });
      } finally {
        if (signal) signal.removeEventListener("abort", docAbortHandler);
      }

      event.sender.send("llm-chunk", { doc_stream_end: true });
    }

    console.log("[main] Sending done");
    event.sender.send("llm-chunk", { done: true });
    console.log("[main] Done sent");
  }

  ipcMain.handle("render-math", async function (_, tex, displayMode) {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: !!displayMode });
  } catch (e) {
    return tex;
  }
});

ipcMain.handle("get-config", () => {
    const cfg = loadConfig();
    return cfg
      ? {
          modelPath: cfg.modelPath || "",
          batchSize: cfg.batchSize || 512,
          gpuLayers: cfg.gpuLayers != null ? cfg.gpuLayers : "max",
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
    saveChats(chats);
    return true;
  });
  ipcMain.handle("save-chat", function (_, chat) {
    saveChat(chat);
    return true;
  });
  ipcMain.handle("delete-chat", function (_, chatId) {
    deleteChat(chatId);
    return true;
  });

  ipcMain.handle("load-themes", function () {
    return loadThemes();
  });

  ipcMain.handle("save-theme", function (_, name, properties) {
    if (isDefaultTheme(name)) return false;
    saveTheme(name, properties);
    return true;
  });

  ipcMain.handle("delete-theme", function (_, name) {
    if (isDefaultTheme(name)) return false;
    deleteTheme(name);
    mainWindow.webContents.send("themes-changed");
    return true;
  });

  ipcMain.handle("get-default-themes", function () {
    return getDefaultThemeNames();
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

  ipcMain.handle("get-extra-models", function () {
    return getExtraModels();
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

  ipcMain.handle("preload-vision", async function () {
    try {
      var ok = await loadPipeline();
      return { ok: ok };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("reset-all-data", function () {
    const dirs = [
      path.join(os.homedir(), ".config", "icanhelp"),
      appPath("models"),
      visionLog(),
      ocrLog(),
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
    text = text.replace(/^(#{1,6})(?=[^#\s])/gm, "$1 ");
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

  ipcMain.on("quit-app", () => process.kill(process.pid, "SIGKILL"));

  ipcMain.on("restart-app", () => {
    // Schedule a relaunch, then hard-kill the process. A graceful quit runs
    // the native model/llama teardown which can throw an uncaught Napi::Error
    // (std::terminate) when switching GPU/CPU backends. SIGKILL skips that
    // cleanup path entirely so the crash can't happen.
    app.relaunch({ args: process.argv.slice(1) });
    process.kill(process.pid, "SIGKILL");
  });

  ipcMain.handle("open-file", async (_event, filePath) => {
    return await shell.openPath(filePath);
  });

  ipcMain.handle("save-file-as", async (_event, sourcePath, defaultName) => {
    var result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || path.basename(sourcePath),
      filters: [
        { name: "Word Document", extensions: ["docx"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    try {
      fs.copyFileSync(sourcePath, result.filePath);
      return { ok: true, path: result.filePath };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("open-folder", async (_event, key) => {
    var folder;
    switch (key) {
      case "config":
        folder = path.join(os.homedir(), ".config", "icanhelp");
        break;
      case "models":
        folder = appPath("models");
        break;
      case "buddy-art":
        folder = path.join(__dirname, "..", "..", "assets", "buddyArt");
        break;
    }
    if (folder) {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
      return await shell.openPath(folder);
    }
    return "Invalid folder key";
  });

  ipcMain.handle("import-buddy-skin", async function () {
    var result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "ZIP files", extensions: ["zip"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, error: "Cancelled" };
    }

    var zipPath = result.filePaths[0];
    var skinName = path.basename(zipPath, ".zip");

    try {
      var zip = new AdmZip(zipPath);
      var entries = zip.getEntries();

      // Determine the skin directory: files might be at root or in a subfolder
      var expectedFiles = ["idle.png", "talking.png", "thinking.png", "bash.png", "search.png"];
      var foundFiles = {};

      for (var entry of entries) {
        var entryName = path.basename(entry.entryName);
        if (expectedFiles.indexOf(entryName) !== -1 && !entry.isDirectory) {
          foundFiles[entryName] = entry;
        }
      }

      // If not all found at root, check first-level subdirectories
      if (Object.keys(foundFiles).length < expectedFiles.length) {
        foundFiles = {};
        var prefix = null;
        for (var entry of entries) {
          var parts = entry.entryName.split("/");
          if (parts.length === 2 && !entry.isDirectory) {
            var name = parts[1];
            if (expectedFiles.indexOf(name) !== -1) {
              if (!prefix) prefix = parts[0];
              if (parts[0] === prefix) {
                foundFiles[name] = entry;
              }
            }
          }
        }
      }

      var missing = expectedFiles.filter(function (f) { return !foundFiles[f]; });
      if (missing.length > 0) {
        return {
          ok: false,
          error: "Missing images in ZIP: " + missing.join(", "),
        };
      }

      // Ensure skin directory doesn't conflict; uniquify if needed
      var targetDir = path.join(BUDDY_SKINS_DIR, skinName);
      var finalName = skinName;
      var counter = 1;
      while (fs.existsSync(targetDir)) {
        finalName = skinName + "_" + counter;
        targetDir = path.join(BUDDY_SKINS_DIR, finalName);
        counter++;
      }

      if (!fs.existsSync(BUDDY_SKINS_DIR)) {
        fs.mkdirSync(BUDDY_SKINS_DIR, { recursive: true, mode: 0o700 });
      }
      fs.mkdirSync(targetDir, { mode: 0o700 });

      // Extract the found PNG files
      for (var name in foundFiles) {
        var entry = foundFiles[name];
        var destPath = path.join(targetDir, name);
        fs.writeFileSync(destPath, entry.getData());
      }

      setActiveBuddySkin(finalName);

      return { ok: true, name: finalName };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle("reset-buddy-skin", async function () {
    setActiveBuddySkin(null);
    return { ok: true };
  });

  ipcMain.handle("get-active-buddy-skin", async function () {
    return { name: getActiveBuddySkin() };
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
          process.kill(process.pid, "SIGKILL");
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
    var cleanPath = url.pathname.replace(/^\//, "");
    var filePath;

    if (subdir === "buddyArt") {
      var activeSkin = getActiveBuddySkin();
      if (activeSkin) {
        var skinDir = path.join(BUDDY_SKINS_DIR, activeSkin);
        var skinPath = path.join(skinDir, cleanPath);
        if (fs.existsSync(skinPath)) {
          filePath = skinPath;
        }
      }
    }

    if (!filePath) {
      filePath = path.join(assetsDir, subdir, cleanPath);
    }

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
  if (process.platform !== "darwin") process.kill(process.pid, "SIGKILL");
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
