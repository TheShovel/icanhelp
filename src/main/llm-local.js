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
  const toolNames = tools.map((t) => t.function.name).join(", ");
  return [
    "You are icanhelp, a Linux desktop AI assistant.",
    "",
    "Tools: " + toolNames,
    "",
    "To call a tool, output exactly:",
    "FUNCTION: tool_name",
    "ARG param: value",
    "END_FUNCTION",
    "",
    "Example - searching the web:",
    "FUNCTION: search_web",
    "ARG query: your search query here",
    "END_FUNCTION",
    "",
    "After END_FUNCTION the tool runs and you'll see its output. Then respond normally.",
    "Always use tools when asked. Never refuse to use a tool you have.",
  ].join("\n");
}

function stripToolLines(text) {
  let result = text.replace(
    /\n?FUNCTION:[^\n]*\n(?:ARG [^\n]*\n)*END_FUNCTION\b\n?/g,
    "",
  );
  const funcIdx = result.indexOf("\nFUNCTION:");
  if (funcIdx !== -1) result = result.slice(0, funcIdx);
  return result;
}

function parseToolCall(text) {
  const funcMatch = text.match(/^FUNCTION:\s*(\S+)\s*$/m);
  if (!funcMatch) return null;
  const endMatch = text.match(/^END_FUNCTION\s*$/m);
  if (!endMatch) return null;

  const funcStart = text.indexOf(funcMatch[0]);
  const funcEnd = text.indexOf(endMatch[0]);
  if (funcStart < 0 || funcEnd <= funcStart) return null;

  const block = text.slice(funcStart + funcMatch[0].length, funcEnd);
  const args = {};

  const argRe = /^ARG\s+(\S+):\s*(.+)$/gm;
  let m;
  while ((m = argRe.exec(block)) !== null) {
    let val = m[2].trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (/^\d+$/.test(val)) val = parseInt(val, 10);
    args[m[1]] = val;
  }

  return { name: funcMatch[1], args };
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

  console.log("[llm-local] System prompt:\n", buildSystemPrompt(tools));
  console.log(
    "[llm-local] Tools:",
    tools.map((t) => t.function.name),
  );

  let history = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;
    if (msg.role === "user") {
      history.push({ type: "user", text: msg.content });
    } else if (msg.role === "assistant") {
      if (msg.content) {
        history.push({ type: "model", response: [msg.content] });
      }
    } else if (msg.role === "tool") {
      history.push({ type: "user", text: "Tool result: " + msg.content });
    }
  }

  let currentPrompt = "";
  if (history.length > 0) {
    const last = history[history.length - 1];
    if (last.type === "user") {
      currentPrompt = last.text;
      history.pop();
    }
  }

  session.setChatHistory(history);

  let maxTurns = 8;
  let fullResponse = "";

  while (maxTurns > 0) {
    maxTurns--;
    if (signal && signal.aborted) break;

    fullResponse = "";

    const opts = {
      maxTokens: 2048,
      temperature: 0.7,
      signal,
      stopOnAbortSignal: true,
      onTextChunk: (chunk) => {
        fullResponse += chunk;
        onChunk({ text: chunk });
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
      await session.promptWithMeta(currentPrompt, opts);
      currentPrompt = "";
    } catch (e) {
      if (e.name === "AbortError" || (signal && signal.aborted)) break;
      onChunk({ error: e.message });
      break;
    }

    console.log("[llm-local] Full response after prompt:\n", fullResponse);
    console.log("[llm-local] Response length:", fullResponse.length);

    const toolCall = parseToolCall(fullResponse);
    console.log(
      "[llm-local] parseToolCall result:",
      toolCall ? JSON.stringify(toolCall) : "null",
    );

    if (!toolCall) break;

    const toolDef = tools.find((t) => t.function.name === toolCall.name);
    if (!toolDef) {
      currentPrompt =
        "Tool '" +
        toolCall.name +
        "' does not exist. Available tools: " +
        tools.map((t) => t.function.name).join(", ") +
        ". Respond to the user without using unknown tools.";
      fullResponse = "";
      continue;
    }

    onToolStart({ name: toolCall.name, args: toolCall.args });

    let toolResult;
    try {
      toolResult = await executeTool(toolCall.name, toolCall.args);
    } catch (e) {
      toolResult = JSON.stringify({ error: e.message });
    }

    const resultStr = String(toolResult);
    onToolEnd({ name: toolCall.name, output: resultStr });

    currentPrompt =
      "Result of " +
      toolCall.name +
      ":\n" +
      resultStr +
      "\n\nContinue your response to the user.";
    fullResponse = "";
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
