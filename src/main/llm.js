const { loadConfig } = require("./store");
const { tools, executeToolCall } = require("./tools/registry");

const defaults = {
  provider: "local",
  model: "local",
  modelPath: "",
  gpu: true,
  contextSize: 4096,
};

async function validateConfig(config) {
  if (config.provider !== "ollama") return { valid: true };

  try {
    const res = await fetch(`${config.endpoint}/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok
      ? { valid: true }
      : { valid: false, error: `Ollama returned status ${res.status}` };
  } catch (e) {
    return {
      valid: false,
      error: `Cannot reach Ollama at ${config.endpoint}`,
    };
  }
}

async function fetchModels(config) {
  try {
    const headers = {};
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
    const res = await fetch(`${config.endpoint}/models`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const models = data.data || [];
    return models
      .map((m) => m.id || m.name)
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function buildConfig() {
  const stored = loadConfig();
  return { ...defaults, ...stored };
}

async function streamLLM(messages, effort, signal) {
  const config = buildConfig();
  if (config.provider !== "ollama") return null;

  var reasoningEffort = effort || config.reasoningEffort || undefined;
  var body = {
    model: config.model,
    stream: true,
    tools: tools,
    messages: [
      {
        role: "system",
        content:
          "You are icanhelp, an AI desktop assistant for Linux. " +
          "You run as a transparent overlay on the user's screen and help them with tasks.\n\n" +
          "CAPABILITIES:\n" +
          "- Execute bash commands via the run_bash tool\n" +
          "- Read, write, and list files via the file tools\n" +
          "- Analyze NEW images via the ocr_image tool (extracts text and describes visual content)\n" +
          "- Search the web via the search_web tool\n" +
          "- Store and retrieve information via the knowledge tools\n" +
          "- Answer questions and solve problems\n\n" +
          "RULES:\n" +
          "- Never use emojis or emoticons in your responses. Use plain text only.\n" +
          "- Keep responses concise and practical.\n" +
          "- When a user attaches an image, its text and visual description are ALREADY auto-extracted and included in the message under [Attached file]. Do NOT call ocr_image on it again. Only use ocr_image for NEW image paths the user explicitly asks you to inspect.\n" +
          "- Explain what you're doing briefly before using a tool.",
      },
      ...messages,
    ],
  };
  if (reasoningEffort) body.reasoning_effort = reasoningEffort;

  var opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey || "ollama"}`,
    },
    body: JSON.stringify(body),
  };
  if (signal) opts.signal = signal;

  const res = await fetch(`${config.endpoint}/chat/completions`, opts);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${error}`);
  }

  return res.body;
}

module.exports = { streamLLM, validateConfig, fetchModels };
