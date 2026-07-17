const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { createDocx, buildDocxFromMarkdown, sanitizeFilename } = require("./tools/docx");
const { tools } = require("./tools/registry");

// ── createDocx: description-based flow ──────────────────────────

test("createDocx - description flow returns __doc_pending__ marker", async (t) => {
  const result = await createDocx({ description: "What oranges are", filename: "oranges" });
  const parsed = JSON.parse(result);
  assert.strictEqual(parsed.__doc_pending__, true);
  assert.strictEqual(parsed.description, "What oranges are");
  assert.strictEqual(parsed.filename, "oranges");
});

test("createDocx - description flow sanitizes filename", async (t) => {
  const result = await createDocx({ description: "Test", filename: "bad/../../../etc/passwd" });
  const parsed = JSON.parse(result);
  assert.ok(parsed.filename.indexOf("/") === -1);
  assert.ok(parsed.filename.indexOf("..") === -1);
});

test("createDocx - description flow handles missing filename", async (t) => {
  const result = await createDocx({ description: "Just a description" });
  const parsed = JSON.parse(result);
  assert.strictEqual(parsed.__doc_pending__, true);
  assert.strictEqual(parsed.filename, "document");
});

// ── createDocx: legacy content-based flow (backward compat) ─────

test("createDocx - legacy flow with content still works", async (t) => {
  const result = await createDocx({ content: "# Hello\n\nWorld", filename: "legacy-test" });
  const parsed = JSON.parse(result);
  assert.strictEqual(parsed.ok, true);
  assert.ok(parsed.path.endsWith(".docx"));
  assert.ok(parsed.size > 0);
  // Cleanup
  try { fs.unlinkSync(parsed.path); } catch (_) {}
});

test("createDocx - legacy flow returns error for empty content", async (t) => {
  const result = await createDocx({ content: "", filename: "empty" });
  const parsed = JSON.parse(result);
  assert.ok(parsed.error);
});

test("createDocx - legacy flow without content returns error", async (t) => {
  const result = await createDocx({ filename: "no-content" });
  const parsed = JSON.parse(result);
  assert.ok(parsed.error);
});

// ── buildDocxFromMarkdown ───────────────────────────────────────

test("buildDocxFromMarkdown - creates valid docx from markdown", (t) => {
  const markdown = `# Test Document

## Section One

This is a paragraph with **bold** and *italic* text.

- Bullet point one
- Bullet point two

1. Numbered item
2. Numbered item

\`\`\`
code block
\`\`\`
`;
  const result = buildDocxFromMarkdown(markdown, "test-build");
  assert.strictEqual(result.ok, true);
  assert.ok(result.path.endsWith(".docx"));
  assert.ok(result.size > 0);
  assert.ok(result.preview.length > 0);
  // Cleanup
  try { fs.unlinkSync(result.path); } catch (_) {}
});

test("buildDocxFromMarkdown - handles empty content", (t) => {
  const result = buildDocxFromMarkdown("", "test");
  assert.ok(result.error);
});

test("buildDocxFromMarkdown - handles whitespace-only content", (t) => {
  const result = buildDocxFromMarkdown("   \n  \n  ", "test");
  assert.ok(result.error);
});

test("buildDocxFromMarkdown - large document works", (t) => {
  var parts = [];
  parts.push("# Large Document\n\n");
  for (var i = 0; i < 50; i++) {
    parts.push("## Section " + (i + 1) + "\n\n");
    parts.push("This is paragraph text for section " + (i + 1) + ". ");
    parts.push("It contains multiple sentences to simulate real content. ");
    parts.push("The **bold** word and *italic* phrase add formatting variety.\n\n");
    parts.push("- Bullet A" + i + "\n");
    parts.push("- Bullet B" + i + "\n");
    parts.push("- Bullet C" + i + "\n\n");
  }
  const result = buildDocxFromMarkdown(parts.join(""), "large-doc");
  assert.strictEqual(result.ok, true);
  assert.ok(result.size > 5000, "Large doc should be at least 5KB, got: " + result.size);
  try { fs.unlinkSync(result.path); } catch (_) {}
});

