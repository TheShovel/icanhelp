const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile, execSync } = require("child_process");

const { modelsDir } = require("./paths");

const MODELS_DIR = modelsDir();

function detectGpu() {
  var info = "Unknown";
  var vramBytes = 0;

  try {
    var nvidiaOut = execSync(
      "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader",
      { timeout: 5000, encoding: "utf-8" },
    ).trim();
    if (nvidiaOut) {
      info = "NVIDIA: " + nvidiaOut;
      var m = nvidiaOut.match(/([\d.]+)\s*MiB/i);
      if (m) vramBytes = parseFloat(m[1]) * 1024 * 1024;
    }
  } catch (_) {}

  if (info === "Unknown") {
    try {
      var drmDir = "/sys/class/drm";
      if (fs.existsSync(drmDir)) {
        var cards = fs
          .readdirSync(drmDir)
          .filter(function (f) {
            return /^card\d+$/.test(f);
          })
          .sort();
        var names = [];
        for (var i = 0; i < cards.length; i++) {
          var devDir = path.join(drmDir, cards[i], "device");
          var vendorFile = path.join(devDir, "vendor");
          var ueventFile = path.join(devDir, "uevent");
          var label = "GPU";
          try {
            var ven = fs.readFileSync(vendorFile, "utf-8").trim();
            if (ven === "0x1002" || ven === "0x1022") label = "AMD GPU";
            else if (ven === "0x8086" || ven === "0x8087") label = "Intel GPU";
            else if (ven === "0x10de") label = "NVIDIA GPU";
          } catch (_) {}
          try {
            var uev = fs.readFileSync(ueventFile, "utf-8");
            var drmMatch = uev.match(/DRIVER=(\w+)/);
            if (drmMatch && drmMatch[1] !== "")
              label += " (" + drmMatch[1] + ")";
          } catch (_) {}
          names.push(label);

          var totalFile = path.join(devDir, "mem_info_vram_total");
          if (fs.existsSync(totalFile)) {
            try {
              var bytes = parseInt(fs.readFileSync(totalFile, "utf-8").trim(), 10);
              if (bytes > vramBytes) vramBytes = bytes;
            } catch (_) {}
          }
        }
        if (names.length > 0) info = names.join(", ");
      }
    } catch (_) {}
  }

  return { info: info, vramBytes: vramBytes };
}

function getSystemInfo() {
  var totalRam = os.totalmem();
  var freeRam = os.freemem();
  var totalRamGB = (totalRam / (1024 * 1024 * 1024)).toFixed(1);
  var freeRamGB = (freeRam / (1024 * 1024 * 1024)).toFixed(1);
  var cpuCores = os.cpus().length;
  var cpuModel = os.cpus()[0] ? os.cpus()[0].model : "Unknown";

  var gpuInfo = "Unknown";
  var gpuVramBytes = 0;
  try {
    var gpu = detectGpu();
    gpuInfo = gpu.info;
    gpuVramBytes = gpu.vramBytes;
  } catch (_) {}

  var usableRamGB = parseFloat(freeRamGB);
  var gpuVramGB = gpuVramBytes / (1024 * 1024 * 1024);

  return {
    totalRamGB: parseFloat(totalRamGB),
    freeRamGB: usableRamGB,
    cpuCores: cpuCores,
    cpuModel: cpuModel,
    gpuInfo: gpuInfo,
    gpuVramGB: gpuVramGB,
  };
}

