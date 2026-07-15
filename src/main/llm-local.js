const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { modelsDir } = require("./paths");

// Gather real, read-only system info once and cache it, so the system prompt
// can tell the model the actual distro, CPU, GPU, memory, etc. This is more
// reliable than asking the model to probe the system itself. Falls back to a
// generic note if anything fails.
var cachedSysInfo = null;

function sysBinDir() {
  try {
    const dataHome =
      process.env.XDG_DATA_HOME ||
      path.join(require("os").homedir(), ".local", "share");
    return path.join(dataHome, "icanhelp", "bin");
  } catch (e) {
    return null;
  }
}

function run(cmd, args, fallback) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", timeout: 5000 })
      .toString()
      .trim();
  } catch (e) {
    return fallback !== undefined ? fallback : "";
  }
}

function gatherSystemInfo() {
  if (cachedSysInfo) return cachedSysInfo;
  var lines = [];
  // Distro detection via the bundled `sys` CLI (falls back to /etc/os-release).
  var bin = sysBinDir();
  var detect = bin
    ? run("bash", ["-c", bin + "/sys detect 2>/dev/null || true"])
    : "";
  if (!detect) {
    detect = run("bash", [
      "-c",
      "source /etc/os-release 2>/dev/null && echo \"distro=$ID\"",
    ]);
  }
  if (detect) lines.push(detect);
  // CPU model + core count.
  var cpuModel = run("bash", [
    "-c",
    "lscpu 2>/dev/null | grep -E 'Model name|^CPU\\(s\\):' | head -2",
  ]);
  if (cpuModel) lines.push(cpuModel);
  // GPU(s) — identify the real hardware, don't assume NVIDIA.
  var gpu = run("bash", [
    "-c",
    "lspci -k 2>/dev/null | grep -iE 'VGA|3D|Display' | head -3",
  ]);
  if (gpu) lines.push("GPU: " + gpu.replace(/\n/g, "; "));
  // Memory total.
  var mem = run("bash", [
    "-c",
    "free -h 2>/dev/null | awk '/^Mem:/ {print \"RAM total \" $2}'",
  ]);
  if (mem) lines.push(mem);
  // Kernel.
  var kernel = run("uname", ["-r"]);
  if (kernel) lines.push("kernel: " + kernel);
  cachedSysInfo = lines.length
    ? lines.join("\n")
    : "System info unavailable.";
  return cachedSysInfo;
}

var CONTEXT_SIZE = 32768;

// Sampling defaults tuned to break small-model repetition loops at the
// source (see guidance on repetition_penalty / no_repeat_ngram_size / min_p).
// Each can be overridden via the saved config object.
var SAMPLING_DEFAULTS = {
  // repetition_penalty: lowers logits of already-seen tokens. 1.1-1.15 is the
  // sweet spot for small models; >1.2 degrades formatting and coherence.
  repeatPenalty: 1.1,
  // no_repeat_ngram_size analog: DRY penalty bans repeating token sequences
  // longer than allowedLength. 3 bans 4-token repeats (sweet spot 3-4).
  dryAllowedLength: 3,
  // DRY strength (0-1). 0.8 is the recommended value.
  dryStrength: 0.8,
  // min_p sampling: drop tokens below this fraction of the top token's
  // probability. 0.05-0.1 strips low-probability garbage for small models.
  minP: 0.05,
};

function defaultModelPath() {
  return modelsDir();
}

function defaultModelFile() {
  return path.join(defaultModelPath(), "model.gguf");
}

var cachedModel = null;
var cachedLlama = null;
var cachedModelPath = null;
var cachedGpuLayers = null;

async function getOrLoadModel(resolvedPath, config) {
  var gpuLayers = config && config.gpuLayers != null ? config.gpuLayers : "max";
  if (
    cachedModel &&
    cachedModelPath === resolvedPath &&
    cachedGpuLayers === gpuLayers
  ) {
    console.log("[llm-local] Reusing cached model (backend: " + gpuLayers + ")");
    return { model: cachedModel, llama: cachedLlama };
  }

  if (cachedModel) {
    console.log("[llm-local] Disposing old model (backend changed)");
    cachedModel.dispose();
    cachedModel = null;
    cachedLlama = null;
  }

  var { getLlama } = await import("node-llama-cpp");
  cachedLlama = await getLlama();
  cachedModel = await cachedLlama.loadModel({
      modelPath: resolvedPath,
      gpuLayers: gpuLayers,
    });
  cachedModelPath = resolvedPath;
  cachedGpuLayers = gpuLayers;
  return { model: cachedModel, llama: cachedLlama };
}