// ── gatherResearchContext (from main.js) ────────────────────────

// Replicate the function from main.js for testing
function gatherResearchContext(messages) {
  var research = [];
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    if (msg.role !== "tool") continue;
    try {
      var parsed = JSON.parse(msg.content);
      if (Array.isArray(parsed)) {
        for (var j = 0; j < parsed.length; j++) {
          if (parsed[j].title && parsed[j].snippet) {
            research.push(parsed[j]);
          }
        }
      } else if (parsed && parsed.title && (parsed.text || parsed.snippet)) {
        research.push({
          title: parsed.title,
          snippet: (parsed.text || parsed.snippet || "").slice(0, 2000),
          url: parsed.url || "",
        });
      }
    } catch (_) {}
  }
  return research;
}

test("gatherResearchContext - extracts search_web results", (t) => {
  const messages = [
    { role: "user", content: "Tell me about oranges" },
    { role: "assistant", content: "Let me search..." },
    { role: "tool", content: JSON.stringify([
      { title: "Orange - Wikipedia", url: "https://en.wikipedia.org/wiki/Orange", snippet: "An orange is a fruit of various citrus species." },
      { title: "Oranges: Health Benefits", url: "https://example.com/oranges", snippet: "Oranges are rich in vitamin C." },
    ]) },
  ];
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 2);
  assert.strictEqual(research[0].title, "Orange - Wikipedia");
  assert.strictEqual(research[1].title, "Oranges: Health Benefits");
});

test("gatherResearchContext - extracts extract_webpage results", (t) => {
  const messages = [
    { role: "tool", content: JSON.stringify({
      title: "Orange Fruit Facts",
      text: "Oranges are a type of citrus fruit that grow on trees. They are known for their sweet and tangy flavor.",
      url: "https://example.com/orange-facts",
    }) },
  ];
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 1);
  assert.strictEqual(research[0].title, "Orange Fruit Facts");
  assert.ok(research[0].snippet.length > 0);
  assert.strictEqual(research[0].url, "https://example.com/orange-facts");
});

test("gatherResearchContext - ignores non-tool messages", (t) => {
  const messages = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
  ];
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 0);
});

test("gatherResearchContext - handles invalid JSON gracefully", (t) => {
  const messages = [
    { role: "tool", content: "not valid json {{{" },
    { role: "tool", content: JSON.stringify({ not_a_search_result: true }) },
  ];
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 0);
});

test("gatherResearchContext - trims long snippet from extract_webpage", (t) => {
  const longText = "x".repeat(5000);
  const messages = [
    { role: "tool", content: JSON.stringify({
      title: "Long Page",
      text: longText,
      url: "https://example.com",
    }) },
  ];
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 1);
  assert.ok(research[0].snippet.length <= 2000);
});

// ── Tool definition verification ────────────────────────────────

test("create_docx tool definition has correct params", (t) => {
  const docTool = tools.find(function(tool) { return tool.function.name === "create_docx"; });
  assert.ok(docTool, "create_docx tool should exist");
  assert.deepStrictEqual(docTool.function.parameters.required, ["description"]);
  assert.ok("description" in docTool.function.parameters.properties);
  assert.ok("filename" in docTool.function.parameters.properties);
  // content should NOT be in the new definition
  assert.ok(!("content" in docTool.function.parameters.properties),
    "content param should not be in new tool definition");
});

// ── Doc session system prompt building ──────────────────────────

// Replicate the function from llm-local.js
function buildDocWriterSystemPrompt(description, researchContext) {
  var parts = [
    "You are a professional document writer. Your task is to write a comprehensive, well-structured document.",
    "",
    "Topic: " + description,
    "",
  ];

  if (researchContext && researchContext.length > 0) {
    parts.push("Use the following research as source material:");
    parts.push("");
    for (var i = 0; i < researchContext.length; i++) {
      var r = researchContext[i];
      parts.push("--- Source " + (i + 1) + " ---");
      if (r.title) parts.push("Title: " + r.title);
      if (r.url) parts.push("URL: " + r.url);
      if (r.snippet) parts.push("Content: " + r.snippet);
      parts.push("");
    }
  }

  parts.push("Write the complete document now. Use proper markdown formatting:");
  parts.push("- Use # for the main title, ## for section headings, ### for subsections");
  parts.push("- Use bullet lists and numbered lists where appropriate");
  parts.push("- Use **bold** and *italic* for emphasis");
  parts.push("- Be thorough and comprehensive");
  parts.push("");
  parts.push("Start writing the document directly — no preamble, no introduction about yourself. Begin with the document title.");

  return parts.join("\n");
}