const RECOMMENDED_MODELS = [
  {
    id: "qwen3.5-0.8b",
    name: "Qwen 3.5 0.8B",
    size: "~0.5 GB",
    sizeBytes: 579615840,
    quality: "Fast",
    description:
      "Smallest Qwen 3.5. Fast on any hardware, even 2 GB RAM machines.",
    url: "https://huggingface.co/bartowski/Qwen_Qwen3.5-0.8B-GGUF/resolve/main/Qwen_Qwen3.5-0.8B-Q4_K_M.gguf",
    filename: "Qwen_Qwen3.5-0.8B-Q4_K_M.gguf",
    minRamGB: 3,
  },
  {
    id: "qwen3.5-2b",
    name: "Qwen 3.5 2B",
    size: "~1.3 GB",
    sizeBytes: 1396198496,
    quality: "Good",
    recommended: true,
    description: "Balanced speed and quality. Great tool use and reasoning.",
    url: "https://huggingface.co/bartowski/Qwen_Qwen3.5-2B-GGUF/resolve/main/Qwen_Qwen3.5-2B-Q4_K_M.gguf",
    filename: "Qwen_Qwen3.5-2B-Q4_K_M.gguf",
    minRamGB: 6,
  },
  {
    id: "qwen3.5-4b",
    name: "Qwen 3.5 4B",
    size: "~2.8 GB",
    sizeBytes: 2873000000,
    quality: "Better",
    description: "Better reasoning and instruction following. Needs more RAM.",
    url: "https://huggingface.co/bartowski/Qwen_Qwen3.5-4B-GGUF/resolve/main/Qwen_Qwen3.5-4B-Q4_K_M.gguf",
    filename: "Qwen_Qwen3.5-4B-Q4_K_M.gguf",
    minRamGB: 8,
  },
  {
    id: "lfm2-350m-extract",
    name: "LFM2 350M Extract",
    size: "~220 MB",
    sizeBytes: 230000000,
    quality: "Utility",
    role: "extract",
    description: "Webpage text extraction model. Used by the extract_webpage tool for cleaning HTML content.",
    url: "https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF/resolve/main/LFM2-350M-Extract-Q4_K_M.gguf",
    filename: "LFM2-350M-Extract-Q4_K_M.gguf",
    minRamGB: 4,
  },
  {
    id: "lfm2-1.2b-extract",
    name: "LFM2 1.2B Extract",
    size: "~680 MB",
    sizeBytes: 713000000,
    quality: "Better",
    role: "extract",
    description: "Larger extraction model for complex webpages.",
    url: "https://huggingface.co/LiquidAI/LFM2-1.2B-Extract-GGUF/resolve/main/LFM2-1.2B-Extract-Q4_K_M.gguf",
    filename: "LFM2-1.2B-Extract-Q4_K_M.gguf",
    minRamGB: 5,
  },
  {
    id: "lfm2-350m-math",
    name: "LFM2 350M Math",
    size: "~210 MB",
    sizeBytes: 220000000,
    quality: "Utility",
    role: "math",
    description: "Math computation model for evaluating expressions.",
    url: "https://huggingface.co/LiquidAI/LFM2-350M-Math-GGUF/resolve/main/LFM2-350M-Math-Q4_K_M.gguf",
    filename: "LFM2-350M-Math-Q4_K_M.gguf",
    minRamGB: 4,
  },

];

function getCompatibleModels() {
  var info = getSystemInfo();
  var usableRam = info.freeRamGB;

  return RECOMMENDED_MODELS.filter(function (m) {
    return !m.role && m.minRamGB <= usableRam + 2;
  }).map(function (m) {
    return {
      id: m.id,
      name: m.name,
      size: m.size,
      description: m.description,
      filename: m.filename,
      compatible: m.minRamGB <= usableRam + 2,
      ramOk: m.minRamGB <= usableRam + 2,
    };
  });
}

function getExtraModels() {
  var info = getSystemInfo();
  var usableRam = info.freeRamGB;

  return RECOMMENDED_MODELS.filter(function (m) {
    return m.role === "extract" || m.role === "math";
  }).map(function (m) {
    return {
      id: m.id,
      name: m.name,
      size: m.size,
      description: m.description,
      filename: m.filename,
      quality: m.quality,
      minRamGB: m.minRamGB,
      compatible: m.minRamGB <= usableRam + 2,
      ramOk: m.minRamGB <= usableRam + 2,
      role: m.role,
    };
  });
}

function getAllModels() {
  return RECOMMENDED_MODELS;
}

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
  getSystemInfo,
  getCompatibleModels,
  getExtraModels,
  MODELS_DIR,
};