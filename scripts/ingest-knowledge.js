const fs = require("fs");
const path = require("path");

const KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge");
const CATEGORIES = fs.readdirSync(KNOWLEDGE_DIR).filter((d) => {
  const p = path.join(KNOWLEDGE_DIR, d);
  return fs.statSync(p).isDirectory() && !d.startsWith(".");
});

async function main() {
  console.log("=== Knowledge Ingestion ===\n");
  console.log("Knowledge directory:", KNOWLEDGE_DIR);
  console.log("Categories found:", CATEGORIES.join(", "), "\n");

  const { addKnowledge, listKnowledge } = require("../src/main/rag");

  let totalFiles = 0;
  let totalChunks = 0;

  for (const category of CATEGORIES) {
    const catDir = path.join(KNOWLEDGE_DIR, category);
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".md"));
    console.log(`[${category}] ${files.length} files`);

    for (const file of files) {
      const filePath = path.join(catDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const topic = path.basename(file, ".md");

      const result = await addKnowledge(content, {
        source: "knowledge-base",
        category,
        topic,
        file: `knowledge/${category}/${file}`,
      });

      const parsed = JSON.parse(result);
      totalFiles++;
      totalChunks += parsed.chunks || 0;
      console.log(`  ${file} → ${parsed.chunks} chunks (total: ${parsed.total})`);
    }
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
