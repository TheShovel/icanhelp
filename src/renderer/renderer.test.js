const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

var rendererJs = fs.readFileSync(path.join(__dirname, "renderer.js"), "utf8");
var iconsJs = fs.readFileSync(path.join(__dirname, "icons.js"), "utf8");
var html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function createTestDOM() {
  var cleanHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");
  var dom = new JSDOM(cleanHtml, {
    url: "file://" + __dirname + "/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
  });

  var win = dom.window;
  win.Element.prototype.scrollTo = function () {};

  win.electronAPI = {
    buddyArt: function (name) {
      return "buddy://" + name + ".png";
    },
    dragWindow: function () {},
    resizeWindow: function () {},
    parseMarkdown: function (text) {
      return Promise.resolve(text);
    },
    sendToolAck: function () {},
    onLLMChunk: function (callback) {
      dom._llmCallback = callback;
      return function () {
        dom._llmCallback = null;
      };
    },
    startLLMStream: function () {},
    sendSudoPassword: function () {},
    sendConfirmResponse: function () {},
    cancelStream: function () {},
    		loadChats: function () {
    			return Promise.resolve([]);
    		},
    		saveChats: function () {
    			return Promise.resolve();
    		},
    		saveChat: function () {
    			return Promise.resolve();
    		},
    		deleteChat: function () {
    			return Promise.resolve();
    		},
    showContextMenu: function () {},
    onOpenSettings: function () {},
    onOpenChatList: function () {},
    selectAttachment: function () {},
    takeScreenshot: function () {},
    openFile: function () {},
    quitApp: function () {},
    onVisionProgress: function () {},
    onApplyTheme: function () {},
    onThemesChanged: function () {},
    loadThemes: function () {
      return Promise.resolve({});
    },
    deleteTheme: function () {
      return Promise.resolve({ ok: true });
    },
    applyTheme: function () {},
    loadActiveTheme: function () {
      return Promise.resolve(null);
    },
    resetActiveTheme: function () {},
    getRecommendedModels: function () {
      return Promise.resolve([]);
    },
    getSystemInfo: function () {
      return Promise.resolve({
        totalRamGB: 16,
        freeRamGB: 8,
        cpuCores: 8,
        gpuInfo: "none",
      });
    },
    getCompatibleModels: function () {
      return Promise.resolve([]);
    },
    listDownloadedModels: function () {
      return Promise.resolve([]);
    },
    downloadModel: function () {
      return Promise.resolve({});
    },
    deleteModel: function () {
      return Promise.resolve({ ok: true });
    },
    onModelDownloadProgress: function () {},
    preloadModel: function () {
      return Promise.resolve({});
    },
    onModelPreloadProgress: function () {},
    resetAllData: function () {},
    hasConfig: function () {
      return Promise.resolve(true);
    },
    getConfig: function () {
      return Promise.resolve({ modelPath: "/fake/model.gguf" });
    },
    saveConfig: function () {
      return Promise.resolve();
    },
  };

  win.eval(iconsJs);
  win.eval(rendererJs);

  return dom;
}

async function setupListener(dom) {
  var win = dom.window;
  var doc = win.document;

  win.chats = [];
  win.currentChatId = null;
  win.chatOpen = true;

  doc.getElementById("chat-input").value = "test message";
  win.currentAttachment = null;

  var chatPanel = doc.getElementById("chat-panel");
  chatPanel.classList.remove("hidden");

  await win.sendMessage();
}

function sendChunk(dom, chunk) {
  if (dom._llmCallback) {
    dom._llmCallback(chunk);
  }
}

function waitForRAF(dom) {
  // jsdom rAF fires after ~16ms with pretendToBeVisual:true
  return new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 30);
  });
}

function assistantBubble(doc) {
  var msg = doc.querySelector(".message.assistant");
  if (!msg) return null;
  return msg.querySelector(".bubble");
}