function resolveModelPath(config) {
  if (config.modelPath) return config.modelPath;
  return defaultModelFile();
}

function buildSystemPrompt(sysInfo) {
  if (sysInfo === undefined) sysInfo = gatherSystemInfo();
  var parts = [
    "You are Canhelpy, a Linux desktop AI assistant.",
    "",
    "## Your System",
    sysInfo,
    "",
    "## Rules",
    "- Context window: " + (CONTEXT_SIZE / 1024) + "K tokens. Keep tool results and file reads small.",
    "- For factual/how-to questions: call search_knowledge() first. If it returns nothing, use search_web().",
    "- For this system's live state (CPU%, disk, services, packages, updates): run commands with run_bash().",
    "- Use as few tools as possible. After 4 tool calls, stop and answer with what you have.",
    "- Be concise. Lead with the answer. No preambles. One sentence or a few bullets.",
    "- The `sys` CLI is available for distro-agnostic system commands (sys pkg, sys svc, sys perf, etc).",
  ];

  return parts.join("\n");
}



function RepetitionDetector() {
  var buf = "";
  var lines = [];

  return {
    feed: function (text) {
      buf += text;
      lines = buf.split("\n");

      if (lines.length >= 6) {
        var last = lines[lines.length - 1].trim();
        var prev = lines[lines.length - 2].trim();
        var prev2 = lines[lines.length - 3].trim();
        if (last.length > 5 && last === prev && prev === prev2) {
          return true;
        }
      }

      if (buf.length > 300) {
        var tail = buf.slice(-150);
        var half = Math.floor(tail.length / 2);
        if (tail.slice(0, half) === tail.slice(half)) {
          return true;
        }
      }

      return false;
    },
  };
}

function estimateTokens(history) {
  var chars = 0;
  for (var i = 0; i < history.length; i++) {
    var item = history[i];
    if (item.text) chars += item.text.length;
    if (item.response) {
      for (var j = 0; j < item.response.length; j++) {
        if (typeof item.response[j] === "string")
          chars += item.response[j].length;
      }
    }
  }
  return Math.ceil(chars / 4);
}

function compressHistory(history, contextSize) {
  var maxTokens = contextSize || CONTEXT_SIZE;
  var threshold = Math.floor(maxTokens * 0.7);

  if (estimateTokens(history) <= threshold) return history;

  var systemMsg = history[0].type === "system" ? history[0] : null;
  var rest = systemMsg ? history.slice(1) : history;

  var keepRecent = 8;
  if (rest.length <= keepRecent + 4) return history;

  var recent = rest.slice(-keepRecent);
  var toCompress = rest.slice(0, -keepRecent);

  var nonTool = [];
  var toolMessages = [];

  for (var i = 0; i < toCompress.length; i++) {
    var item = toCompress[i];
    var isTool =
      item.type === "user" &&
      item.text &&
      item.text.startsWith("Function result:");
    if (isTool) {
      toolMessages.push(item);
    } else {
      nonTool.push(item);
    }
  }

  if (nonTool.length === 0) {
    var compressed = [
      {
        type: "user",
        text: "The assistant used several tools. Tool results are preserved below.",
      },
      {
        type: "model",
        response: ["Tool results processed. Continuing the conversation."],
      },
    ];
    var result = [...compressed, ...toolMessages, ...recent];
    return systemMsg ? [systemMsg, ...result] : result;
  }

  var pairCount = 0;
  var sampleTopics = [];
  for (var i = 0; i < nonTool.length; i++) {
    if (nonTool[i].type === "user") {
      pairCount++;
      if (sampleTopics.length < 5 && nonTool[i].text) {
        sampleTopics.push(nonTool[i].text.slice(0, 50));
      }
    }
  }

  var summaryUser =
    sampleTopics.length > 0
      ? "Earlier in this conversation, the user asked about: " +
        sampleTopics.join("; ") +
        (pairCount > sampleTopics.length
          ? " and " + (pairCount - sampleTopics.length) + " more topics"
          : "") +
        ". The assistant answered each."
      : "Earlier in this conversation, the user and assistant exchanged " +
        pairCount +
        " messages on various topics.";

  var compressed = [
    { type: "user", text: summaryUser },
    {
      type: "model",
      response: [
        "I recall the earlier conversation. Let me continue helping you.",
      ],
    },
  ];

  var result = [...compressed, ...toolMessages, ...recent];
  return systemMsg ? [systemMsg, ...result] : result;
}

