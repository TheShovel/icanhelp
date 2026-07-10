const path = require("path");
const fs = require("fs");
const os = require("os");
const { getSkillContext } = require("./skills");

function defaultModelPath() {
  return path.join(os.homedir(), ".cache", "icanhelp", "models");
}

function defaultModelFile() {
  return path.join(defaultModelPath(), "model.gguf");
}

var cachedModel = null;
var cachedLlama = null;
var cachedModelPath = null;

async function getOrLoadModel(resolvedPath, config) {
  if (cachedModel && cachedModelPath === resolvedPath) {
    console.log("[llm-local] Reusing cached model");
    return { model: cachedModel, llama: cachedLlama };
  }

  if (cachedModel) {
    console.log("[llm-local] Disposing old model (path changed)");
    cachedModel.dispose();
    cachedModel = null;
    cachedLlama = null;
  }

  var { getLlama } = await import("node-llama-cpp");
  cachedLlama = await getLlama();
  cachedModel = await cachedLlama.loadModel({
    modelPath: resolvedPath,
    gpuLayers: config.gpu !== false ? 99 : 0,
  });
  cachedModelPath = resolvedPath;
  return { model: cachedModel, llama: cachedLlama };
}

function resolveModelPath(config) {
  if (config.modelPath) return config.modelPath;
  return defaultModelFile();
}

function buildSystemPrompt() {
  var parts = [
    "You are Canhelpy, a Linux desktop AI assistant.",
    "You have access to a vector knowledge base via search_knowledge().",
    "",
    "## Knowledge Base Rules",
    "- BEFORE answering any question, ALWAYS call search_knowledge() to find relevant information.",
    "- If search_knowledge returns results, use them to inform your answer.",
    "- If the results are relevant, cite them. If they aren't, use your own knowledge or other tools.",
    "- The knowledge base covers: Linux system administration, bash, networking, package management,",
    "  systemd, permissions, processes, desktop environments, troubleshooting, kernel/hardware,",
    "  security, programming (JavaScript, Python, TypeScript, Go, React, Git, Docker, SQL, regex, API design, testing),",
    "  web development, computer science, physics, chemistry, biology, math, electronics,",
    "  daily life (cooking, nutrition, career, travel, productivity, relationships, parenting, legal basics, tech concepts),",
    "  health & fitness (exercise, first aid, mental health), personal finance, home (maintenance, cleaning, gardening, DIY),",
    "  creative (writing, photography, drawing, music, video editing), earth & space, and green living.",
    "",
    "## Tool Usage",
    "- Use search_web() for current/live information (news, weather, latest docs).",
    "- Use run_bash() to execute commands on the user's Linux system.",
    "- Use store_knowledge() when the user teaches you something new.",
    "- Use search_knowledge() before guessing. Look it up first.",
    "",
  ];

  var skillCtx = getSkillContext();
  if (skillCtx) {
    parts.push(skillCtx);
    parts.push("");
    parts.push(
      "When a skill matches the user's request, use the start_skill tool to load its instructions. " +
        "Skills provide expert guidance for specific tasks.",
    );
    parts.push("");
  }

  parts.push("Be helpful, accurate, and thorough.");
  return parts.join("\n");
}

function buildInlinePrompt(history, currentPrompt) {
  if (history.length === 0) return currentPrompt;

  var lines = [];
  for (var i = 0; i < history.length; i++) {
    var item = history[i];
    if (item.type === "user") {
      lines.push("User: " + item.text);
    } else if (item.type === "model") {
      var resp = item.response && item.response[0] ? item.response[0] : "";
      lines.push("Assistant: " + resp);
    }
  }

  lines.push("User: " + currentPrompt);
  lines.push("Assistant:");

  return lines.join("\n");
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
  var maxTokens = contextSize || 8192;
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
  var state = { consecutive: 0 };
  var functions = {};

  for (var i = 0; i < tools.length; i++) {
    var fn = tools[i].function;
    functions[fn.name] = {
      description: fn.description,
      params: fn.parameters || { type: "object", properties: {} },
      handler: (function (name) {
        return async function (params) {
          if (state.consecutive >= 3) {
            return "Too many consecutive tool calls. Respond directly to the user now.";
          }
          state.consecutive++;
          await onToolStart({ name: name, args: params });
          try {
            var result = await executeTool(name, params);
            var resultStr = String(result);
            onToolEnd({ name: name, output: resultStr });
            return resultStr;
          } catch (e) {
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

  var model;
  try {
    var loaded = await getOrLoadModel(resolvedPath, config);
    model = loaded.model;
  } catch (e) {
    onChunk({ error: "Failed to load model: " + (e.message || String(e)) });
    return;
  }

  var context = await model.createContext({
    contextSize: config.contextSize || 8192,
    batchSize: config.batchSize || 512,
  });

  var session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: buildSystemPrompt(),
  });

  console.log(
    "[llm-local] System prompt (" + buildSystemPrompt().length + " chars):",
  );
  console.log(buildSystemPrompt());
  console.log("[llm-local] Chat wrapper:", session.chatWrapper?.wrapperName);

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

  history = compressHistory(history, config.contextSize || 8192);

  var currentPrompt = "";
  if (history.length > 0) {
    var last = history[history.length - 1];
    if (last.type === "user") {
      currentPrompt = last.text;
      history.pop();
    }
  }

  var inlinePrompt = buildInlinePrompt(history, currentPrompt);
  session.setChatHistory([{ type: "system", text: buildSystemPrompt() }]);

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
        internalAbort.abort();
      });
    }

    var opts = {
      functions: functions,
      documentFunctionParams: true,
      maxTokens: config.contextSize
        ? Math.floor(config.contextSize * 0.75)
        : 6144,
      temperature: 0.7,
      signal: internalAbort.signal,
      stopOnAbortSignal: true,
      onTextChunk: function (chunk) {
        if (repDetector.feed(chunk)) {
          console.log("[llm-local] Repetition detected, aborting");
          internalAbort.abort();
          throw new Error("REPETITION_DETECTED");
        }
        onChunk({ text: chunk });
      },
      onResponseChunk: function (chunk) {
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

    var result = await session.promptWithMeta(inlinePrompt, opts);
    console.log("[llm-local] Response:", result.responseText);
  } catch (e) {
    if (e.message === "REPETITION_DETECTED") {
      console.log("[llm-local] Repetition loop detected, requesting retry");
      onChunk({ error: "Model got stuck in a loop. Please try again." });
    } else if (e.name === "AbortError" || (signal && signal.aborted)) {
      console.log("[llm-local] Aborted");
    } else {
      onChunk({ error: e.message });
    }
  }

  console.log("[llm-local] Returning");
}

function disposeModel() {
  if (cachedModel) {
    cachedModel.dispose();
    cachedModel = null;
    cachedLlama = null;
    cachedModelPath = null;
  }
}

async function preloadModel(modelPath, config, onProgress) {
  if (cachedModel && cachedModelPath === modelPath) {
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
