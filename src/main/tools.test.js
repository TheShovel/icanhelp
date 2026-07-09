const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const TEST_DIR = path.join(os.tmpdir(), "icanhelp-tools-test-" + Date.now());

test.before(() => {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
});

test.after(() => {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_) {}
});

test("fs - readFile reads existing file", async (t) => {
  const { readFile } = require("./tools/fs");
  const filePath = path.join(TEST_DIR, "test-read.txt");
  fs.writeFileSync(filePath, "hello world");

  const result = await readFile({ path: filePath });
  assert.strictEqual(result, "hello world");
});

test("fs - readFile returns error for missing file", async (t) => {
  const { readFile } = require("./tools/fs");
  const result = await readFile({
    path: path.join(TEST_DIR, "does-not-exist.txt"),
  });
  assert.ok(result.startsWith("Error:"));
});

test("fs - writeFile creates file with content", async (t) => {
  const { writeFile, readFile } = require("./tools/fs");
  const filePath = path.join(TEST_DIR, "test-write.txt");

  const result = await writeFile({
    path: filePath,
    content: "written content",
  });
  assert.ok(result.startsWith("File written:"));

  const content = await readFile({ path: filePath });
  assert.strictEqual(content, "written content");
});

test("fs - writeFile creates parent directories", async (t) => {
  const { writeFile, readFile } = require("./tools/fs");
  const deepPath = path.join(TEST_DIR, "nested", "deep", "file.txt");

  await writeFile({ path: deepPath, content: "deep content" });
  const content = await readFile({ path: deepPath });
  assert.strictEqual(content, "deep content");
});

test("fs - writeFile overwrites existing file", async (t) => {
  const { writeFile, readFile } = require("./tools/fs");
  const filePath = path.join(TEST_DIR, "overwrite.txt");
  fs.writeFileSync(filePath, "original");

  await writeFile({ path: filePath, content: "replaced" });
  const content = await readFile({ path: filePath });
  assert.strictEqual(content, "replaced");
});

test("fs - listDirectory lists files and folders", async (t) => {
  const { listDirectory } = require("./tools/fs");
  const dir = path.join(TEST_DIR, "list-test");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "subdir"));
  fs.writeFileSync(path.join(dir, "file1.txt"), "a");
  fs.writeFileSync(path.join(dir, "file2.txt"), "b");

  const result = await listDirectory({ path: dir });
  assert.ok(result.includes("📁 subdir"));
  assert.ok(result.includes("📄 file1.txt"));
  assert.ok(result.includes("📄 file2.txt"));
});

test("fs - listDirectory returns empty message for empty dir", async (t) => {
  const { listDirectory } = require("./tools/fs");
  const dir = path.join(TEST_DIR, "empty-test");
  fs.mkdirSync(dir, { recursive: true });

  const result = await listDirectory({ path: dir });
  assert.strictEqual(result, "(empty directory)");
});

test("fs - listDirectory returns error for missing dir", async (t) => {
  const { listDirectory } = require("./tools/fs");
  const result = await listDirectory({
    path: path.join(TEST_DIR, "no-such-dir"),
  });
  assert.ok(result.startsWith("Error:"));
});

test("fs - large file content is truncated", async (t) => {
  const { readFile } = require("./tools/fs");
  const filePath = path.join(TEST_DIR, "large.txt");
  const largeContent = "x".repeat(60000);
  fs.writeFileSync(filePath, largeContent);

  const result = await readFile({ path: filePath });
  assert.ok(result.includes("... (truncated)"));
  assert.ok(result.length < 60000 + "... (truncated)".length + 10);
});

test("bash - blocked commands are rejected", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: "rm -rf /" });
  assert.ok(result.includes("Error: Command blocked"));
});

test("bash - runs simple echo command", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: "echo hello-world-123" });
  assert.ok(result.includes("hello-world-123"));
});

test("bash - captures stdout", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: 'printf "line1\\nline2\\nline3"' });
  assert.ok(result.includes("line1"));
  assert.ok(result.includes("line2"));
  assert.ok(result.includes("line3"));
});

test("bash - returns error for unknown command", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: "nonexistent_cmd_xyz_123" });
  assert.ok(
    result.toLowerCase().includes("error") ||
      result.toLowerCase().includes("not found") ||
      result.trim() === "(no output)",
  );
});

test("bash - destructive command requires confirmation", async (t) => {
  const { runBash } = require("./tools/bash");
  let called = false;

  const result = await runBash({
    command: "pkill nonexistentprocess",
    onConfirm: async (cmd) => {
      called = true;
      return false;
    },
  });
  assert.strictEqual(result, "(cancelled by user)");
  assert.strictEqual(called, true);
});