function buildFunctions(tools, executeTool, onToolStart, onToolEnd) {
  // consecutiveFailures: tool calls that returned an error/refusal without the
  //   model ever producing a real result. Reset on any successful call.
  // total: hard cap on tool calls in a single turn, so a model that calls
  //   tools successfully forever (e.g. reading a huge file) is still bounded.
  // recentCalls: signatures of recent calls, to detect the model repeating the
  //   exact same call (a common loop). Reset when a different call is made.
  var state = { consecutiveFailures: 0, total: 0, lastSig: null, lastSigCount: 0 };
  var MAX_CONSECUTIVE_FAILURES = 5;
  var MAX_TOTAL_CALLS = 60;
  var MAX_SAME_CALL_REPEATS = 2;
  var functions = {};

  for (var i = 0; i < tools.length; i++) {
    var fn = tools[i].function;
    functions[fn.name] = {
      description: fn.description,
      params: fn.parameters || { type: "object", properties: {} },
      handler: (function (name) {
        return async function (params) {
          if (state.total >= MAX_TOTAL_CALLS) {
            return (
              "Stop calling tools. You have made " + state.total +
              " tool calls this turn. Respond directly to the user now with what you know."
            );
          }
          var sig = name + "\x1f" + JSON.stringify(params || {});
          if (sig === state.lastSig) {
            state.lastSigCount++;
          } else {
            state.lastSig = sig;
            state.lastSigCount = 1;
          }
          if (state.lastSigCount > MAX_SAME_CALL_REPEATS) {
            return (
              "You have already called " + name + " with these exact arguments " +
              state.lastSigCount + " times and it is not helping. Do NOT call the " +
              "same tool with the same arguments again. Respond directly to the " +
              "user, or try a clearly different tool or arguments."
            );
          }
          state.total++;
          await onToolStart({ name: name, args: params });
          try {
            var result = await executeTool(name, params);
            var resultStr = String(result);
            onToolEnd({ name: name, output: resultStr });
            // A successful call means progress was made; don't count it as a
            // failure. This lets legitimate multi-call sequences (like reading
            // a large file in chunks) proceed without tripping the guard.
            state.consecutiveFailures = 0;
            return resultStr;
          } catch (e) {
            state.consecutiveFailures++;
            if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              return (
                "Too many consecutive failing tool calls. Do not retry the same " +
                "call. Respond directly to the user now, or try a clearly " +
                "different approach."
              );
            }
            var errorStr = JSON.stringify({ error: e.message });
            onToolEnd({ name: name, output: errorStr });
            return errorStr;
          }
        };
      })(fn.name),
    };
  }

  return { functions, state };
}

