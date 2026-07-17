const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), "icanhelp-chat-test-" + Date.now());
const origChatsDir = path.join(os.homedir(), ".config", "icanhelp", "chats");

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
  const configDir = path.join(TEST_DIR, ".config", "icanhelp");
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  os.homedir = () => TEST_DIR;
}

function cleanup() {
  try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (_) {}
}

test("chat-store - save and load single chat", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const chat = {
      id: "chat_test1",
      name: "Test Chat",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, "chat_test1");
    assert.strictEqual(loaded[0].name, "Test Chat");
    assert.strictEqual(loaded[0].messages.length, 2);
    assert.strictEqual(loaded[0].messages[0].role, "user");
    assert.strictEqual(loaded[0].messages[1].content, "Hi there!");
  } finally {
    cleanup();
  }
});

test("chat-store - loadAllChats returns empty when no chats", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 0);
  } finally {
    cleanup();
  }
});

test("chat-store - multiple chats save and load", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    for (let i = 0; i < 10; i++) {
      chatStore.saveChat({
        id: "chat_" + i,
        name: "Chat " + i,
        messages: Array.from({ length: i + 1 }, (_, j) => ({
          role: j % 2 === 0 ? "user" : "assistant",
          content: "Message " + j + " in chat " + i,
        })),
        createdAt: Date.now() + i,
        updatedAt: Date.now() + i,
      });
    }

    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 10);
    assert.strictEqual(loaded[0].messages.length, 1);
    assert.strictEqual(loaded[9].messages.length, 10);
  } finally {
    cleanup();
  }
});

test("chat-store - overwrite existing chat", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    chatStore.saveChat({
      id: "overwrite_test",
      name: "Original",
      messages: [{ role: "user", content: "first" }],
      createdAt: 1000,
      updatedAt: 1000,
    });

    chatStore.saveChat({
      id: "overwrite_test",
      name: "Updated",
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "second" },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    });

    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].name, "Updated");
    assert.strictEqual(loaded[0].messages.length, 2);
    assert.strictEqual(loaded[0].messages[1].content, "second");
  } finally {
    cleanup();
  }
});

test("chat-store - delete chat removes file", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    chatStore.saveChat({
      id: "to_delete",
      name: "Delete Me",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    chatStore.saveChat({
      id: "to_keep",
      name: "Keep Me",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    chatStore.deleteChat("to_delete");
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, "to_keep");
  } finally {
    cleanup();
  }
});

test("chat-store - delete non-existent chat does nothing", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    chatStore.saveChat({
      id: "exists",
      name: "I exist",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    chatStore.deleteChat("nonexistent");
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, "exists");
  } finally {
    cleanup();
  }
});

test("chat-store - save chat with tool calls, thinking, sources, files", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const chat = {
      id: "rich_chat",
      name: "Rich Chat",
      messages: [
        {
          role: "user",
          content: "Write a file",
          attachment: {
            name: "test.png",
            path: "/tmp/test.png",
            type: "image/png",
            text: "OCR content here",
          },
        },
        {
          role: "assistant",
          content: "Here's the result",
          thinking: "I should write this file carefully...",
          tools: [
            {
              name: "write_file",
              args: { path: "/tmp/output.txt", content: "hello world" },
              output: "File written: /tmp/output.txt",
            },
            {
              name: "search_web",
              args: { query: "test query" },
              output: '[{"url":"https://example.com","title":"Example"}]',
            },
          ],
          sources: [
            { url: "https://example.com", title: "Example Domain" },
          ],
          files: ["/tmp/output.txt"],
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);

    const msg0 = loaded[0].messages[0];
    assert.strictEqual(msg0.role, "user");
    assert.ok(msg0.attachment);
    assert.strictEqual(msg0.attachment.name, "test.png");
    assert.strictEqual(msg0.attachment.text, "OCR content here");

    const msg1 = loaded[0].messages[1];
    assert.strictEqual(msg1.role, "assistant");
    assert.strictEqual(msg1.content, "Here's the result");
    assert.strictEqual(msg1.thinking, "I should write this file carefully...");
    assert.strictEqual(msg1.tools.length, 2);
    assert.strictEqual(msg1.tools[0].name, "write_file");
    assert.strictEqual(msg1.tools[0].output, "File written: /tmp/output.txt");
    assert.strictEqual(msg1.sources.length, 1);
    assert.strictEqual(msg1.sources[0].url, "https://example.com");
    assert.strictEqual(msg1.files.length, 1);
    assert.strictEqual(msg1.files[0], "/tmp/output.txt");
  } finally {
    cleanup();
  }
});

