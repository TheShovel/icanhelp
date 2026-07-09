const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const MODELS_DIR = path.join(os.homedir(), ".cache", "icanhelp", "models");

const RECOMMENDED_MODELS = [
  {
    id: "lfm2.5-8b",
    name: "LFM 2.5 8B MoE",
    size: "~5.2 GB",
    description:
      "8B Mixture of Experts, 1B active. Fast with strong reasoning and tool use.",
    url: "https://huggingface.co/LiquidAI/LFM2.5-8B-A1B-GGUF/resolve/main/LFM2.5-8B-A1B-Q4_K_M.gguf",
    filename: "LFM2.5-8B-A1B-Q4_K_M.gguf",
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
    fs.unlinkSync(destPath);
  }

  const partPath = destPath + ".part";
  if (fs.existsSync(partPath)) fs.unlinkSync(partPath);

  if (onProgress) onProgress({ stage: "downloading", progress: 0 });

  try {
    const headRes = await fetch(model.url, { method: "HEAD" });
    const totalSize = parseInt(
      headRes.headers.get("content-length") || "0",
      10,
    );
    if (!totalSize) {
      return { error: "Could not determine file size" };
    }

    const chunks = 4;
    const chunkSize = Math.ceil(totalSize / chunks);
    const fd = fs.openSync(partPath, "w");
    fs.ftruncateSync(fd, totalSize);
    fs.closeSync(fd);

    let totalReceived = 0;

    const downloads = [];
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      if (start >= totalSize) break;

      downloads.push(
        downloadChunk(model.url, partPath, start, end, i, function (received) {
          totalReceived += received;
          if (onProgress) {
            onProgress({
              stage: "downloading",
              progress: Math.round((totalReceived / totalSize) * 100),
              received: totalReceived,
              total: totalSize,
            });
          }
        }),
      );
    }

    await Promise.all(downloads);

    const stat = fs.statSync(partPath);
    if (stat.size !== totalSize) {
      try {
        fs.unlinkSync(partPath);
      } catch (_) {}
      return { error: "Download incomplete. File size mismatch." };
    }

    fs.renameSync(partPath, destPath);

    if (onProgress) onProgress({ stage: "done", path: destPath });
    return { ok: true, path: destPath };
  } catch (e) {
    try {
      fs.unlinkSync(partPath);
    } catch (_) {}
    return { error: `Download failed: ${e.message}` };
  }
}

async function downloadChunk(
  url,
  partPath,
  start,
  end,
  index,
  onChunkReceived,
) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
    signal: AbortSignal.timeout(600000),
  });

  if (!res.ok && res.status !== 206) {
    throw new Error(`Chunk ${index} failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const fd = fs.openSync(partPath, "r+");
  let offset = start;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fs.writeSync(fd, value, 0, value.length, offset);
    offset += value.length;
    onChunkReceived(value.length);
  }

  fs.closeSync(fd);
}

module.exports = {
  RECOMMENDED_MODELS,
  listDownloadedModels,
  deleteModel,
  downloadModel,
  MODELS_DIR,
};