test("tool_start creates tool block with header and command text", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "echo hello" } },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  assert.ok(toolBlock, "tool-block should exist");
  assert.ok(
    toolBlock.classList.contains("tool-working"),
    "should have tool-working class",
  );

  var header = toolBlock.querySelector(".tool-header");
  assert.ok(header, "tool-header should exist");
  assert.ok(
    header.textContent.includes("echo hello"),
    "header should show command",
  );

  var content = toolBlock.querySelector(".tool-content");
  assert.ok(content, "tool-content should exist");

  var pre = content.querySelector(".tool-text");
  assert.ok(pre, "tool-text should exist");
  assert.strictEqual(
    pre.textContent,
    "echo hello",
    "pre should contain command text",
  );

  var bubble = assistantBubble(doc);
  assert.ok(bubble, "assistant bubble should exist");

  var workingIndicator = bubble.querySelector(".working-indicator");
  assert.ok(workingIndicator, "working-indicator should exist");
  assert.strictEqual(
    workingIndicator.textContent.trim(),
    "Working...",
    "working indicator should show Working...",
  );
});

test("tool_start creates tool block immediately without ack", async function (t) {
  var dom = createTestDOM();

  var ackCalled = false;
  dom.window.electronAPI.sendToolAck = function () {
    ackCalled = true;
  };

  await setupListener(dom);

  // Tool block should exist synchronously after sendChunk (no ack waiting)
  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "ls" } },
  });

  var toolBlock = dom.window.document.querySelector(".tool-block");
  assert.ok(
    toolBlock,
    "tool-block should exist synchronously after tool_start",
  );

  // No ack should have been sent (we removed the ack mechanism)
  assert.ok(!ackCalled, "sendToolAck should NOT be called");
});

test("write_file shows file capsule with file path", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/home/test/output.txt", content: "hello" },
    },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  assert.ok(toolBlock, "tool-block should exist");
  assert.ok(
    toolBlock.classList.contains("tool-file"),
    "tool-block should have tool-file class",
  );

  var capsule = doc.querySelector(".tool-file-capsule");
  assert.ok(capsule, "tool-file-capsule should exist");
  assert.ok(
    capsule.textContent.includes("output.txt"),
    "capsule should show file path",
  );

  var header = doc.querySelector(".tool-header");
  assert.ok(header, "tool-header should exist");
  assert.ok(
    header.textContent.includes("output.txt"),
    "header should contain file path",
  );
});

test("file capsule click calls openFile with correct path", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  var openedPath = null;
  dom.window.electronAPI.openFile = function (filePath) {
    openedPath = filePath;
  };

  sendChunk(dom, {
    tool_start: {
      name: "read_file",
      args: { path: "/tmp/testfile.txt" },
    },
  });
  await waitForRAF(dom);

  var capsule = doc.querySelector(".tool-file-capsule");
  assert.ok(capsule, "capsule should exist");

  capsule.click();
  assert.strictEqual(
    openedPath,
    "/tmp/testfile.txt",
    "clicking capsule should open correct path",
  );

  // Also test header click opens the file
  openedPath = null;
  var header = doc.querySelector(".tool-header");
  header.click();
  assert.strictEqual(
    openedPath,
    "/tmp/testfile.txt",
    "clicking header should also open file",
  );
});

test("working indicator visible during tool execution", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "echo hi" } },
  });
  await waitForRAF(dom);

  var bubble = assistantBubble(doc);
  var workingIndicator = bubble.querySelector(".working-indicator");
  assert.ok(workingIndicator, "working-indicator should exist");
  assert.ok(
    !workingIndicator.classList.contains("hidden"),
    "working indicator should be visible during tool execution",
  );
  assert.strictEqual(
    workingIndicator.textContent.trim(),
    "Working...",
    "should show Working... during tool execution",
  );
});

test("working indicator hidden on done", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "echo hi" } },
  });
  await waitForRAF(dom);

  sendChunk(dom, { done: true });
  await waitForRAF(dom);

  var bubble = assistantBubble(doc);
  var workingIndicator = bubble.querySelector(".working-indicator");
  assert.ok(workingIndicator, "working-indicator should exist");
  assert.ok(
    workingIndicator.classList.contains("hidden"),
    "working indicator should be hidden on done",
  );
});

