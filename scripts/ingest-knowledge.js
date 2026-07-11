const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge");
const CATEGORIES = fs.readdirSync(KNOWLEDGE_DIR).filter((d) => {
  const p = path.join(KNOWLEDGE_DIR, d);
  return fs.statSync(p).isDirectory() && !d.startsWith(".");
});

const { addKnowledgeBatch, listKnowledge } = require("../src/main/rag");

const BATCH_SIZE = 200;

async function main() {
  console.log("=== Knowledge Ingestion ===\n");
  console.log("Knowledge directory:", KNOWLEDGE_DIR);
  console.log("Categories found:", CATEGORIES.join(", "), "\n");

  const items = [];
  let totalFiles = 0;

  for (const category of CATEGORIES) {
    const catDir = path.join(KNOWLEDGE_DIR, category);
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".md"));
    console.log(`[${category}] ${files.length} files`);

    for (const file of files) {
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

  let totalChunks = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const slice = items.slice(i, i + BATCH_SIZE);
    const result = await addKnowledgeBatch(slice);
    const parsed = JSON.parse(result);
    if (parsed.error) {
      console.error("Embedding failed:", parsed.error);
      process.exit(1);
    }
    totalChunks += parsed.chunks;
    console.log(
      `  batch ${Math.floor(i / BATCH_SIZE) + 1}: +${parsed.chunks} chunks (total: ${parsed.total})`,
    );
  }

  console.log(`\n=== Done ===`);
  console.log(`Files ingested: ${totalFiles}`);
  console.log(`Total chunks: ${totalChunks}`);

  const stats = await listKnowledge();
  console.log("Knowledge base stats:", stats);
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