test("chat-store - large chat with 500 messages round-trip", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const messages = [];
    for (let i = 0; i < 500; i++) {
      messages.push({
        role: i % 2 === 0 ? "user" : "assistant",
        content: "Message " + i + " padding: " + "x".repeat(200),
      });
    }

    const chat = {
      id: "large_chat",
      name: "Large Chat",
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].messages.length, 500);
    assert.strictEqual(loaded[0].messages[0].content.startsWith("Message 0"), true);
    assert.strictEqual(loaded[0].messages[499].content.startsWith("Message 499"), true);
  } finally {
    cleanup();
  }
});

test("chat-store - special characters survive round-trip", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const chat = {
      id: "unicode_chat",
      name: "🎉 Unicode こんにちは",
      messages: [
        {
          role: "user",
          content: "Unicode: 🚀 こんにちは\nNewlines\nQuotes: \"hello\" 'world'\nBackslashes: \\test\\",
        },
        {
          role: "assistant",
          content: "Special chars: <>&\"'\n```\ncode block\n```\n",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);
    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].name, "🎉 Unicode こんにちは");
    assert.strictEqual(loaded[0].messages[0].content, chat.messages[0].content);
    assert.strictEqual(loaded[0].messages[1].content, chat.messages[1].content);
  } finally {
    cleanup();
  }
});

test("chat-store - corrupted file falls back to backup", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const chat = {
      id: "corrupt_test",
      name: "Good Chat",
      messages: [{ role: "user", content: "hello" }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);

    const chatsDir = path.join(TEST_DIR, ".config", "icanhelp", "chats");
    const chatFile = path.join(chatsDir, "corrupt_test.json");

    chat.messages.push({ role: "assistant", content: "hi back" });
    chatStore.saveChat(chat);

    fs.writeFileSync(chatFile, "this is not valid json {{{", { mode: 0o600 });

    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].name, "Good Chat");
    assert.strictEqual(loaded[0].messages.length, 1);
    assert.strictEqual(loaded[0].messages[0].content, "hello");
  } finally {
    cleanup();
  }
});

test("chat-store - atomic write leaves no partial files", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const chat = {
      id: "atomic_test",
      name: "Atomic",
      messages: [{ role: "user", content: "test" }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    chatStore.saveChat(chat);

    const chatsDir = path.join(TEST_DIR, ".config", "icanhelp", "chats");
    const files = fs.readdirSync(chatsDir);
    const tmpFiles = files.filter(f => f.startsWith(".") && f.endsWith(".tmp"));
    assert.strictEqual(tmpFiles.length, 0, "No temp files should remain after save");

    const jsonFiles = files.filter(f => f.endsWith(".json") && !f.endsWith(".bak"));
    assert.ok(jsonFiles.length >= 1, "Should have at least one json file");
  } finally {
    cleanup();
  }
});

test("chat-store - migrate from config format", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const oldChats = [
      {
        id: "old_chat_1",
        name: "Old Chat 1",
        messages: [{ role: "user", content: "legacy message" }],
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: "old_chat_2",
        name: "Old Chat 2",
        messages: [
          { role: "user", content: "another" },
          { role: "assistant", content: "response" },
        ],
        createdAt: 3000,
        updatedAt: 4000,
      },
    ];

    const count = chatStore.migrateFromConfig(oldChats);
    assert.strictEqual(count, 2);

    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 2);
    assert.strictEqual(loaded[0].name, "Old Chat 1");
    assert.strictEqual(loaded[1].messages.length, 2);
  } finally {
    cleanup();
  }
});

test("chat-store - empty config migration does nothing", async (t) => {
  setup();
  try {
    delete require.cache[require.resolve("./chat-store")];
    const chatStore = require("./chat-store");

    const count = chatStore.migrateFromConfig([]);
    assert.strictEqual(count, 0);

    const count2 = chatStore.migrateFromConfig(null);
    assert.strictEqual(count2, 0);

    const loaded = chatStore.loadAllChats();
    assert.strictEqual(loaded.length, 0);
  } finally {
    cleanup();
  }
});