test("tool_start for search_web uses query in header", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "search_web", args: { query: "linux kernel" } },
  });
  await waitForRAF(dom);

  var header = doc.querySelector(".tool-header");
  assert.ok(header, "tool-header should exist");
  assert.ok(
    header.textContent.includes("linux kernel"),
    "header should contain query",
  );
});

test("read_file shows file capsule with file path", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "read_file", args: { path: "/home/test/file.txt" } },
  });
  await waitForRAF(dom);

  // read_file should have tool-file class
  var toolBlock = doc.querySelector(".tool-block");
  assert.ok(toolBlock, "tool-block should exist");
  assert.ok(
    toolBlock.classList.contains("tool-file"),
    "tool-block should have tool-file class",
  );

  // Should have a file capsule, not tool-text
  var capsule = doc.querySelector(".tool-file-capsule");
  assert.ok(capsule, "tool-file-capsule should exist");
  assert.ok(
    capsule.textContent.includes("file.txt"),
    "capsule should show file path",
  );

  // Should NOT have a tool-text pre
  var pre = doc.querySelector(".tool-text");
  assert.ok(!pre, "tool-text should NOT exist for file tools");

  // Header should show the file path
  var header = doc.querySelector(".tool-header");
  assert.ok(header, "tool-header should exist");
  assert.ok(
    header.textContent.includes("file.txt"),
    "header should contain file path",
  );
});

test("tool_end adds output to tool block", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "echo hello" } },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  toolBlock.dataset.started = Date.now();

  sendChunk(dom, {
    tool_end: { name: "run_bash", output: "hello world" },
  });
  await new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 350);
  });

  var output = doc.querySelector(".tool-output");
  assert.ok(output, "tool-output should exist");
  assert.ok(
    output.textContent.includes("hello"),
    "output should contain command output",
  );
});

test("tool_end preserves header and command text", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "test-command" } },
  });
  await waitForRAF(dom);

  var headerBefore = doc.querySelector(".tool-header").textContent;
  var preBefore = doc.querySelector(".tool-text").textContent;

  sendChunk(dom, {
    tool_end: { name: "run_bash", output: "result-output" },
  });
  await waitForRAF(dom);

  var headerAfter = doc.querySelector(".tool-header").textContent;
  var preAfter = doc.querySelector(".tool-text").textContent;

  assert.strictEqual(
    headerAfter,
    headerBefore,
    "header should be preserved after tool_end",
  );
  assert.strictEqual(
    preAfter,
    preBefore,
    "command text should be preserved after tool_end",
  );
});

test("tool_start creates multiple tool blocks for sequential tools", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "first" } },
  });
  await waitForRAF(dom);

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "second" } },
  });
  await waitForRAF(dom);

  var blocks = doc.querySelectorAll(".tool-block");
  assert.strictEqual(blocks.length, 2, "two tool blocks should exist");

  var firstText = blocks[0].querySelector(".tool-text");
  assert.strictEqual(
    firstText.textContent,
    "first",
    "first block should have first command",
  );

  var secondText = blocks[1].querySelector(".tool-text");
  assert.strictEqual(
    secondText.textContent,
    "second",
    "second block should have second command",
  );
});

test("tool_start before any message creates assistant message", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  var preCount = doc.querySelectorAll(".message.assistant").length;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "ls" } },
  });
  await waitForRAF(dom);

  var messages = doc.querySelectorAll(".message.assistant");
  assert.strictEqual(
    messages.length,
    preCount + 1,
    "a new assistant message should be created",
  );
});

test("tool_start sets avatar state for bash tool", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "ls" } },
  });
  await waitForRAF(dom);

  var avatar = doc.getElementById("avatar");
  assert.ok(
    avatar.classList.contains("avatar-bash"),
    "avatar should show bash state",
  );
});

