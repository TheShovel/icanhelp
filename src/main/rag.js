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
    return JSON.stringify({ results: [], total: 0 });
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
  const top = results.slice(0, k || 5).map((r) => ({
    text: r.text,
    similarity: r.similarity.toFixed(3),
    metadata: r.metadata,
  }));

  return JSON.stringify({ results: top, total: s.entries.length });
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
};
