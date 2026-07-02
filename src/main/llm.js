const { loadConfig } = require("./store");
const { tools, executeToolCall } = require("./tools/registry");

const defaults = {
  provider: "openrouter",
  model: "gpt-4o-mini",
  endpoint: "https://openrouter.ai/api/v1",
};

async function validateConfig(config) {
  if (config.provider === "ollama") {
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

  try {
    const res = await fetch(`${config.endpoint}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "API key is invalid or unauthorized" };
    }
    return { valid: false, error: `Endpoint returned status ${res.status}` };
  } catch (e) {
    return {
      valid: false,
      error: `Cannot reach ${config.endpoint} — check the URL`,
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
  if (!config.apiKey) return null;

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
          "- Extract text from images via the ocr_image tool\n" +
          "- Search the web via the search_web tool\n" +
          "- Answer questions and solve problems\n" +
          "- When a user attaches an image, its text content is auto-extracted and included in their message\n\n" +
          "RULES:\n" +
          "- Never use emojis or emoticons in your responses. Use plain text only.\n" +
          "- Keep responses concise and practical.\n" +
          "- When a task requires running a command, use the appropriate tool.\n" +
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
      Authorization: `Bearer ${config.apiKey}`,
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