test("bash - confirm can allow command to proceed", async (t) => {
  const { runBash } = require("./tools/bash");
  let called = false;

  const result = await runBash({
    command: "pkill nonexistentprocess",
    onConfirm: async (cmd) => {
      called = true;
      return true;
    },
  });
  assert.ok(result !== "(cancelled by user)");
  assert.strictEqual(called, true);
});

test("bash - long output is truncated", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: "yes | head -c 60000" });
  assert.ok(result.includes("... (truncated)"));
});

test("bash - empty/no output command returns (no output)", async (t) => {
  const { runBash } = require("./tools/bash");

  const result = await runBash({ command: "sleep 0" });
  assert.strictEqual(result.trim(), "(no output)");
});

test("registry - executeToolCall with valid tool", async (t) => {
  const { executeToolCall } = require("./tools/registry");
  const filePath = path.join(TEST_DIR, "registry-test.txt");
  fs.writeFileSync(filePath, "registry content");

  const result = await executeToolCall({
    function: {
      name: "read_file",
      arguments: JSON.stringify({ path: filePath }),
    },
  });
  assert.strictEqual(result, "registry content");
});

test("registry - executeToolCall with unknown tool", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: { name: "unknown_tool_xyz", arguments: "{}" },
  });
  assert.ok(result.includes("Unknown tool"));
});

test("registry - executeToolCall with invalid json arguments", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: { name: "read_file", arguments: "not valid json" },
  });
  assert.ok(result.includes("Invalid arguments"));
});

test("registry - executeToolCall read_file passes through", async (t) => {
  const { executeToolCall } = require("./tools/registry");
  const filePath = path.join(TEST_DIR, "passthrough.txt");
  fs.writeFileSync(filePath, "passthrough ok");

  const result = await executeToolCall({
    function: {
      name: "read_file",
      arguments: JSON.stringify({ path: filePath }),
    },
  });
  assert.strictEqual(result, "passthrough ok");
});

test("registry - executeToolCall write_file passes through", async (t) => {
  const { executeToolCall } = require("./tools/registry");
  const filePath = path.join(TEST_DIR, "tool-write.txt");

  const result = await executeToolCall({
    function: {
      name: "write_file",
      arguments: JSON.stringify({ path: filePath, content: "tool-written" }),
    },
  });
  assert.ok(result.startsWith("File written:"));
});

test("registry - tools array has all expected tools", async (t) => {
  const { tools } = require("./tools/registry");

  const names = tools.map((t) => t.function.name).sort();
  assert.ok(names.includes("search_web"));
  assert.ok(names.includes("run_bash"));
  assert.ok(names.includes("read_file"));
  assert.ok(names.includes("write_file"));
  assert.ok(names.includes("list_directory"));
  assert.ok(names.includes("ocr_image"));
  assert.ok(names.includes("set_theme"));
  assert.ok(names.includes("list_themes"));
  assert.ok(names.includes("apply_theme"));
  assert.ok(names.includes("delete_theme"));
  assert.ok(names.includes("store_knowledge"));
  assert.ok(names.includes("search_knowledge"));
  assert.ok(names.includes("list_knowledge"));
  assert.ok(names.includes("clear_knowledge"));
});

test("registry - executeToolCall list_themes returns stub", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: { name: "list_themes", arguments: "{}" },
  });
  const parsed = JSON.parse(result);
  assert.ok(parsed.themes !== undefined);
});

test("registry - executeToolCall delete_theme returns ok", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: {
      name: "delete_theme",
      arguments: JSON.stringify({ name: "test" }),
    },
  });
  const parsed = JSON.parse(result);
  assert.strictEqual(parsed.ok, true);
});

test("registry - executeToolCall apply_theme returns ok", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: {
      name: "apply_theme",
      arguments: JSON.stringify({ name: "test" }),
    },
  });
  const parsed = JSON.parse(result);
  assert.strictEqual(parsed.ok, true);
});

test("registry - executeToolCall list_directory", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: {
      name: "list_directory",
      arguments: JSON.stringify({ path: TEST_DIR }),
    },
  });
  assert.ok(typeof result === "string");
});

test("registry - executeToolCall run_bash", async (t) => {
  const { executeToolCall } = require("./tools/registry");

  const result = await executeToolCall({
    function: {
      name: "run_bash",
      arguments: JSON.stringify({ command: "echo tool-test-789" }),
    },
  });
  assert.ok(result.includes("tool-test-789"));
});

