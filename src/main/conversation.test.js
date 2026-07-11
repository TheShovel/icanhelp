const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { modelsDir } = require("./paths");

const MODEL_PATH = path.join(modelsDir(), "Qwen_Qwen3.5-2B-Q4_K_M.gguf");

const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer directly without reasoning.";

const FILLER_TOPICS = [
  "Linux kernel",
  "Capital of France",
  "chmod command",
  "Check disk space",
  "What is SSH",
  "Symlink",
  "grep usage",
  "Pipe in Linux",
  "Env variables",
  "What is systemd",
  "List processes",
  "Cron job",
  "File perms",
  "Bash vs zsh",
  "Find file",
  "Man page",
  "stdout stderr",
  "Daemon process",
  "Package mgmt",
  "proc filesystem",
  "PATH variable",
  "Shebang",
  "Compress folder",
  "rsync usage",
  "TCP vs UDP",
  "Firewall",
  "How DNS works",
  "Load balancer",
  "RAID levels",
  "Container",
];

let LlamaChatSession = null;
let model = null;

function fillerMessages(count) {
  const msgs = [];
  for (let i = 0; i < count; i++) {
    msgs.push({
      role: "user",
      content: FILLER_TOPICS[i % FILLER_TOPICS.length],
    });
  }
  return msgs;
}

function compressFiller(messages, seedEnd, queryStart) {
  const seed = messages.slice(0, seedEnd);
  const query = messages.slice(queryStart);
  const filler = messages.slice(seedEnd, queryStart);

  if (filler.length === 0) return messages;

  const userTopics = filler
    .filter((m) => m.role === "user")
    .map((m) => m.content.slice(0, 40));

  if (userTopics.length === 0) return messages;

  const topicCount = userTopics.length;
  const summaryTopics =
    userTopics.length <= 4
      ? userTopics.join("; ")
      : userTopics.slice(0, 3).join("; ") +
        "... and " +
        (topicCount - 3) +
        " more short questions";

  return [
    ...seed,
    {
      role: "user",
      content: "Quick questions: " + summaryTopics + ". Reply briefly to each.",
    },
    {
      role: "assistant",
      content:
        "I answered all " +
        topicCount +
        " questions concisely. Ready for your next question.",
    },
    ...query,
  ];
}

function buildHistory(messages) {
  const history = [{ type: "system", text: SYSTEM_PROMPT }];
  for (const msg of messages) {
    if (msg.role === "user") {
      history.push({ type: "user", text: msg.content });
    } else if (msg.role === "assistant") {
      history.push({ type: "model", response: [msg.content] });
    } else if (msg.role === "tool") {
      history.push({ type: "user", text: "Function result: " + msg.content });
    }
  }
  return history;
}

function makeContext() {
  return model.createContext({ contextSize: 8192, batchSize: 512 });
}

function makeSession(ctx) {
  return new LlamaChatSession({
    contextSequence: ctx.getSequence(),
    systemPrompt: SYSTEM_PROMPT,
  });
}

async function runConversation(messages, opts) {
  const ctx = await makeContext();
  const session = makeSession(ctx);
  const history = buildHistory(messages);
  const last = history.pop();
  session.setChatHistory(history);
  const maxTokens = (opts && opts.maxTokens) || 8192;
  const result = await session.promptWithMeta(last.text, {
    maxTokens,
    temperature: 0.1,
    onTextChunk: () => {},
  });
  return result.responseText;
}

