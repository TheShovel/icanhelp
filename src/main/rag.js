const fs = require("fs");
const path = require("path");
const os = require("os");

const STORE_PATH = path.join(os.homedir(), ".cache", "icanhelp", "knowledge.json");

let pipeline = null;
let store = null;

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
      if (current) { chunks.push(current.trim()); current = ""; }
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
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function getEmbeddings(texts) {
  const { pipeline: transformersPipeline } = await import("@xenova/transformers");
  if (!pipeline) {
    pipeline = await transformersPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const results = [];
  for (const text of texts) {
    const output = await pipeline(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }
  return results;
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

  if (s.entries.length > 10000) {
    s.entries = s.entries.slice(-10000);
  }

  saveStore();
  return JSON.stringify({ ok: true, chunks: chunks.length, total: s.entries.length });
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
  searchKnowledge,
  listKnowledge,
  clearKnowledge,
};
