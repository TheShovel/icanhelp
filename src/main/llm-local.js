const path = require("path");
const fs = require("fs");
const os = require("os");

function defaultModelPath() {
  return path.join(os.homedir(), ".cache", "icanhelp", "models");
}

function defaultModelFile() {
  return path.join(defaultModelPath(), "model.gguf");
}

function resolveModelPath(config) {
  if (config.modelPath) return config.modelPath;
  return defaultModelFile();
}

function buildSystemPrompt() {
  return "You are icanhelp, a Linux desktop AI assistant.\nUse tools when appropriate.";
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
          onToolStart({ name: name, args: params });
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
  var llama = await getLlama();

  var model = await llama.loadModel({
    modelPath: resolvedPath,
    gpuLayers: config.gpu !== false ? 99 : 0,
  });

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

  var history = [{ type: "system", text: buildSystemPrompt() }];
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

  var currentPrompt = "";
  if (history.length > 0) {
    var last = history[history.length - 1];
    if (last.type === "user") {
      currentPrompt = last.text;
      history.pop();
    }
  }

  session.setChatHistory(history);
  console.log("[llm-local] History items:", history.length);
  console.log("[llm-local] Current prompt:", currentPrompt.slice(0, 100));

  var { functions, state } = buildFunctions(
    tools,
    executeTool,
    onToolStart,
    onToolEnd,
  );
  console.log("[llm-local] Tools count:", Object.keys(functions).length);

  try {
    var opts = {
      functions: functions,
      documentFunctionParams: true,
      maxTokens: config.contextSize
        ? Math.floor(config.contextSize * 0.75)
        : 6144,
      temperature: 0.7,
      signal: signal,
      stopOnAbortSignal: true,
      onTextChunk: function (chunk) {
        onChunk({ text: chunk });
      },
      onResponseChunk: function (chunk) {
        if (
          chunk &&
          chunk.type === "segment" &&
          chunk.segmentType === "thought"
        ) {
          onChunk({ thinking: chunk.text });
        }
      },
    };

    var result = await session.promptWithMeta(currentPrompt, opts);
    console.log("[llm-local] Response:", result.responseText);
  } catch (e) {
    if (e.name === "AbortError" || (signal && signal.aborted)) {
      console.log("[llm-local] Aborted");
    } else {
      onChunk({ error: e.message });
    }
  }

  console.log("[llm-local] Disposing session...");
  session.dispose();
  console.log("[llm-local] Session disposed");
  console.log("[llm-local] Returning");
}

module.exports = {
  runLocalChatLoop,
  resolveModelPath,
  defaultModelPath,
  defaultModelFile,
};