test("tool_start sets avatar state for search_web tool", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "search_web", args: { query: "test" } },
  });
  await waitForRAF(dom);

  var avatar = doc.getElementById("avatar");
  assert.ok(
    avatar.classList.contains("avatar-search"),
    "avatar should show search state",
  );
});

test("tool_start truncates long labels", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  var longCommand = "a".repeat(100);
  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: longCommand } },
  });
  await waitForRAF(dom);

  var header = doc.querySelector(".tool-header");
  assert.ok(
    header.textContent.length < longCommand.length + 20,
    "header should be truncated",
  );
  assert.ok(
    header.textContent.includes("..."),
    "truncated header should include ...",
  );
});

test("tool block header toggles collapse on click", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "echo test" } },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  var header = toolBlock.querySelector(".tool-header");

  assert.ok(
    !toolBlock.classList.contains("collapsed"),
    "should not be collapsed initially",
  );

  header.click();
  assert.ok(toolBlock.classList.contains("collapsed"), "click should collapse");

  header.click();
  assert.ok(
    !toolBlock.classList.contains("collapsed"),
    "second click should uncollapse",
  );
});

test("tool block DOM structure ordering is correct", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: { name: "run_bash", args: { command: "top" } },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  assert.ok(toolBlock, "tool-block exists");

  var header = toolBlock.querySelector(".tool-header");
  var content = toolBlock.querySelector(".tool-content");
  assert.ok(header, "header exists");
  assert.ok(content, "content exists");
  assert.strictEqual(
    header.nextElementSibling,
    content,
    "header should be followed by content",
  );

  var bubble = assistantBubble(doc);
  assert.ok(bubble, "assistant bubble exists");

  var thinkingBlock = bubble.querySelector(".thinking-block");
  var responseContent = bubble.querySelector(".response-content");
  assert.ok(thinkingBlock, "thinking-block exists");
  assert.ok(responseContent, "response-content exists");

  assert.strictEqual(
    thinkingBlock.nextElementSibling,
    toolBlock,
    "tool-block should follow thinking-block",
  );
  assert.strictEqual(
    toolBlock.nextElementSibling,
    responseContent,
    "response-content should follow tool-block",
  );
});

test("full tool lifecycle preserves all content", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: {
      name: "run_bash",
      args: { command: "find /tmp -name '*.txt'" },
    },
  });
  await waitForRAF(dom);

  var toolBlock = doc.querySelector(".tool-block");
  assert.ok(toolBlock, "tool-block exists after start");
  assert.strictEqual(
    toolBlock.querySelector(".tool-header").textContent.includes("find"),
    true,
    "header shows command",
  );
  assert.strictEqual(
    toolBlock.querySelector(".tool-text").textContent,
    "find /tmp -name '*.txt'",
    "tool-text shows full command",
  );

  toolBlock.dataset.started = Date.now() - 5000;

  sendChunk(dom, {
    tool_end: { name: "run_bash", output: "file1.txt\nfile2.txt" },
  });

  // Wait for setTimeout callbacks (tool-working removal scheduled with delay)
  await new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 10);
  });
  await waitForRAF(dom);

  assert.strictEqual(
    toolBlock.querySelector(".tool-header").textContent.includes("find"),
    true,
    "header survives end",
  );
  assert.strictEqual(
    toolBlock.querySelector(".tool-text").textContent,
    "find /tmp -name '*.txt'",
    "command text survives end",
  );

  var output = toolBlock.querySelector(".tool-output");
  assert.ok(output, "tool-output exists");
  assert.ok(output.textContent.includes("file1.txt"), "output shows file1.txt");

  assert.ok(
    !toolBlock.classList.contains("tool-working"),
    "tool-working removed after animation",
  );
});

test("write_file adds path to toolFilePaths", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);

  var originalLength = dom.window.toolFilePaths.length;

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/test-output.txt", content: "hello" },
    },
  });
  await waitForRAF(dom);

  assert.strictEqual(
    dom.window.toolFilePaths.length,
    originalLength + 1,
    "toolFilePaths should contain the written file path",
  );
  assert.ok(
    dom.window.toolFilePaths.indexOf("/tmp/test-output.txt") !== -1,
    "toolFilePaths should include /tmp/test-output.txt",
  );
});

