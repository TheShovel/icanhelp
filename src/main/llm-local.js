const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { modelsDir } = require("./paths");

var cachedDistro = null;

function gatherDistro() {
  if (cachedDistro) return cachedDistro;
  try {
    cachedDistro = execFileSync("bash", [
      "-c", "source /etc/os-release 2>/dev/null && echo \"$ID\"",
    ], { encoding: "utf8", timeout: 3000 }).toString().trim();
  } catch (_) {}
  return cachedDistro;
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

function buildSystemPrompt() {
  var distro = gatherDistro();
  var now = new Date();
  var tz = "";
  var locale = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) {}
  try { locale = Intl.DateTimeFormat().resolvedOptions().locale; } catch (_) {}
  var dateStr = now.toLocaleDateString(locale || undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  var timeStr = now.toLocaleTimeString(locale || undefined, {
    hour: "2-digit", minute: "2-digit",
  });

  var parts = [
    "You are Canhelpy, a Linux desktop AI assistant.",
    "",
    "Date: " + dateStr + ", " + timeStr + (tz ? " " + tz : "") + ". Distro: " + (distro || "unknown") + ".",
    "",
    "Rules:",
    "- Think inside <think> tags before answering.",
    "- Be concise. No preambles.",
    "- Call all tools first, then answer from results.",
    "- For math: use math(expression) instead of calculating.",
    "- For documents: first research the topic (search_web, extract_webpage), then call create_docx(description, filename). The system will handle the actual writing.",
    "- After search_web: use extract_webpage(url) for full content.",
    "- Live system state: use run_bash().",
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

function compressMessagesAggressive(messages, currentPrompt) {
  if (messages.length <= 2) return messages;

  // First pass: truncate oversized messages.
  var MAX_MSG_LEN = 3000;
  messages = messages.map(function (m) { return truncateMsg(m, MAX_MSG_LEN); });

  var lastUserIdx = -1;
  for (var i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") { lastUserIdx = i; break; }
  }
  if (lastUserIdx === -1) return messages;

  var keep = messages.slice(lastUserIdx);
  var before = messages.slice(0, lastUserIdx);

  var topicCount = 0;
  var sampleTopics = [];
  for (var i = 0; i < before.length; i++) {
    if (before[i].role === "user" && before[i].content) {
      topicCount++;
      if (sampleTopics.length < 5) {
        sampleTopics.push(String(before[i].content).slice(0, 60));
      }
    }
  }

  if (topicCount === 0) return keep;

  var summary =
    sampleTopics.length > 0
      ? "Earlier conversation covered: " + sampleTopics.join("; ") +
        (topicCount > sampleTopics.length
          ? " and " + (topicCount - sampleTopics.length) + " more topics"
          : "")
      : "Earlier conversation exchanged " + topicCount + " messages.";

  return [
    { role: "user", content: summary },
    { role: "assistant", content: "Understood. I'll continue with the current request." },
    ...keep,
  ];
}

function truncateMsg(item, maxLen) {
  var txt = item.text || item.content;
  if (txt && txt.length > maxLen) {
    var key = item.text != null ? "text" : "content";
    item = { ...item };
    item[key] = txt.slice(0, maxLen) + "\n...[truncated]";
  }
  if (item.response) {
    var newResp = [];
    var rem = maxLen;
    for (var j = 0; j < item.response.length; j++) {
      if (typeof item.response[j] !== "string") { newResp.push(item.response[j]); continue; }
      if (item.response[j].length > rem) {
        newResp.push(item.response[j].slice(0, rem) + "\n...[truncated]");
        break;
      }
      newResp.push(item.response[j]);
      rem -= item.response[j].length;
    }
    item = { ...item, response: newResp };
  }
  return item;
}

function compressHistory(history, contextSize) {
  var maxTokens = contextSize || CONTEXT_SIZE;
  var MAX_MSG_LEN = 2500;

  // Always truncate oversized messages regardless of threshold.
  history = history.map(function (m) { return truncateMsg(m, MAX_MSG_LEN); });

  if (estimateTokens(history) <= Math.floor(maxTokens * 0.7)) return history;

  var systemMsg = history[0].type === "system" ? history[0] : null;
  var rest = systemMsg ? history.slice(1) : history;

  var keepRecent = 4;
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

async function createContextWithRetry(model, ctxSize, batchSize) {
  var size = ctxSize;
  var minBatch = batchSize || 512;
  var lastError = null;
  var minSize = 256;

  while (size >= minSize) {
    try {
      var ctx = await model.createContext({
        contextSize: size,
        batchSize: Math.min(minBatch, size),
        flashAttention: true,
      });
      console.log("[llm-local] Context created: size=" + ctx.contextSize);
      return ctx;
    } catch (e) {
      lastError = e;
      var prevSize = size;
      size = Math.floor(size / 2);

      // If the error is clearly about memory, keep halving aggressively.
      var isMemoryError =
        e.name === "InsufficientMemoryError" ||
        (e.message && /memory|context size|too large|insufficient/i.test(e.message));

      if (isMemoryError) {
        console.log("[llm-local] Insufficient memory (size=" + prevSize + "), retrying with contextSize=" + size);
        continue;
      }

      // For any other error, still try smaller sizes in case it helps.
      console.log("[llm-local] Context creation failed (size=" + prevSize + "): " + (e.message || String(e)) + " — retrying with contextSize=" + size);
    }
  }

  // If we get here, even the minimum size failed.
  var freeMb = "";
  try { freeMb = " (free RAM: " + Math.round(require("os").freemem() / 1024 / 1024) + " MB)"; } catch (_) {}
  throw new Error(
    "Not enough memory to run the model. Even the smallest context size (" + minSize + " tokens) failed." +
    freeMb + ". Try a smaller model or close other applications."
  );
}

function buildFunctions(tools, executeTool, onToolStart, onToolEnd, hardStop, summarizeResult) {
  var state = { total: 0, lastSig: null, lastSigCount: 0, consecutiveFailures: 0 };
  var MAX_SOFT_NUDGE = 4;
  var MAX_TOOLS = 10;
  var functions = {};

  for (var i = 0; i < tools.length; i++) {
    var fn = tools[i].function;
    functions[fn.name] = {
      description: fn.description,
      params: fn.parameters || { type: "object", properties: {} },
      handler: (function (name) {
        return async function (params) {
          state.total++;

          if (state.total > MAX_TOOLS) {
            console.log("[llm-local] Tool limit exceeded (" + MAX_TOOLS + "), scheduling abort after result is fed");
            // Don't abort inside the handler — let promptWithMeta finish processing
            // the result first, then abort on the next token. Same timing as idle timeout.
            setTimeout(function () {
              if (hardStop) hardStop("tool_limit");
            }, 0);
            return "[SYSTEM: You have reached the tool limit. Answer the user now with everything you have.]";
          }

          var nudge = "";

          if (state.total >= MAX_SOFT_NUDGE && state.total < MAX_TOOLS) {
            nudge = "[Note: you've used " + state.total + " tools. Consider answering soon with what you have.]\n\n";
          }

          var sig = name + "\x1f" + JSON.stringify(params || {});
          if (sig === state.lastSig) {
            state.lastSigCount++;
            if (state.lastSigCount >= 2) {
              nudge = "[Note: you've already called " + name + " with these arguments. Try a different approach or answer the user.]\n\n";
            }
          } else {
            state.lastSig = sig;
            state.lastSigCount = 1;
          }

          console.log("[llm-local] buildFunctions: calling onToolStart for " + name);
          onToolStart({ name: name, args: params });
          console.log("[llm-local] buildFunctions: onToolStart returned, yielding 30ms");
          await new Promise(function (r) { setTimeout(r, 30); });
          console.log("[llm-local] buildFunctions: executing " + name);
          try {
            var result = await executeTool(name, params);
            var resultStr = String(result);

            // Document session: create_docx returns a __doc_pending__ marker.
            // Abort the main model so a dedicated document-writing session can take over.
            if (name === "create_docx") {
              try {
                var docCheck = JSON.parse(resultStr);
                if (docCheck.__doc_pending__) {
                  console.log("[llm-local] Document session requested, stopping main model");
                  onToolEnd({ name: name, output: resultStr });
                  if (hardStop) hardStop("document");
                  return resultStr;
                }
              } catch (_) {}
            }

            // Truncate oversized tool results to save context.
            if (summarizeResult) {
              var summarized = await summarizeResult(name, resultStr);
              if (summarized !== resultStr) {
                console.log("[llm-local] Summarized " + name + " result from " + resultStr.length + " to " + summarized.length + " chars");
                resultStr = summarized;
              }
            }

            onToolEnd({ name: name, output: resultStr });
            state.consecutiveFailures = 0;

            if (state.total === MAX_TOOLS) {
              console.log("[llm-local] 10th tool completed, scheduling abort after result is fed");
              setTimeout(function () {
                if (hardStop) hardStop("tool_limit");
              }, 0);
              return nudge + resultStr + "\n\n[SYSTEM: Tool limit reached. Answer the user now with everything you have.]";
            }

            return nudge + resultStr;
          } catch (e) {
            state.consecutiveFailures++;
            if (state.consecutiveFailures >= 5) {
              return "Too many consecutive failing tool calls. Answer the user now.\n\n" + JSON.stringify({ error: e.message });
            }
            var errorStr = JSON.stringify({ error: e.message });
            onToolEnd({ name: name, output: errorStr });
            return nudge + errorStr;
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

  var desiredSize = config.contextSize || CONTEXT_SIZE;
  console.log("[llm-local] Creating context with contextSize=" + desiredSize);
  var context;
  try {
    context = await createContextWithRetry(model, desiredSize, config.batchSize || 512);
  } catch (e) {
    console.error("[llm-local] createContext failed:", e);
    var minRamHint = "";
    try {
      var freeMb = Math.round(require("os").freemem() / 1024 / 1024);
      minRamHint = " (free RAM: " + freeMb + " MB — try a smaller model or close other apps)";
    } catch (_) {}
    onChunk({ error: "Failed to create model context: " + (e.message || String(e)) + minRamHint });
    return;
  }
  var contextSize = context.contextSize;

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

  try {
    var repDetector = RepetitionDetector();
    var internalAbort = new AbortController();
    var toolLimitReached = false;

    var stopReason = null;
    var forceContinueAttempts = 0;

    var hardStop = function (reason) {
      toolLimitReached = true;
      stopReason = reason || "tool_limit";
      internalAbort.abort();
    };

    var maxToolResult = 4000;
    var summarizeFn = async function (toolName, text) {
      if (text.length <= maxToolResult) return text;
      var head = Math.floor(maxToolResult * 0.7);
      var tail = Math.floor(maxToolResult * 0.2);
      return text.slice(0, head) + "\n\n...[truncated " + (text.length - head - tail) + " chars]...\n\n" + text.slice(-tail);
    };

    var { functions, state } = buildFunctions(
      tools,
      executeTool,
      onToolStart,
      onToolEnd,
      hardStop,
      summarizeFn,
    );
    console.log("[llm-local] Tools count:", Object.keys(functions).length);

    if (signal) {
      signal.addEventListener("abort", function () {
        clearTimeout(idleTimer);
        idleFired = false;
        internalAbort.abort();
      });
    }

    var IDLE_TIMEOUT_MS = 60 * 1000;
    var EXTENDED_TIMEOUT_MS = 15 * 1000;
    var toolRunning = false;
    var idleTimer = null;
    var idleFired = false;
    var lastActivityWasText = false;
    var generatingInterval = null;
    var generatingMessages = [
      "Refining...",
      "Making adjustments...",
      "Adding details...",
      "Polishing...",
      "Working...",
    ];
    var generatingIndex = 0;
    var generatingStartTime = 0;
    var longTaskNotified = false;

    function startGeneratingStatus() {
      if (generatingInterval) return;
      generatingIndex = 0;
      generatingStartTime = Date.now();
      longTaskNotified = false;
      onChunk({ tool_generating: generatingMessages[0] });
      generatingInterval = setInterval(function () {
        generatingIndex = (generatingIndex + 1) % generatingMessages.length;
        var msg = generatingMessages[generatingIndex];
        if (!longTaskNotified && Date.now() - generatingStartTime > 60000) {
          longTaskNotified = true;
        }
        if (longTaskNotified) {
          msg = msg + " (this is a large task, might take a while)";
        }
        onChunk({ tool_generating: msg });
      }, 2000);
    }

    function stopGeneratingStatus() {
      if (generatingInterval) {
        clearInterval(generatingInterval);
        generatingInterval = null;
      }
    }

    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleFired = false;
      if (!toolRunning) {
        var timeout = lastActivityWasText ? EXTENDED_TIMEOUT_MS : IDLE_TIMEOUT_MS;
        idleTimer = setTimeout(function () {
          console.log("[llm-local] Idle timeout — no output for " + (timeout / 1000) + "s, aborting");
          idleFired = true;
          idleTimer = null;
          internalAbort.abort();
        }, timeout);
      }
      // No safety net when toolRunning — wait indefinitely for tool completion.
    }

    // Wrap the tool callbacks to track when a tool is busy.
    var origOnToolStart = onToolStart;
    var origOnToolEnd = onToolEnd;
    onToolStart = function (info) {
      console.log("[llm-local] wrapper onToolStart:", info.name, Date.now());
      stopGeneratingStatus();
      lastActivityWasText = false;
      toolRunning = true;
      clearTimeout(idleTimer);
      origOnToolStart(info);
      console.log("[llm-local] wrapper onToolStart done:", info.name, Date.now());
    };
    onToolEnd = function (info) {
      stopGeneratingStatus();
      origOnToolEnd(info);
      toolRunning = false;
      resetIdleTimer();
    };

    resetIdleTimer();

    async function forceContinue() {
      forceContinueAttempts++;
      if (forceContinueAttempts > 2) {
        console.log("[llm-local] Too many force-continue attempts, giving up");
        onChunk({ error: "The model stopped responding. Try again with a simpler request." });
        return "";
      }
      idleFired = false;
      resetIdleTimer();
      var contAbort = new AbortController();
      if (signal) {
        signal.addEventListener("abort", function () { contAbort.abort(); });
      }
      try {
        var text = await session.prompt(
          "You have all the information you need. Now answer the user's request directly in plain text. Do not output JSON, function calls, or code blocks unless the user asked for them. Just write a normal conversational response.",
          {
            maxTokens: Math.floor(contextSize * 0.25),
            temperature: 0.7,
            responsePrefix: "Based on what I found, ",
            repeatPenalty: { penalty: 1.05 },
            signal: contAbort.signal,
            stopOnAbortSignal: true,
            onTextChunk: function (chunk) {
              resetIdleTimer();
              if (repDetector.feed(chunk)) {
                contAbort.abort();
                throw new Error("REPETITION_DETECTED");
              }
              onChunk({ text: chunk });
            },
            onResponseChunk: function (chunk) {
              if (chunk && chunk.type === "segment") {
                resetIdleTimer();
              }
              if (
                chunk &&
                chunk.type === "segment" &&
                chunk.segmentType === "thought"
              ) {
                if (repDetector.feed(chunk.text)) {
                  console.log(
                    "[llm-local] Repetition detected in force-continue thinking, aborting",
                  );
                  contAbort.abort();
                  throw new Error("REPETITION_DETECTED");
                }
                onChunk({ thinking: chunk.text });
              }
            },
          }
        );
        clearTimeout(idleTimer);
        return text;
      } finally {
        contAbort.abort();
      }
    }

    var opts = {
      functions: functions,
      documentFunctionParams: true,
      maxTokens: Math.floor(contextSize * 0.75),
      responsePrefix: "<think>\n",
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
        // Empty string chunk: node-llama-cpp intercepted a function call
        // token. The model is generating tool content — pause the idle timer.
        if (!chunk || chunk === "") {
          lastActivityWasText = false;
          if (!toolRunning) {
            toolRunning = true;
            clearTimeout(idleTimer);
            startGeneratingStatus();
          }
          return;
        }
        lastActivityWasText = true;
        toolRunning = false;
        console.log("[llm-local] main onTextChunk:", chunk.slice(0, 60));
        resetIdleTimer();
        if (repDetector.feed(chunk)) {
          console.log("[llm-local] Repetition detected, aborting");
          internalAbort.abort();
          throw new Error("REPETITION_DETECTED");
        }
        onChunk({ text: chunk });
      },
      onResponseChunk: function (chunk) {
        // Only reset the idle timer for meaningful segments (thought, text).
        // Blank/no-type chunks fire during function call generation and
        // should not restart the timer — the model is working on a tool.
        if (chunk && chunk.type === "segment") {
          resetIdleTimer();
        }
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

    console.log("[llm-local] Starting session.promptWithMeta...", Date.now());
    var result = await session.promptWithMeta(currentPrompt, opts);
    clearTimeout(idleTimer);
    console.log("[llm-local] promptWithMeta returned:", Date.now(), "text:", (result.responseText || "").slice(0, 50));

    if ((state.total > 0 || idleFired) && (!result.responseText || result.responseText.trim().length === 0)) {
      console.log("[llm-local] Model stopped with no text — continuing");
      await forceContinue();
    }

    // If the idle timer fired, the model was cut off mid-response.
    // The partial text is useless — force it to finish its answer.
    if (idleFired && result.responseText && result.responseText.trim().length > 0) {
      console.log("[llm-local] Model was cut off by idle timeout — forcing continuation");
      await forceContinue();
    }

    // Tool limit: the abort returns partial output (stopOnAbortSignal), not an error.
    // Force the model to wrap up with what it has.
    if (toolLimitReached) {
      console.log("[llm-local] Tool limit reached, forcing wrap-up continuation");
      await forceContinue();
    }
  } catch (e) {
      clearTimeout(idleTimer);
      if (e.message === "REPETITION_DETECTED") {
        console.log("[llm-local] Repetition loop detected, requesting retry");
        onChunk({ error: "Model got stuck in a loop. Please try again." });
      } else if (e.name === "AbortError" || (signal && signal.aborted)) {
        if (stopReason === "document") {
          console.log("[llm-local] Document generation triggered, stopping main loop cleanly");
        } else if (toolLimitReached) {
          console.log("[llm-local] Tool limit reached, forcing wrap-up continuation");
          try { await forceContinue(); } catch (_) {
            onChunk({ error: "Generation timed out — the model stopped responding. Try again." });
          }
        } else if (idleFired) {
          console.log("[llm-local] Idle timeout — forcing continuation");
          if (forceContinueAttempts < 2) {
            try { await forceContinue(); } catch (_) {
              onChunk({ error: "Generation timed out — the model stopped responding. Try again." });
            }
          } else {
            onChunk({ error: "Generation timed out — the model stopped responding. Try again." });
          }
        } else {
          console.log("[llm-local] Aborted by user");
        }
      } else if (e.message && /context shift|Failed to compress|too long prompt|context size/i.test(e.message)) {
        console.log("[llm-local] Context size exceeded, compressing and retrying");
        try {
          session = null;
          if (context) { try { await context.dispose(); } catch (_) {} context = null; }

          var compressed = compressMessagesAggressive(messages, currentPrompt);
          console.log("[llm-local] Compressed messages from " + messages.length + " to " + compressed.length);

          history = [];
          for (var i = 0; i < compressed.length; i++) {
            var msg = compressed[i];
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

          currentPrompt = "";
          if (history.length > 0) {
            var last = history[history.length - 1];
            if (last.type === "user") {
              currentPrompt = last.text;
              history.pop();
            }
          }

          var chatHistory = [{ type: "system", text: buildSystemPrompt() }];
          for (var hi = 0; hi < history.length; hi++) {
            chatHistory.push(history[hi]);
          }

          context = await createContextWithRetry(model, config.contextSize || CONTEXT_SIZE, config.batchSize || 512);
          contextSize = context.contextSize;

          session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: buildSystemPrompt(),
          });
          session.setChatHistory(chatHistory);

          // Retry without tools — the context is too full for more tool output
          opts.functions = {};
          opts.documentFunctionParams = false;
          opts.maxTokens = Math.floor(contextSize * 0.5);

          console.log("[llm-local] Retrying promptWithMeta with compressed context");
          var result = await session.promptWithMeta(currentPrompt, opts);
          clearTimeout(idleTimer);
          console.log("[llm-local] Retry promptWithMeta returned:", Date.now(), "text:", (result.responseText || "").slice(0, 50));

          if ((state.total > 0 || idleFired) && (!result.responseText || result.responseText.trim().length === 0)) {
            console.log("[llm-local] Model stopped with no text after retry — continuing");
            await forceContinue();
          }
          if (idleFired && result.responseText && result.responseText.trim().length > 0) {
            console.log("[llm-local] Retry was cut off by idle timeout — forcing continuation");
            await forceContinue();
          }
        } catch (e2) {
          console.log("[llm-local] Retry also failed:", e2.message);
          // Last-ditch: nuke everything except the last user turn and a trimmed system prompt.
          try {
            var lastUserIdx = -1;
            for (var i = history.length - 1; i >= 0; i--) {
              if (history[i].type === "user") { lastUserIdx = i; break; }
            }
            if (lastUserIdx >= 0) {
              history = history.slice(lastUserIdx);
              currentPrompt = "";
              if (history.length > 0 && history[history.length - 1].type === "user") {
                currentPrompt = history[history.length - 1].text;
                history.pop();
              }
              session = null;
              if (context) { try { await context.dispose(); } catch (_) {} context = null; }
              context = await createContextWithRetry(model, Math.min(config.contextSize || CONTEXT_SIZE, 8192), 128);
              contextSize = context.contextSize;
              session = new LlamaChatSession({
                contextSequence: context.getSequence(),
                systemPrompt: "You are Canhelpy, a Linux desktop AI assistant. Be concise.",
              });
              var chatHistory = [{ type: "system", text: "You are Canhelpy, a Linux desktop AI assistant. Be concise." }];
              for (var hi = 0; hi < history.length; hi++) {
                chatHistory.push(history[hi]);
              }
              session.setChatHistory(chatHistory);
              opts.maxTokens = 256;
              var result = await session.promptWithMeta(currentPrompt, opts);
              clearTimeout(idleTimer);
              if ((state.total > 0 || idleFired) && (!result.responseText || result.responseText.trim().length === 0)) {
                await forceContinue();
              }
              if (idleFired && result.responseText && result.responseText.trim().length > 0) {
                await forceContinue();
              }
            } else {
              throw e2;
            }
          } catch (e3) {
            console.log("[llm-local] Last-ditch retry also failed:", e3.message);
            onChunk({
              error: "Message too large even after compression. Try removing file attachments or reducing context size in settings.",
            });
          }
        }
      } else {
        onChunk({ error: e.message });
      }
  }

  // Clean up timers that might still be running.
  clearTimeout(idleTimer);
  if (generatingInterval) { clearInterval(generatingInterval); generatingInterval = null; }
  // context.dispose() is async and frees the native context including its
  // sequences. The session / chat are pure JS wrappers that reference the
  // context; disposing the context natively invalidates everything. We
  // await it so the GPU backend can complete its sync before we return.
  if (context) {
    var memBefore = process.memoryUsage();
    console.log("[llm-local] cleanup: rss=" + Math.round(memBefore.rss / 1024 / 1024) + "MB, waiting for GPU flush...");
    // promptWithMeta returns before the GPU command queue has fully drained.
    // Dispose too early and llama_free() tears down buffers the GPU is still
    // touching → segfault. A yield here costs nothing but avoids the race.
    await new Promise(function (r) { setTimeout(r, 100); });
    console.log("[llm-local] cleanup: await context.dispose...");
    try { await context.dispose(); } catch (_) {}
    context = null;
    session = null;
    var memAfter = process.memoryUsage();
    console.log("[llm-local] cleanup: disposed, rss=" + Math.round(memAfter.rss / 1024 / 1024) + "MB (freed " + Math.round((memBefore.rss - memAfter.rss) / 1024 / 1024) + "MB)");
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

function buildDocWriterSystemPrompt(description, researchContext) {
  var parts = [
    "You are a professional document writer. Your task is to write a comprehensive, well-structured document.",
    "",
    "Topic: " + description,
    "",
  ];

  if (researchContext && researchContext.length > 0) {
    parts.push("Use the following research as source material:");
    parts.push("");
    for (var i = 0; i < researchContext.length; i++) {
      var r = researchContext[i];
      parts.push("--- Source " + (i + 1) + " ---");
      if (r.title) parts.push("Title: " + r.title);
      if (r.url) parts.push("URL: " + r.url);
      if (r.snippet) parts.push("Content: " + r.snippet);
      parts.push("");
    }
  }

  parts.push("Write the complete document now. Use proper markdown formatting:");
  parts.push("- Use # for the main title, ## for section headings, ### for subsections");
  parts.push("- Use bullet lists and numbered lists where appropriate");
  parts.push("- Use **bold** and *italic* for emphasis");
  parts.push("- Be thorough and comprehensive");
  parts.push("");
  parts.push("Start writing the document directly — no preamble, no introduction about yourself. Begin with the document title.");

  return parts.join("\n");
}

async function generateDocument({ description, researchContext, filename, onChunk, config, signal }) {
  if (!cachedModel || !cachedLlama) {
    var modelPath = config && config.modelPath ? config.modelPath : defaultModelFile();
    if (!fs.existsSync(modelPath)) {
      onChunk({ error: "No model loaded. Please load a model first." });
      return "";
    }
    var loaded = await getOrLoadModel(modelPath, config || {});
    if (!cachedModel) {
      onChunk({ error: "Failed to load model for document generation." });
      return "";
    }
  }

  var contextSize = (config && config.contextSize) || CONTEXT_SIZE;
  console.log("[llm-local] generateDocument: creating context, size=" + contextSize);

  var context;
  try {
    context = await createContextWithRetry(cachedModel, contextSize, (config && config.batchSize) || 512);
  } catch (e) {
    console.error("[llm-local] generateDocument: context creation failed:", e.message);
    var freeMb = "";
    try { freeMb = " (free RAM: " + Math.round(require("os").freemem() / 1024 / 1024) + " MB)"; } catch (_) {}
    onChunk({ error: "Failed to create document context: " + (e.message || String(e)) + freeMb });
    return "";
  }

  var { LlamaChatSession } = await import("node-llama-cpp");
  var systemPrompt = buildDocWriterSystemPrompt(description, researchContext);
  console.log("[llm-local] generateDocument: system prompt length=" + systemPrompt.length);

  var session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: systemPrompt,
  });

  var fullText = "";
  var repDetector = RepetitionDetector();
  var internalAbort = new AbortController();

  if (signal) {
    signal.addEventListener("abort", function () {
      internalAbort.abort();
    });
  }

  try {
    console.log("[llm-local] generateDocument: starting prompt");
    var result = await session.prompt(
      "Write a comprehensive document about: " + description + "\n\nBegin writing now.",
      {
        maxTokens: Math.floor(contextSize * 0.75),
        temperature: 0.7,
        repeatPenalty: {
          penalty: (config && config.repeatPenalty != null) ? config.repeatPenalty : SAMPLING_DEFAULTS.repeatPenalty,
        },
        dryRepeatPenalty: {
          strength: (config && config.dryStrength != null) ? config.dryStrength : SAMPLING_DEFAULTS.dryStrength,
          allowedLength: (config && config.dryAllowedLength != null) ? config.dryAllowedLength : SAMPLING_DEFAULTS.dryAllowedLength,
        },
        minP: (config && config.minP != null) ? config.minP : SAMPLING_DEFAULTS.minP,
        signal: internalAbort.signal,
        stopOnAbortSignal: true,
        onTextChunk: function (chunk) {
          if (!chunk) return;
          if (repDetector.feed(chunk)) {
            console.log("[llm-local] generateDocument: repetition detected, stopping");
            internalAbort.abort();
            return;
          }
          fullText += chunk;
          if (onChunk) onChunk({ text: chunk });
        },
      }
    );

    if (result && !fullText) {
      fullText = result;
    }

    console.log("[llm-local] generateDocument: complete, text length=" + fullText.length);
    return fullText;
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("[llm-local] generateDocument: aborted");
    } else {
      console.error("[llm-local] generateDocument: error:", e.message);
      if (onChunk) onChunk({ error: "Document generation failed: " + (e.message || String(e)) });
    }
    return fullText;
  } finally {
    // Yield to let the GPU command queue drain before tearing down buffers.
    // Without this delay, context.dispose() can race with in-flight GPU ops
    // and cause a native segfault that JS can't catch.
    await new Promise(function (r) { setTimeout(r, 100); });
    console.log("[llm-local] generateDocument: disposing doc context...");
    try { await context.dispose(); } catch (_) {}
    console.log("[llm-local] generateDocument: context disposed");
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
  generateDocument,
};