test("llm conversation tests", { timeout: 600000 }, async (t) => {
  const mod = await import("node-llama-cpp");
  LlamaChatSession = mod.LlamaChatSession;
  const llama = await mod.getLlama();
  model = await llama.loadModel({ modelPath: MODEL_PATH, gpuLayers: 99 });

  await t.test(
    "needle in haystack after 80 filler turns (compressed)",
    async () => {
      const secret = "neptune-omega-8472";
      const raw = [
        {
          role: "user",
          content: "Remember this passphrase: " + secret + ". Just reply 'ok'.",
        },
        { role: "assistant", content: "ok" },
        ...fillerMessages(80),
        {
          role: "user",
          content:
            "What was the passphrase I told you at the start? Reply briefly.",
        },
      ];
      const messages = compressFiller(raw, 2, raw.length - 1);
      const response = await runConversation(messages);
      const lower = response.toLowerCase();
      assert.ok(
        lower.includes("neptune") ||
          lower.includes("omega") ||
          lower.includes("8472"),
        "Expected secret passphrase. Got: " + response.slice(0, 200),
      );
    },
  );

  await t.test(
    "needle in haystack after 50 filler turns (compressed)",
    async () => {
      const secret = "mango-tango-foxtrot-99";
      const raw = [
        {
          role: "user",
          content: "My server recovery code is: " + secret + ".",
        },
        { role: "assistant", content: "Understood, I have saved that code." },
        ...fillerMessages(50),
        {
          role: "user",
          content: "What is my server recovery code? Just give me the code.",
        },
      ];
      const messages = compressFiller(raw, 2, raw.length - 1);
      const response = await runConversation(messages);
      const lower = response.toLowerCase();
      assert.ok(
        lower.includes("mango") ||
          lower.includes("tango") ||
          lower.includes("foxtrot") ||
          lower.includes("99"),
        "Expected recovery code. Got: " + response.slice(0, 200),
      );
    },
  );

  await t.test(
    "maintains instruction after 60 filler turns (compressed)",
    async () => {
      const raw = [
        {
          role: "user",
          content:
            "End every response with '--end--'. Reply 'understood --end--'.",
        },
        { role: "assistant", content: "understood --end--" },
        ...fillerMessages(60),
        {
          role: "user",
          content: "What is 2+2? End with --end--.",
        },
      ];
      const messages = compressFiller(raw, 2, raw.length - 1);
      const response = await runConversation(messages);
      assert.ok(
        response.includes("--end--"),
        "Expected --end-- marker. Got: " + response.slice(0, 200),
      );
    },
  );

  await t.test(
    "handles very long single message with fillers (compressed)",
    async () => {
      const prefix = "x".repeat(2000);
      const raw = [
        {
          role: "user",
          content:
            prefix +
            " After all that padding, remember the word BANANA. Just say 'ok'.",
        },
        { role: "assistant", content: "ok" },
        ...fillerMessages(30),
        {
          role: "user",
          content:
            "What word did I tell you to remember? Answer with just the word.",
        },
      ];
      const messages = compressFiller(raw, 2, raw.length - 1);
      const response = await runConversation(messages);
      assert.ok(
        response.toLowerCase().includes("banana"),
        "Expected BANANA. Got: " + response.slice(0, 200),
      );
    },
  );

  await t.test("empty history produces sensible response", async () => {
    const ctx = await makeContext();
    const session = makeSession(ctx);
    session.setChatHistory([{ type: "system", text: SYSTEM_PROMPT }]);
    const result = await session.promptWithMeta(
      "Reply with just the word 'PONG'.",
      {
        maxTokens: 512,
        temperature: 0.1,
        onTextChunk: () => {},
      },
    );
    assert.ok(
      result.responseText.length > 0,
      "Expected non-empty response, got: " +
        JSON.stringify(result.responseText),
    );
  });

  await t.test("independent sessions don't leak context", async () => {
    const ctxA = await makeContext();
    const sessionA = makeSession(ctxA);
    sessionA.setChatHistory([
      { type: "system", text: SYSTEM_PROMPT },
      { type: "user", text: "My name is Alice. Just say 'ok'." },
      { type: "model", response: ["ok"] },
    ]);
    await sessionA.promptWithMeta("What is my name?", {
      maxTokens: 512,
      temperature: 0.1,
      onTextChunk: () => {},
    });

    const ctxB = await makeContext();
    const sessionB = makeSession(ctxB);
    sessionB.setChatHistory([{ type: "system", text: SYSTEM_PROMPT }]);
    const resB = await sessionB.promptWithMeta("What is my name?", {
      maxTokens: 512,
      temperature: 0.1,
      onTextChunk: () => {},
    });

    assert.ok(
      !resB.responseText.toLowerCase().includes("alice"),
      "Session B should NOT know Alice. Got: " +
        resB.responseText.slice(0, 200),
    );
  });

  await t.test("tool calling with 40 filler turns (compressed)", async () => {
    const ctx = await makeContext();
    const session = makeSession(ctx);

    const writeFn = {
      description: "Write content to a file",
      params: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
      handler: async (params) => "File written: " + params.path,
    };
    const readFn = {
      description: "Read content from a file",
      params: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
      handler: async (params) =>
        params.path === "/tmp/test-memory.txt"
          ? "remember-this-token-xyz"
          : "(empty)",
    };

    const raw = [
      {
        role: "user",
        content:
          "Write 'remember-this-token-xyz' to /tmp/test-memory.txt using write_file.",
      },
      { role: "assistant", content: "Writing now." },
      { role: "tool", content: "File written: /tmp/test-memory.txt" },
      { role: "assistant", content: "File written." },
      ...fillerMessages(40),
      {
        role: "user",
        content:
          "Read /tmp/test-memory.txt with read_file and tell me what it contains.",
      },
    ];

    const messages = compressFiller(raw, 4, raw.length - 1);
    const history = buildHistory(messages);
    const lastPrompt = history.pop();
    session.setChatHistory(history);

    const result = await session.promptWithMeta(lastPrompt.text, {
      functions: { write_file: writeFn, read_file: readFn },
      documentFunctionParams: true,
      maxTokens: 512,
      temperature: 0.1,
      onTextChunk: () => {},
    });

    const text = result.responseText.toLowerCase();
    assert.ok(
      text.includes("remember") ||
        text.includes("token") ||
        text.includes("xyz"),
      "Expected file content recall. Got: " + result.responseText.slice(0, 300),
    );
  });

  await t.test("interleaved tool results across history", async () => {
    const ctx = await makeContext();
    const session = makeSession(ctx);

    const capitalizeFn = {
      description: "Capitalize text",
      params: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      handler: async (params) => params.text.toUpperCase(),
    };

    const messages = [
      { role: "user", content: "Capitalize 'hello world' using the tool." },
      { role: "assistant", content: "Let me do that." },
      { role: "tool", content: "HELLO WORLD" },
      { role: "assistant", content: "Result: HELLO WORLD" },
      { role: "user", content: "What is the opposite of capitalize?" },
      { role: "assistant", content: "Lowercase." },
      { role: "user", content: "Now capitalize 'goodbye' using the tool." },
    ];

    const history = buildHistory(messages);
    const lastPrompt = history.pop();
    session.setChatHistory(history);

    const result = await session.promptWithMeta(lastPrompt.text, {
      functions: { capitalize: capitalizeFn },
      documentFunctionParams: true,
      maxTokens: 512,
      temperature: 0.1,
      onTextChunk: () => {},
    });

    const text = result.responseText.toLowerCase();
    assert.ok(
      text.includes("goodbye") || text.includes("GOODBYE"),
      "Expected capitalize 'goodbye'. Got: " +
        result.responseText.slice(0, 300),
    );
  });

  await t.test("75-turn conversation stays coherent (compressed)", async () => {
    const raw = [
      {
        role: "user",
        content:
          "We will discuss three topics: Linux, networking, and security. Reply 'ready'.",
      },
      { role: "assistant", content: "ready" },
      ...fillerMessages(73),
      {
        role: "user",
        content:
          "What were the three topics I said we would discuss? List them.",
      },
    ];
    const messages = compressFiller(raw, 2, raw.length - 1);
    const response = await runConversation(messages, { maxTokens: 512 });
    const lower = response.toLowerCase();
    const matchCount =
      (lower.includes("linux") ? 1 : 0) +
      (lower.includes("network") ? 1 : 0) +
      (lower.includes("security") ? 1 : 0);
    assert.ok(
      matchCount >= 1,
      "Expected >= 1 topic match, got " +
        matchCount +
        "/3. Response: " +
        response.slice(0, 300),
    );
  });
});