test("bash - chmod 777 triggers confirmation", async (t) => {
  const { runBash } = require("./tools/bash");
  let called = false;

  await runBash({
    command: "chmod 777 /tmp",
    onConfirm: async (cmd) => {
      called = true;
      return false;
    },
  });
  assert.strictEqual(called, true);
});

test("bash - kill command triggers confirmation", async (t) => {
  const { runBash } = require("./tools/bash");
  let called = false;

  await runBash({
    command: "kill 99999",
    onConfirm: async (cmd) => {
      called = true;
      return false;
    },
  });
  assert.strictEqual(called, true);
});

test("llm-local - estimateTokens on empty history", async (t) => {
  const { estimateTokens } = require("./llm-local");
  assert.strictEqual(estimateTokens([]), 0);
});

test("llm-local - estimateTokens counts chars", async (t) => {
  const { estimateTokens } = require("./llm-local");
  const history = [
    { type: "system", text: "You are helpful." },
    { type: "user", text: "Hello world" },
    { type: "model", response: ["Hi there!"] },
  ];
  const tokens = estimateTokens(history);
  assert.ok(tokens > 0);
  assert.ok(tokens < 50);
});

test("llm-local - compressHistory leaves short history unchanged", async (t) => {
  const { compressHistory } = require("./llm-local");
  const history = [
    { type: "system", text: "You are helpful." },
    { type: "user", text: "Hi" },
    { type: "model", response: ["Hello"] },
  ];
  const result = compressHistory(history, 1024);
  assert.deepStrictEqual(result, history);
});

test("llm-local - compressHistory preserves system message", async (t) => {
  const { compressHistory } = require("./llm-local");
  const system = { type: "system", text: "Be helpful." };
  const history = [system];
  for (let i = 0; i < 100; i++) {
    history.push({
      type: "user",
      text:
        "Message " +
        i +
        " padded to increase tokens significantly beyond threshold",
    });
  }
  const result = compressHistory(history, 1024);
  assert.deepStrictEqual(result[0], system);
  assert.ok(result.length < history.length);
});

test("llm-local - compressHistory keeps recent messages intact", async (t) => {
  const { compressHistory } = require("./llm-local");
  const history = [{ type: "system", text: "Be helpful." }];
  for (let i = 0; i < 50; i++) {
    history.push({
      type: "user",
      text:
        "Topic " +
        i +
        ": detailed discussion with extra padding to fill token space up",
    });
    history.push({
      type: "model",
      response: [
        "Response to topic " + i + " also with more words for token count",
      ],
    });
  }
  const recent = history.slice(-6);
  const result = compressHistory(history, 1024);
  assert.ok(result.length < history.length);
  assert.deepStrictEqual(result.slice(-6), recent);
});

test("llm-local - compressHistory preserves tool messages", async (t) => {
  const { compressHistory } = require("./llm-local");
  const history = [
    { type: "system", text: "Be helpful." },
    { type: "user", text: "Write a file" },
    { type: "model", response: ["Calling write_file..."] },
    { type: "user", text: "Function result: File written" },
    { type: "model", response: ["File written successfully."] },
  ];
  for (let i = 0; i < 30; i++) {
    history.push({
      type: "user",
      text: "Filler question " + i + " with extra words for token padding",
    });
    history.push({
      type: "model",
      response: ["Filler answer " + i + " also padded with more text here"],
    });
  }
  history.push({ type: "user", text: "Read the file back" });
  const result = compressHistory(history, 1024);
  const toolCount = result.filter(
    (item) => item.text && item.text.startsWith("Function result:"),
  ).length;
  assert.strictEqual(toolCount, 1);
});

test("llm-local - compressHistory output has valid types", async (t) => {
  const { compressHistory } = require("./llm-local");
  const history = [{ type: "system", text: "Be helpful." }];
  for (let i = 0; i < 40; i++) {
    history.push({
      type: "user",
      text:
        "Question " +
        i +
        " with extra tokens to quickly exceed the threshold limit now",
    });
    history.push({
      type: "model",
      response: [
        "Answer " + i + " padded with more content for threshold testing",
      ],
    });
  }
  const result = compressHistory(history, 1024);
  for (const item of result) {
    assert.ok(
      item.type === "system" || item.type === "user" || item.type === "model",
      "Invalid type: " + item.type,
    );
    if (item.type === "model") {
      assert.ok(Array.isArray(item.response));
    }
  }
});
