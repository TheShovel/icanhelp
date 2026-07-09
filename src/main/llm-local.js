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

function buildSystemPrompt(tools) {
  const lines = ["You are icanhelp, a Linux desktop AI assistant.", ""];
  lines.push("You have these functions available:");
  for (const t of tools) {
    const fn = t.function;
    const params = fn.parameters?.required?.join(", ") || "";
    lines.push(`- ${fn.name}(${params}): ${fn.description}`);
  }
  lines.push("");
  lines.push("To call a function, write it like this:");
  lines.push("[search_web(query='what to search for')]");
  lines.push("");
  lines.push("The function will run and you'll see its output. Then continue.");
  lines.push("Always use functions when you need information. Never refuse.");
  return lines.join("\n");
}

function parseToolCall(text) {
  const match = text.match(/\[(\w+)\(([^)]*)\)\]/);
  if (!match) {
    const lineMatch = text.match(/^(\w+)\s+(.+)$/m);
    if (!lineMatch) return null;
    return parseArgs(lineMatch[1], lineMatch[2]);
  }
  return parseArgs(match[1], match[2]);
}

function parseArgs(name, argsStr) {
  const args = {};
  const argRe = /(\w+)\s*=\s*("[^"]*"|'[^']*'|[^,)]+)/g;
  let m;
  while ((m = argRe.exec(argsStr)) !== null) {
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (/^\d+$/.test(val)) val = parseInt(val, 10);
    args[m[1]] = val;
  }
  return { name, args };
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
  const resolvedPath = modelPath || resolveModelPath(config);

  if (!fs.existsSync(resolvedPath)) {
    onChunk({
      error: `Model not found: ${resolvedPath}. Download a GGUF model in settings.`,
    });
    return;
  }

  const { getLlama, LlamaChatSession } = await import("node-llama-cpp");
  const llama = await getLlama();

  const model = await llama.loadModel({
    modelPath: resolvedPath,
    gpuLayers: config.gpu !== false ? 99 : 0,
  });

  const context = await model.createContext({
    contextSize: config.contextSize || 4096,
    batchSize: config.batchSize || 512,
  });

  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: buildSystemPrompt(tools),
  });

  const userMessages = messages.filter((m) => m.role === "user");
  const lastUser = userMessages[userMessages.length - 1];
  if (!lastUser) {
    onChunk({ error: "No user message" });
    session.dispose();
    await model.dispose();
    return;
  }

  const prompt = lastUser.content;
  let maxTurns = 8;
  let conversation = prompt;
  const toolNames = tools.map((t) => t.function.name).join("|");
  const toolRe = new RegExp("\\[(" + toolNames + ")\\([^)]*\\)\\]", "g");

  while (maxTurns > 0) {
    maxTurns--;
    if (signal && signal.aborted) break;

    let fullResponse = "";

    const opts = {
      maxTokens: config.contextSize
        ? Math.floor(config.contextSize * 0.75)
        : 4096,
      temperature: 0.7,
      signal,
      stopOnAbortSignal: true,
      onTextChunk: (chunk) => {
        fullResponse += chunk;
        onChunk({ replaceText: fullResponse.replace(toolRe, "") });
      },
      onResponseChunk: (chunk) => {
        if (
          chunk &&
          chunk.type === "segment" &&
          chunk.segmentType === "thought"
        ) {
          onChunk({ thinking: chunk.text });
        }
      },
    };

    try {
      await session.promptWithMeta(conversation, opts);
    } catch (e) {
      if (e.name === "AbortError" || (signal && signal.aborted)) break;
      onChunk({ error: e.message });
      break;
    }

    console.log("[llm-local] Response:\n", fullResponse);

    const toolCall = parseToolCall(fullResponse);
    if (!toolCall) break;

    const toolDef = tools.find((t) => t.function.name === toolCall.name);
    if (!toolDef) break;

    onToolStart({ name: toolCall.name, args: toolCall.args });

    let toolResult;
    try {
      toolResult = await executeTool(toolCall.name, toolCall.args);
    } catch (e) {
      toolResult = JSON.stringify({ error: e.message });
    }

    const resultStr = String(toolResult);
    onToolEnd({ name: toolCall.name, output: resultStr });

    conversation =
      "Function " +
      toolCall.name +
      " returned:\n" +
      resultStr +
      "\n\nContinue your response to the user.";
  }

  session.dispose();
  await model.dispose();
}

module.exports = {
  runLocalChatLoop,
  resolveModelPath,
  defaultModelPath,
  defaultModelFile,
};