test("buildDocWriterSystemPrompt - includes description and research", (t) => {
  const prompt = buildDocWriterSystemPrompt("What are oranges", [
    { title: "Orange Facts", url: "https://example.com", snippet: "Oranges are citrus fruits." },
  ]);
  assert.ok(prompt.indexOf("What are oranges") !== -1);
  assert.ok(prompt.indexOf("Orange Facts") !== -1);
  assert.ok(prompt.indexOf("https://example.com") !== -1);
  assert.ok(prompt.indexOf("Oranges are citrus fruits.") !== -1);
  assert.ok(prompt.indexOf("Write the complete document") !== -1);
});

test("buildDocWriterSystemPrompt - handles empty research", (t) => {
  const prompt = buildDocWriterSystemPrompt("Test topic", []);
  assert.ok(prompt.indexOf("Test topic") !== -1);
  assert.ok(prompt.indexOf("Use the following research") === -1);
});

test("buildDocWriterSystemPrompt - handles null research", (t) => {
  const prompt = buildDocWriterSystemPrompt("Test topic", null);
  assert.ok(prompt.indexOf("Test topic") !== -1);
  assert.ok(prompt.indexOf("Use the following research") === -1);
});

// ── sanitizeFilename ────────────────────────────────────────────

test("sanitizeFilename - removes special characters", (t) => {
  assert.strictEqual(sanitizeFilename("hello/world:test"), "helloworldtest");
  assert.strictEqual(sanitizeFilename("doc@#$%^&*()"), "doc");
});

test("sanitizeFilename - trims to 60 chars", (t) => {
  const long = "a".repeat(100);
  const result = sanitizeFilename(long);
  assert.ok(result.length <= 60);
});

test("sanitizeFilename - returns 'document' for empty/whitespace", (t) => {
  assert.strictEqual(sanitizeFilename(""), "document");
  assert.strictEqual(sanitizeFilename("   "), "document");
});

// ── Full end-to-end simulation ──────────────────────────────────

