const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const MODELS_DIR = path.join(os.homedir(), ".cache", "icanhelp", "models");

const RECOMMENDED_MODELS = [
  {
    id: "qwen2.5-3b",
    name: "Qwen 2.5 3B Instruct",
    size: "~2.0 GB",
    description: "Excellent balance of capability and speed. Good tool use.",
    url: "https://huggingface.co/bartowski/Qwen2.5-3B-Instruct-GGUF/resolve/main/Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    filename: "Qwen2.5-3B-Instruct-Q4_K_M.gguf",
  },
  {
    id: "llama3.2-3b",
    name: "Llama 3.2 3B Instruct",
    size: "~2.0 GB",
    description: "Meta's latest small model with strong instruction following.",
    url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    filename: "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
  },
  {
    id: "phi-3-mini",
    name: "Phi-3 Mini 4K Instruct",
    size: "~2.2 GB",
    description: "Microsoft's compact model with strong reasoning.",
    url: "https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf",
    filename: "Phi-3-mini-4k-instruct-Q4_K_M.gguf",
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B Instruct v0.3",
    size: "~4.4 GB",
    description: "Larger model with strong general knowledge. Needs 6+ GB RAM.",
    url: "https://huggingface.co/bartowski/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3-Q4_K_M.gguf",
    filename: "Mistral-7B-Instruct-v0.3-Q4_K_M.gguf",
  },
];

function ensureModelsDir() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }
}

function listDownloadedModels() {
  ensureModelsDir();
  try {
    return fs
      .readdirSync(MODELS_DIR)
      .filter((f) => f.endsWith(".gguf"))
      .map((f) => {
        const fullPath = path.join(MODELS_DIR, f);
        const stat = fs.statSync(fullPath);
        return {
          filename: f,
          path: fullPath,
          sizeBytes: stat.size,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(0),
        };
      });
  } catch {
    return [];
  }
}

function deleteModel(filename) {
  const fullPath = path.join(MODELS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return { error: `Model ${filename} not found` };
  }
  if (!filename.endsWith(".gguf")) {
    return { error: "Only .gguf files can be deleted" };
  }
  fs.unlinkSync(fullPath);
  return { ok: true };
}

async function downloadModel(modelId, onProgress) {
  const model = RECOMMENDED_MODELS.find((m) => m.id === modelId);
  if (!model) return { error: `Unknown model: ${modelId}` };

  ensureModelsDir();
  const destPath = path.join(MODELS_DIR, model.filename);

  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 1000000) {
      if (onProgress) onProgress({ stage: "done", path: destPath });
      return { ok: true, path: destPath, alreadyExists: true };
    }
  }

  if (onProgress) onProgress({ stage: "downloading", progress: 0 });

  try {
    const response = await fetch(model.url, {
      signal: AbortSignal.timeout(600000),
    });

    if (!response.ok) {
      return { error: `Download failed: HTTP ${response.status}` };
    }

    const contentLength = parseInt(
      response.headers.get("content-length") || "0",
      10,
    );
    const reader = response.body.getReader();
    const writeStream = fs.createWriteStream(destPath);
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writeStream.write(value);
      received += value.length;
      if (onProgress && contentLength > 0) {
        onProgress({
          stage: "downloading",
          progress: Math.round((received / contentLength) * 100),
          received,
          total: contentLength,
        });
      }
    }

    writeStream.end();
    await new Promise(function (resolve, reject) {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    if (onProgress) onProgress({ stage: "done", path: destPath });
    return { ok: true, path: destPath };
  } catch (e) {
    try {
      fs.unlinkSync(destPath);
    } catch (_) {}
    return { error: `Download failed: ${e.message}` };
  }
}

module.exports = {
  RECOMMENDED_MODELS,
  listDownloadedModels,
  deleteModel,
  downloadModel,
  MODELS_DIR,
};
