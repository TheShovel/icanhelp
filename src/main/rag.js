const fs = require("fs");
const path = require("path");
const { knowledgeFile } = require("./paths");

const STORE_PATH = knowledgeFile();

let pipeline = null;
let store = null;

// Embedding model load + inference can be slow on first use (it downloads and
// initializes an ONNX model). Bound it so a tool call can never hang forever
// and leave the UI stuck on "Working".
const EMBEDDING_TIMEOUT_MS = 60 * 1000;

function withTimeout(promise, timeoutMs, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(new Error(message));
      }, timeoutMs);
    }),
  ]).finally(function () {
    clearTimeout(timer);
  });
}

function loadStore() {
  if (store) return store;
  try {
    if (fs.existsSync(STORE_PATH)) {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch (_) {}
  if (!store || !Array.isArray(store.entries)) {
    store = { entries: [] };
  }
  return store;
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function chunkText(text, maxLen) {
  const len = maxLen || 300;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > len) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      chunks.push(sentence.trim());
      continue;
    }
    if ((current + " " + sentence).length > len && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

function cosineSimilarity(a, b) {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function getEmbeddings(texts) {
  const { pipeline: transformersPipeline } =
    await import("@xenova/transformers");
  if (!pipeline) {
    pipeline = await withTimeout(
      transformersPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2"),
      EMBEDDING_TIMEOUT_MS,
      "Embedding model failed to load in time.",
    );
  }
  const isArray = Array.isArray(texts);
  const input = isArray ? texts : [texts];
  const output = await withTimeout(
    pipeline(input, { pooling: "mean", normalize: true }),
    EMBEDDING_TIMEOUT_MS,
    "Embedding timed out.",
  );

  const dims = output.dims;
  let vectors;
  if (dims.length === 1) {
    vectors = [Array.from(output.data)];
  } else {
    const dim = dims[dims.length - 1];
    const batch = dims[0];
    vectors = [];
    for (let i = 0; i < batch; i++) {
      vectors.push(Array.from(output.data.slice(i * dim, (i + 1) * dim)));
    }
  }
  return isArray ? vectors : vectors[0];
}

// Warm up the embedding pipeline at startup so the first search_knowledge call
// doesn't block on a slow model download/initialization.
async function preloadEmbeddings() {
  try {
    await getEmbeddings(["warmup"]);
    console.log("[rag] embedding pipeline preloaded");
  } catch (e) {
    console.error("[rag] embedding preload failed:", e.message);
  }
}

async function addKnowledge(text, metadata) {
  const s = loadStore();
  const chunks = chunkText(text);

  let embeddings;
  try {
    embeddings = await getEmbeddings(chunks);
  } catch (e) {
    return JSON.stringify({ error: "Embedding failed: " + e.message });
  }

  const timestamp = new Date().toISOString();
  for (let i = 0; i < chunks.length; i++) {
    s.entries.push({
      text: chunks[i],
      embedding: embeddings[i],
      metadata: metadata || {},
      timestamp,
      chunkIndex: i,
      totalChunks: chunks.length,
    });
  }

  saveStore();
  return JSON.stringify({
    ok: true,
    chunks: chunks.length,
    total: s.entries.length,
  });
}

function isSeeded(sourceTag) {
  const s = loadStore();
  return s.entries.some(function (e) {
    return e.metadata && e.metadata.source === sourceTag;
  });
}

async function seedCoreInstructions() {
  if (isSeeded("core-instructions")) return;
  console.log("[rag] Seeding core instructions into knowledge base...");

  var entries = [
    {
      text: "sys CLI reference: `sys pkg install/remove/search/check/upgrade` for packages. `sys svc start/stop/restart/status/enable/disable <name>` for services. `sys firewall allow/deny <port>/<proto>` for firewall. `sys net interfaces/status` for networking. `sys disk list/usage` for disks. `sys user add/del <name>` for users. `sys time status/sync` for time. `sys log errors/tail` for logs. `sys kern initramfs` for kernel. `sys swap status` for swap. `sys secure status` for security. `sys perf top` for CPU. Works on Arch, Ubuntu, Fedora, openSUSE. Prefer sys over raw distro commands. Use native commands (rsync, tar, find, openssl, ip, ss, journalctl) when sys doesn't cover the task.",
      metadata: { source: "core-instructions", topic: "sys-cli" },
    },
    {
      text: "File reading: use read_file() for small files under ~64 KB. For large files or partial reads, use read_file_lines(path, startLine, maxLines) which returns at most 500 lines per call and tells you the next startLine. read_file_lines only works on TEXT files (code, logs, CSV, markdown, JSON). Do NOT use it for images or binaries — use ocr_image for images instead. When a user attaches a large file, read it in chunks with read_file_lines rather than holding it all in context.",
      metadata: { source: "core-instructions", topic: "file-reading" },
    },
    {
      text: "Response style: Be extremely concise. Aim for one short sentence or one line for simple questions. Most answers under 60 words. Lead with the direct answer or result — no preamble, no 'Sure!', no 'Here is...', no restating the question. No unsolicited explanations, background, caveats, or 'if you need more help' closers. Prefer a single line or 1-3 short bullets over paragraphs. When running a command, report only the key result (the number/status), not the full raw output. Expand only when the user asks 'how', 'why', 'explain', or 'more detail'.",
      metadata: { source: "core-instructions", topic: "response-style" },
    },
    {
      text: "System state questions — EXECUTE, don't describe: When the user asks about the state of THEIR system (CPU, GPU, memory, disk, services, network, logs, packages, users, hardware, drivers, or available updates), you MUST run the command yourself with run_bash() and report the OUTPUT. NEVER reply with a list of commands, a web-search summary, or just a command snippet. 'Any updates?' means run `sys pkg check` and report the pending count — it's about their system, not the web. For GPU: the detected GPU is in the system info header — use the matching tool (nvidia-smi for NVIDIA, radeontop for AMD, intel_gpu_top for Intel). If a command fails, retry with a working variant rather than giving up. Only show a command (instead of running it) when the user explicitly asks 'how do I...' or 'show me the command'.",
      metadata: { source: "core-instructions", topic: "execute-dont-describe" },
    },
    {
      text: "Tool usage budget: Use as FEW tools as possible. One good call beats five. The system info header already has distro, CPU, GPU, RAM, and kernel — do NOT re-run probes (lscpu/lspci/free/uname) just to restate it. Only run a command when you need live state (CPU%, running services, disk usage, packages, users, or available updates) or to change something. Do NOT call list_knowledge (it only returns counts). HARD LIMIT: if you have already used 4 tools in this turn, STOP calling tools and answer with what you have. Never loop tools.",
      metadata: { source: "core-instructions", topic: "tool-budget" },
    },
  ];

  try {
    var result = await addKnowledgeBatch(entries);
    console.log("[rag] Core instructions seeded: " + result);
  } catch (e) {
    console.error("[rag] Failed to seed core instructions:", e.message);
  }
}

async function addKnowledgeBatch(items) {
  const s = loadStore();
  const allChunks = [];
  const chunkMeta = [];
  for (const item of items) {
    const chunks = chunkText(item.text);
    for (let i = 0; i < chunks.length; i++) {
      allChunks.push(chunks[i]);
      chunkMeta.push({
        metadata: item.metadata,
        chunkIndex: i,
        totalChunks: chunks.length,
      });
    }
  }

  let embeddings;
  try {
    embeddings = await getEmbeddings(allChunks);
  } catch (e) {
    return JSON.stringify({ error: "Embedding failed: " + e.message });
  }

  const timestamp = new Date().toISOString();
  for (let i = 0; i < allChunks.length; i++) {
    s.entries.push({
      text: allChunks[i],
      embedding: embeddings[i],
      metadata: chunkMeta[i].metadata || {},
      timestamp,
      chunkIndex: chunkMeta[i].chunkIndex,
      totalChunks: chunkMeta[i].totalChunks,
    });
  }

  saveStore();
  return JSON.stringify({
    ok: true,
    chunks: allChunks.length,
    total: s.entries.length,
  });
}

async function searchKnowledge(query, k) {
  const s = loadStore();
  if (s.entries.length === 0) {
    return JSON.stringify({ results: [], total: 0, hint: "Knowledge base is empty. Use search_web() to find information on the web instead." });
  }

  let queryEmbedding;
  try {
    const embs = await getEmbeddings([query]);
    queryEmbedding = embs[0];
  } catch (e) {
    return JSON.stringify({ error: "Embedding failed: " + e.message });
  }

  const results = s.entries.map((entry) => ({
    text: entry.text,
    metadata: entry.metadata,
    similarity: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  results.sort((a, b) => b.similarity - a.similarity);
  const MIN_SIMILARITY = 0.3;
  const top = results
    .filter(function (r) { return r.similarity >= MIN_SIMILARITY; })
    .slice(0, k || 5)
    .map((r) => ({
      text: r.text,
      similarity: r.similarity.toFixed(3),
      metadata: r.metadata,
    }));

  var out = { results: top, total: s.entries.length };
  if (top.length === 0) {
    out.hint = "No matching entries found. Use search_web() to find this information on the web.";
  }
  return JSON.stringify(out);
}

async function listKnowledge() {
  const s = loadStore();
  const topics = {};
  for (const entry of s.entries) {
    const source = (entry.metadata && entry.metadata.source) || "unknown";
    if (!topics[source]) topics[source] = 0;
    topics[source]++;
  }
  return JSON.stringify({
    totalEntries: s.entries.length,
    sources: topics,
  });
}

async function clearKnowledge() {
  store = { entries: [] };
  saveStore();
  return JSON.stringify({ ok: true });
}

module.exports = {
  addKnowledge,
  addKnowledgeBatch,
  searchKnowledge,
  listKnowledge,
  clearKnowledge,
  chunkText,
  preloadEmbeddings,
  seedCoreInstructions,
};
