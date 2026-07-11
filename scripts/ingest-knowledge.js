const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge");
const CATEGORIES = fs.readdirSync(KNOWLEDGE_DIR).filter((d) => {
  const p = path.join(KNOWLEDGE_DIR, d);
  return fs.statSync(p).isDirectory() && !d.startsWith(".");
});

// Topics that are rarely useful for a desktop assistant and dominate the
// knowledge base (slowing ingest). Override with INGEST_IGNORE (comma-separated
// `category/file.md` or `category/` to skip a whole category).
const DEFAULT_IGNORE = [
  "science/mycology.md",
  "science/entomology.md",
  "science/seismology.md",
  "science/epidemiology.md",
  "science/virology.md",
  "science/biochemistry.md",
  "science/microbiology.md",
  "programming/rust-async.md",
  "programming/domain-driven-design.md",
  "programming/hexagonal-architecture.md",
  "programming/system-design-patterns.md",
  "programming/microservices.md",
  "programming/design-patterns.md",
  "programming/nodejs-performance.md",
  "programming/react-native.md",
  "programming/css-architecture.md",
  "programming/ui-conventions.md",
  "programming/ci-cd.md",
  "programming/python-web.md",
  "programming/python-testing.md",
  "programming/web-security.md",
  "programming/kubernetes.md",
  "programming/database-design.md",
  "programming/system-design.md",
  "programming/postgresql-advanced.md",
  "programming/react.md",
  "linux/audit.md",
  "linux/shell-mastery.md",
  "linux/tldr-cmds.md",
  "health/nutrition-deep.md",
];

function buildIgnoreSet() {
  // The installer always exports INGEST_IGNORE (empty string = embed all).
  // DEFAULT_IGNORE is only a fallback for a manual `npm run ingest` where the
  // env var is truly undefined. An explicit empty string must NOT re-enable it.
  const env = process.env.INGEST_IGNORE;
  const base = env === undefined ? DEFAULT_IGNORE : [];
  const set = new Set(base.map((p) => p.replace(/^\/+/, "")));
  if (env) {
    for (const raw of env.split(",")) {
      const p = raw.trim().replace(/^\/+/, "");
      if (p) set.add(p);
    }
  }
  return set;
}

function isIgnored(relPath, ignoreSet) {
  const norm = relPath.replace(/^\/+/, "");
  if (ignoreSet.has(norm)) return true;
  const slash = norm.indexOf("/");
  if (slash !== -1 && ignoreSet.has(norm.slice(0, slash + 1))) return true;
  return false;
}

const { addKnowledgeBatch, listKnowledge, chunkText } = require("../src/main/rag");

// Cap each model call by total token budget, not file count. A single large
// file can yield thousands of chunks; embedding too many sequences at once
// makes ONNX try to allocate tens of GB and crash. ~8k tokens stays well
// under memory limits while still batching for speed.
const MAX_BATCH_TOKENS = 8192;
const MAX_SEQ_LEN = 256;

async function main() {
  // Diagnostics are buffered and flushed to stderr only after the progress bar
  // finishes, so they don't interleave with and corrupt the single-line bar.
  const diag = [];
  const logErr = (...a) => diag.push(a.map(String).join(" "));
  const flushDiag = () => { if (diag.length) { console.error(diag.join("\n")); diag.length = 0; } };

  logErr("=== Knowledge Ingestion ===\n");
  logErr("Knowledge directory:", KNOWLEDGE_DIR);
  logErr("Categories found:", CATEGORIES.join(", "), "\n");

  const items = [];
  let totalFiles = 0;

  const ignoreSet = buildIgnoreSet();
  const skipped = [];

  for (const category of CATEGORIES) {
    const catDir = path.join(KNOWLEDGE_DIR, category);
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".md"));
    logErr(`[${category}] ${files.length} files`);

    for (const file of files) {
      const relPath = `${category}/${file}`;
      if (isIgnored(relPath, ignoreSet)) {
        skipped.push(relPath);
        continue;
      }
      const filePath = path.join(catDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const topic = path.basename(file, ".md");
      items.push({
        text: content,
        metadata: {
          source: "knowledge-base",
          category,
          topic,
          file: `knowledge/${category}/${file}`,
        },
      });
      totalFiles++;
    }
  }

  if (skipped.length) {
    logErr(`\nSkipped ${skipped.length} file(s) (set INGEST_IGNORE= or edit DEFAULT_IGNORE to change):`);
    for (const s of skipped) logErr(`  - ${s}`);
  }

  // Flatten into chunks, tracking which file each chunk came from and a token
  // estimate, then group chunks into batches bounded by MAX_BATCH_TOKENS so the
  // model never gets a huge batch that exhausts memory. One stdout line is
  // emitted per file (when its last chunk is embedded) so the installer's
  // progress bar (which counts stdout lines) lines up with the file count.
  const allChunks = [];
  items.forEach((item, fileIdx) => {
    for (const text of chunkText(item.text)) {
      const estTokens = Math.max(1, Math.ceil(text.length / 4));
      allChunks.push({ text, metadata: item.metadata, estTokens, fileIdx });
    }
  });

  let totalChunks = 0;
  let batch = [];
  let batchTokens = 0;
  let lastFileEmitted = -1;
  const flush = async () => {
    if (batch.length === 0) return;
    const result = await addKnowledgeBatch(batch);
    const parsed = JSON.parse(result);
    if (parsed.error) {
      logErr("Embedding failed:", parsed.error);
      process.exit(1);
    }
    totalChunks += parsed.chunks;
    // Emit one line for each file whose chunks were fully embedded in this batch.
    const filesInBatch = [...new Set(batch.map((b) => b.fileIdx))].sort((a, b) => a - b);
    for (const f of filesInBatch) {
      if (f > lastFileEmitted) {
        console.log(`embedded ${f + 1}/${items.length}`);
        lastFileEmitted = f;
      }
    }
    batch = [];
    batchTokens = 0;
  };

  for (const c of allChunks) {
    if (batch.length > 0 && batchTokens + c.estTokens > MAX_BATCH_TOKENS) {
      await flush();
    }
    batch.push({ text: c.text, metadata: c.metadata, fileIdx: c.fileIdx });
    batchTokens += c.estTokens;
  }
  await flush();

  logErr(`\n=== Done ===`);
  logErr(`Files ingested: ${totalFiles}`);
  logErr(`Total chunks: ${totalChunks}`);

  const stats = await listKnowledge();
  logErr("Knowledge base stats:", stats);
  flushDiag();
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