async function runLocalChatLoop({
  modelPath,
  messages,
  tools,
  onChunk,
  onToolStart,
  onToolEnd,
  executeTool,
  signal,
  config,
}) {
  var resolvedPath = modelPath || resolveModelPath(config);

  if (!fs.existsSync(resolvedPath)) {
    onChunk({
      error:
        "Model not found: " +
        resolvedPath +
        ". Download a GGUF model in settings.",
    });
    return;
  }

  var { getLlama, LlamaChatSession } = await import("node-llama-cpp");

  console.log("[llm-local] Loading model from:", resolvedPath);
  var model;
  try {
    var loaded = await getOrLoadModel(resolvedPath, config);
    model = loaded.model;
    console.log("[llm-local] Model loaded successfully");
  } catch (e) {
    console.error("[llm-local] Failed to load model:", e);
    onChunk({ error: "Failed to load model: " + (e.message || String(e)) });
    return;
  }

  console.log("[llm-local] Creating context with contextSize=" + (config.contextSize || CONTEXT_SIZE));
  var context;
  try {
    context = await model.createContext({
      contextSize: config.contextSize || CONTEXT_SIZE,
      batchSize: config.batchSize || 512,
    });
    console.log("[llm-local] createContext returned");
  } catch (e) {
    console.error("[llm-local] createContext failed:", e);
    throw e;
  }

  var contextSize = context.contextSize;
  console.log("[llm-local] Context size:", contextSize);

  console.log("[llm-local] Creating session...");
  var session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: buildSystemPrompt(),
  });
  console.log("[llm-local] Session created, wrapper:", session.chatWrapper?.wrapperName);

  console.log(
    "[llm-local] System prompt (" + buildSystemPrompt().length + " chars):",
  );
  console.log(buildSystemPrompt());
  console.log("[llm-local] Chat wrapper:", session.chatWrapper?.wrapperName);

  console.log("[llm-local] Incoming messages:", messages.length);
  for (var mi = 0; mi < messages.length; mi++) {
    var m = messages[mi];
    console.log(
      "[llm-local]   msg[" + mi + "] " + m.role + ": " +
        String(m.content || "").slice(0, 80),
    );
  }

  var history = [];
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    if (msg.role === "system") continue;
    if (msg.role === "user") {
      history.push({ type: "user", text: msg.content });
    } else if (msg.role === "assistant") {
      if (msg.content) {
        history.push({ type: "model", response: [msg.content] });
      }
    } else if (msg.role === "tool") {
      history.push({ type: "user", text: "Function result: " + msg.content });
    }
  }

  history = compressHistory(history, contextSize);

  var currentPrompt = "";
  if (history.length > 0) {
    var last = history[history.length - 1];
    if (last.type === "user") {
      currentPrompt = last.text;
      history.pop();
    }
  }
  if (!currentPrompt) {
    console.log(
      "[llm-local] WARNING: currentPrompt empty, history last type: " +
        (history.length ? history[history.length - 1].type : "none"),
    );
  }

  // Feed the conversation as structured chat history so the chat wrapper
  // formats each turn correctly. The current prompt is sent separately to
  // promptWithMeta, which appends it as a new user turn.
  var chatHistory = [{ type: "system", text: buildSystemPrompt() }];
  for (var hi = 0; hi < history.length; hi++) {
    chatHistory.push(history[hi]);
  }
  session.setChatHistory(chatHistory);

  console.log("[llm-local] History items:", history.length);
  for (var hi = 0; hi < history.length; hi++) {
    var hitem = history[hi];
    if (hitem.type === "user") {
      console.log(
        "[llm-local]   history[" + hi + "] user: " + hitem.text.slice(0, 80),
      );
    } else if (hitem.type === "model") {
      console.log(
        "[llm-local]   history[" +
          hi +
          "] model: " +
          (hitem.response && hitem.response[0]
            ? hitem.response[0].slice(0, 80)
            : "(empty)"),
      );
    } else {
      console.log("[llm-local]   history[" + hi + "] " + hitem.type);
    }
  }
  console.log("[llm-local] Current prompt:", currentPrompt.slice(0, 100));

  var { functions, state } = buildFunctions(
    tools,
    executeTool,
    onToolStart,
    onToolEnd,
  );
  console.log("[llm-local] Tools count:", Object.keys(functions).length);

  try {
    var repDetector = RepetitionDetector();
    var internalAbort = new AbortController();

    if (signal) {
      signal.addEventListener("abort", function () {
        clearTimeout(idleTimer);
        idleFired = false;
        internalAbort.abort();
      });
    }

    var IDLE_TIMEOUT_MS = 30 * 1000;
    var toolRunning = false;
    var idleTimer = null;
    var idleFired = false;

    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleFired = false;
      if (!toolRunning) {
        idleTimer = setTimeout(function () {
          console.log("[llm-local] Idle timeout — no output for " + (IDLE_TIMEOUT_MS / 1000) + "s, aborting");
          idleFired = true;
          idleTimer = null;
          internalAbort.abort();
        }, IDLE_TIMEOUT_MS);
      }
    }

    // Wrap the tool callbacks to track when a tool is busy.
    var origOnToolStart = onToolStart;
    var origOnToolEnd = onToolEnd;
    onToolStart = async function (info) {
      toolRunning = true;
      clearTimeout(idleTimer);
      await origOnToolStart(info);
    };
    onToolEnd = function (info) {
      origOnToolEnd(info);
      toolRunning = false;
      resetIdleTimer();
    };

    resetIdleTimer();

    var opts = {
      functions: functions,
      documentFunctionParams: true,
      maxTokens: Math.floor(contextSize * 0.75),
      temperature: 0.7,
      // Repetition-loop prevention at the sampling level.
      repeatPenalty: {
        penalty:
          config.repeatPenalty != null
            ? config.repeatPenalty
            : SAMPLING_DEFAULTS.repeatPenalty,
      },
      dryRepeatPenalty: {
        strength:
          config.dryStrength != null
            ? config.dryStrength
            : SAMPLING_DEFAULTS.dryStrength,
        allowedLength:
          config.dryAllowedLength != null
            ? config.dryAllowedLength
            : SAMPLING_DEFAULTS.dryAllowedLength,
      },
      minP:
        config.minP != null ? config.minP : SAMPLING_DEFAULTS.minP,
      signal: internalAbort.signal,
      stopOnAbortSignal: true,
      onTextChunk: function (chunk) {
        resetIdleTimer();
        if (repDetector.feed(chunk)) {
          console.log("[llm-local] Repetition detected, aborting");
          internalAbort.abort();
          throw new Error("REPETITION_DETECTED");
        }
        onChunk({ text: chunk });
      },
      onResponseChunk: function (chunk) {
        resetIdleTimer();
        if (
          chunk &&
          chunk.type === "segment" &&
          chunk.segmentType === "thought"
        ) {
          if (repDetector.feed(chunk.text)) {
            console.log(
              "[llm-local] Repetition detected in thinking, aborting",
            );
            internalAbort.abort();
            throw new Error("REPETITION_DETECTED");
          }
          onChunk({ thinking: chunk.text });
        }
      },
    };

    console.log("[llm-local] Starting session.promptWithMeta...");
    var result = await session.promptWithMeta(currentPrompt, opts);
    clearTimeout(idleTimer);
    console.log("[llm-local] Response received:", result.responseText);
  } catch (e) {
      clearTimeout(idleTimer);
      if (e.message === "REPETITION_DETECTED") {
        console.log("[llm-local] Repetition loop detected, requesting retry");
        onChunk({ error: "Model got stuck in a loop. Please try again." });
      } else if (e.name === "AbortError" || (signal && signal.aborted)) {
        if (idleFired) {
          onChunk({ error: "Generation timed out — the model stopped responding. Try again." });
        } else {
          console.log("[llm-local] Aborted by user");
        }
      } else if (e.message && e.message.includes("context shift strategy")) {
        console.log("[llm-local] Context size exceeded");
        onChunk({
          error: "Message too large. Try removing file attachments or reducing context size in settings.",
        });
      } else {
        onChunk({ error: e.message });
      }
  }

  console.log("[llm-local] Returning");
}

function disposeModel() {
  if (cachedModel) {
    try {
      cachedModel.dispose();
    } catch (e) {
      console.error("[llm-local] dispose failed:", e && e.message);
    }
    cachedModel = null;
    cachedLlama = null;
    cachedModelPath = null;
    cachedGpuLayers = null;
  }
}

async function preloadModel(modelPath, config, onProgress) {
  var gpuLayers = config && config.gpuLayers != null ? config.gpuLayers : "max";
  if (cachedModel && cachedModelPath === modelPath && cachedGpuLayers === gpuLayers) {
    if (onProgress) onProgress({ stage: "done" });
    return;
  }

  if (onProgress) onProgress({ stage: "loading" });

  try {
    await getOrLoadModel(modelPath, config || {});
    if (onProgress) onProgress({ stage: "done" });
  } catch (e) {
    console.error("[llm-local] preload failed:", e.message || e);
    if (onProgress) onProgress({ stage: "error", error: e.message });
  }
}

module.exports = {
  runLocalChatLoop,
  buildFunctions,
  resolveModelPath,
  defaultModelPath,
  defaultModelFile,
  compressHistory,
  estimateTokens,
  getOrLoadModel,
  preloadModel,
  disposeModel,
};