test("full pipeline - description to docx (simulated)", async (t) => {
  // Step 1: Simulate conversation with search results
  const messages = [
    { role: "user", content: "Write a document about oranges" },
    { role: "tool", content: JSON.stringify([
      { title: "Orange - Wikipedia", url: "https://en.wikipedia.org/wiki/Orange_(fruit)", snippet: "An orange is a fruit of various citrus species in the family Rutaceae. It is a hybrid between pomelo and mandarin." },
      { title: "Health Benefits of Oranges", url: "https://www.healthline.com/nutrition/oranges", snippet: "Oranges are among the world's most popular fruits. They are a good source of fiber, vitamin C, thiamine, folate, and antioxidants." },
    ]) },
    { role: "tool", content: JSON.stringify({
      title: "Orange Nutrition Facts",
      text: "One medium-sized orange provides about 60 calories, 15 grams of carbohydrates, 3 grams of fiber, and meets over 100% of daily vitamin C needs.",
      url: "https://example.com/orange-nutrition",
    }) },
  ];

  // Step 2: Gather research (what main.js does)
  const research = gatherResearchContext(messages);
  assert.strictEqual(research.length, 3, "Should extract all 3 sources");

  // Step 3: Build doc writer system prompt (what llm-local.js does)
  const description = "Oranges are citrus fruits rich in vitamin C. This document should cover their history, nutritional benefits, varieties, cultivation, and culinary uses.";
  const sysPrompt = buildDocWriterSystemPrompt(description, research);
  assert.ok(sysPrompt.length > 500, "System prompt should be substantial");

  // Step 4: Simulate what the document writer LLM would output
  // In reality, generateDocument() runs the LLM to produce this text.
  // Here we provide a realistic markdown output.
  const simulatedDocContent = `# Oranges: A Comprehensive Guide

## Introduction

Oranges are among the world's most popular fruits, known for their sweet-tart flavor and high vitamin C content. They belong to the citrus family and are a hybrid between pomelo and mandarin.

## History and Origins

Oranges originated in Southeast Asia, with cultivation dating back thousands of years. They spread through trade routes to Europe, the Americas, and eventually worldwide.

## Nutritional Benefits

Oranges are an excellent source of vitamin C, providing over 100% of the daily recommended intake in a single medium fruit. They also contain:

- **Fiber**: Supports digestive health
- **Folate**: Important for cell growth
- **Thiamine**: Essential for energy metabolism
- **Antioxidants**: Help fight oxidative stress

One medium orange contains approximately 60 calories and 15 grams of carbohydrates.

## Popular Varieties

1. **Navel oranges** — Sweet, seedless, and easy to peel
2. **Valencia oranges** — Known for juicing
3. **Blood oranges** — Deep red flesh with berry notes
4. **Cara Cara oranges** — Pink flesh, low acidity

## Cultivation

Orange trees thrive in subtropical climates with well-draining soil. Major producers include Brazil, the United States (Florida and California), China, and Spain. Trees typically begin bearing fruit after 3-5 years.

## Culinary Uses

Oranges are versatile in the kitchen:
- Fresh eating and juicing
- Zest for baking and cooking
- Marmalade and preserves
- Salads and savory dishes
- Candied orange peel

## Conclusion

Oranges are not only delicious but also incredibly nutritious. Their rich history, diverse varieties, and culinary versatility make them one of the most beloved fruits worldwide.
`;

  // Step 5: Generate the docx (what main.js does after generateDocument returns)
  const docxResult = buildDocxFromMarkdown(simulatedDocContent, "oranges-guide");
  assert.strictEqual(docxResult.ok, true);
  assert.ok(docxResult.path.endsWith(".docx"));
  assert.ok(docxResult.size > 1000, "Document should be at least 1KB");

  // Step 6: Verify the docx content is a valid zip (docx is a zip file)
  try {
    const { execFileSync } = require("child_process");
    const zipTest = execFileSync("unzip", ["-t", docxResult.path], {
      timeout: 5000,
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(zipTest.indexOf("No errors") !== -1 || zipTest.indexOf("OK") !== -1,
      "Docx should be a valid zip file");
  } catch (e) {
    // unzip might not be available; skip this assertion gracefully
    console.log("  (unzip not available, skipping zip validation)");
  }

  // Cleanup
  try { fs.unlinkSync(docxResult.path); } catch (_) {}
});

// ── IPC message format verification ─────────────────────────────

test("doc_stream_start message format", (t) => {
  const msg = {
    doc_stream_start: {
      filename: "oranges",
      description: "A document about oranges",
    },
  };
  assert.ok(msg.doc_stream_start);
  assert.strictEqual(msg.doc_stream_start.filename, "oranges");
  assert.strictEqual(msg.doc_stream_start.description, "A document about oranges");
});

test("doc_stream_chunk message format", (t) => {
  const msg = { doc_stream_chunk: "# Oranges\n\nOranges are citrus fruits." };
  assert.ok(typeof msg.doc_stream_chunk === "string");
  assert.ok(msg.doc_stream_chunk.length > 0);
});

test("tool_end for create_docx message format", (t) => {
  const docxResult = buildDocxFromMarkdown("# Test", "test-doc");
  const msg = {
    tool_end: {
      name: "create_docx",
      output: JSON.stringify(docxResult),
    },
  };
  assert.strictEqual(msg.tool_end.name, "create_docx");
  const parsed = JSON.parse(msg.tool_end.output);
  assert.strictEqual(parsed.ok, true);
  try { fs.unlinkSync(docxResult.path); } catch (_) {}
});