test("read_file adds path to toolFilePaths", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);

  var originalLength = dom.window.toolFilePaths.length;

  sendChunk(dom, {
    tool_start: {
      name: "read_file",
      args: { path: "/etc/hostname" },
    },
  });
  await waitForRAF(dom);

  assert.strictEqual(
    dom.window.toolFilePaths.length,
    originalLength + 1,
    "toolFilePaths should contain the read file path",
  );
  assert.ok(
    dom.window.toolFilePaths.indexOf("/etc/hostname") !== -1,
    "toolFilePaths should include /etc/hostname",
  );
});

test("toolFilePaths cleared on done", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/test.txt", content: "data" },
    },
  });
  await waitForRAF(dom);

  assert.ok(
    dom.window.toolFilePaths.length > 0,
    "toolFilePaths should have entries during tool execution",
  );

  sendChunk(dom, { done: true });
  await waitForRAF(dom);

  assert.strictEqual(
    dom.window.toolFilePaths.length,
    0,
    "toolFilePaths should be empty after done",
  );
});

test("file paths in response text become clickable links", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  // First send tool_start to populate toolFilePaths
  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/myfile.txt", content: "data" },
    },
  });
  await waitForRAF(dom);

  // Send text that mentions the file path
  sendChunk(dom, { text: "I wrote your file /tmp/myfile.txt for you" });
  await new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 30);
  });

  // The responseContent should now contain a file-link
  var bubble = assistantBubble(doc);
  var responseContent = bubble.querySelector(".response-content");
  var fileLink = responseContent.querySelector(".file-link");
  assert.ok(fileLink, "file-link should exist in response content");
  assert.ok(
    fileLink.textContent.indexOf("/tmp/myfile.txt") !== -1,
    "file-link should contain the file path",
  );
  assert.strictEqual(
    fileLink.title,
    "Open /tmp/myfile.txt",
    "file-link title should indicate opening the file",
  );
});

test("clicking file link opens the file", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  var openedPath = null;
  dom.window.electronAPI.openFile = function (filePath) {
    openedPath = filePath;
  };

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/clickme.txt", content: "data" },
    },
  });
  await waitForRAF(dom);

  sendChunk(dom, { text: "Saved to /tmp/clickme.txt" });
  await new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 30);
  });

  var bubble = assistantBubble(doc);
  var responseContent = bubble.querySelector(".response-content");
  var fileLink = responseContent.querySelector(".file-link");
  assert.ok(fileLink, "file-link should exist");

  fileLink.click();
  assert.strictEqual(
    openedPath,
    "/tmp/clickme.txt",
    "clicking file-link should open the correct path",
  );
});

test("multiple file paths are all linkified", async function (t) {
  var dom = createTestDOM();
  await setupListener(dom);
  var doc = dom.window.document;

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/first.txt", content: "a" },
    },
  });
  await waitForRAF(dom);

  sendChunk(dom, {
    tool_start: {
      name: "write_file",
      args: { path: "/tmp/second.txt", content: "b" },
    },
  });
  await waitForRAF(dom);

  sendChunk(dom, { text: "Created /tmp/first.txt and /tmp/second.txt" });
  await new Promise(function (resolve) {
    dom.window.setTimeout(resolve, 30);
  });

  var bubble = assistantBubble(doc);
  var responseContent = bubble.querySelector(".response-content");
  var links = responseContent.querySelectorAll(".file-link");
  assert.strictEqual(links.length, 2, "should have two file links");

  var texts = [];
  for (var i = 0; i < links.length; i++) {
    texts.push(links[i].textContent);
  }
  assert.ok(
    texts.indexOf("/tmp/first.txt") !== -1,
    "first file should be linkified",
  );
  assert.ok(
    texts.indexOf("/tmp/second.txt") !== -1,
    "second file should be linkified",
  );
});
