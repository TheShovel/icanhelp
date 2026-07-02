const { loadConfig } = require('./store');
const { tools, executeToolCall } = require('./tools/registry');

const defaults = {
  provider: 'openrouter',
  model: 'gpt-4o-mini',
  endpoint: 'https://openrouter.ai/api/v1',
};

async function validateConfig(config) {
  if (config.provider === 'ollama') {
    try {
      const res = await fetch(`${config.endpoint}/tags`, { signal: AbortSignal.timeout(5000) });
      return res.ok ? { valid: true } : { valid: false, error: `Ollama returned status ${res.status}` };
    } catch (e) {
      return { valid: false, error: `Cannot reach Ollama at ${config.endpoint}` };
    }
  }

  try {
    const res = await fetch(`${config.endpoint}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: 'API key is invalid or unauthorized' };
    }
    return { valid: false, error: `Endpoint returned status ${res.status}` };
  } catch (e) {
    return { valid: false, error: `Cannot reach ${config.endpoint} — check the URL` };
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
    return models.map((m) => m.id || m.name).filter(Boolean).sort();
  } catch {
    return [];
  }
}

function buildConfig() {
  const stored = loadConfig();
  return { ...defaults, ...stored };
}

async function streamLLM(messages, effort) {
  const config = buildConfig();
  if (!config.apiKey) return null;

  var reasoningEffort = effort || config.reasoningEffort || undefined;
  var body = {
    model: config.model,
    stream: true,
    tools: tools,
    messages: [
      {
        role: 'system',
        content:
          'You are icanhelp, a helpful AI assistant running on a Linux desktop. ' +
          'You can run bash commands, read/write files, and list directories to help the user. ' +
          'When a task requires running a command, use the appropriate tool rather than just describing what to do.',
      },
      ...messages,
    ],
  };
  if (reasoningEffort) body.reasoning_effort = reasoningEffort;

  const res = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${error}`);
  }

  return res.body;
}

module.exports = { streamLLM, validateConfig, fetchModels };
