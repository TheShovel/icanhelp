const ort = require("onnxruntime-node");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { modelsDir } = require("./paths");

const MODEL_ID = "ningpp/blip-image-captioning-base-ONNX";
const VISION_DIR = path.join(modelsDir(), "vision", "blip");
const HF_BASE = "https://huggingface.co/" + MODEL_ID + "/resolve/main";

const FILES = [
  "config.json",
  "tokenizer.json",
  "preprocessor_config.json",
  "blip_vision_encoder.onnx",
  "blip_text_decoder.onnx",
];

let visionSession = null;
let textSession = null;
let tokenizer = null;
const IMAGE_SIZE = 384;
const MAX_NEW_TOKENS = 50;
const MAX_REPETITION_RATIO = 0.4;
const MAX_RETRIES = 3;
const CHUNK_DOWNLOAD_TIMEOUT = 600000;

function send(msg) {
  if (process.send) process.send(msg);
}

// ── Robust parallel chunked download (same logic as model-manager) ──

async function downloadChunk(url, destPath, start, end, onChunk) {
  var res = await fetch(url, {
    headers: { Range: "bytes=" + start + "-" + end },
    signal: AbortSignal.timeout(CHUNK_DOWNLOAD_TIMEOUT),
  });

  if (!res.ok && res.status !== 206) {
    throw new Error("Chunk download failed: HTTP " + res.status);
  }

  var reader = res.body.getReader();
  var fd = fs.openSync(destPath, "r+");
  var offset = start;

  while (true) {
    var chunk = await reader.read();
    if (chunk.done) break;
    fs.writeSync(fd, chunk.value, 0, chunk.value.length, offset);
    offset += chunk.value.length;
    if (onChunk) onChunk(chunk.value.length);
  }

  fs.closeSync(fd);
}

async function downloadFile(filename, progressCb, retries) {
  retries = retries || 0;
  var dest = path.join(VISION_DIR, filename);
  if (fs.existsSync(dest)) {
    var stat = fs.statSync(dest);
    if (stat.size > 0) return dest;
    try { fs.unlinkSync(dest); } catch (_) {}
  }

  fs.mkdirSync(VISION_DIR, { recursive: true });

  // Clean up any stale .part file from a previous failed download.
  var partPath = dest + ".part";
  try { if (fs.existsSync(partPath)) fs.unlinkSync(partPath); } catch (_) {}

  var url = HF_BASE + "/" + filename;

  var headRes;
  try {
    headRes = await fetch(url, { method: "HEAD" });
  } catch (e) {
    if (retries < 3) {
      send({ type: "log", message: "HEAD failed for " + filename + ", retrying (" + (retries + 1) + "/3): " + (e.message || e) });
      await new Promise(function (r) { setTimeout(r, 2000); });
      return downloadFile(filename, progressCb, retries + 1);
    }
    throw new Error("Failed to reach HuggingFace after 3 retries: " + (e.message || e));
  }
  if (!headRes.ok) throw new Error("HEAD request failed: HTTP " + headRes.status + " for " + filename);
  var total = parseInt(headRes.headers.get("content-length") || "0", 10);
  var isOnnx = filename.endsWith(".onnx");

  // For small files or when Content-Length is missing, use simple streaming.
  // Only parallel-chunk large ONNX files where the speed matters.
  if (!isOnnx || total === 0) {
    if (total === 0) {
      send({ type: "log", message: "No content-length for " + filename + ", using streaming" });
    }
    var res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("Download failed: HTTP " + res.status + " for " + filename);
    var reader = res.body.getReader();
    var chunks = [];
    var loaded = 0;
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      chunks.push(Buffer.from(chunk.value));
      loaded += chunk.value.length;
      if (progressCb && total > 0) {
        progressCb({ file: filename, loaded: loaded, total: total });
      }
    }
    var data = Buffer.concat(chunks);
    fs.writeFileSync(dest, data);
    if (progressCb) progressCb({ file: filename, loaded: data.length, total: data.length });
    return dest;
  }

  var numChunks = 4;
  var chunkSize = Math.ceil(total / numChunks);
  var destPath = dest + ".part";

  // Pre-allocate the file
  var fd = fs.openSync(destPath, "w");
  fs.ftruncateSync(fd, total);
  fs.closeSync(fd);

  var downloads = [];
  var totalReceived = 0;

  for (var i = 0; i < numChunks; i++) {
    var start = i * chunkSize;
    var end = Math.min(start + chunkSize - 1, total - 1);
    if (start >= total) break;

    downloads.push(
      downloadChunk(url, destPath, start, end, function (received) {
        totalReceived += received;
        if (progressCb) {
          progressCb({
            file: filename,
            loaded: totalReceived,
            total: total,
          });
        }
      })
    );
  }

  await Promise.all(downloads);

  // Verify size
  var partStat = fs.statSync(destPath);
  if (partStat.size !== total) {
    try { fs.unlinkSync(destPath); } catch (_) {}
    throw new Error("Download incomplete: size mismatch for " + filename);
  }

  fs.renameSync(destPath, dest);
  return dest;
}

async function downloadAll() {
  // Migrate from old location if files exist there
  var oldDir = path.join(require("./paths").appPath("transformers", "ningpp--blip"));
  try {
    if (fs.existsSync(oldDir)) {
      var oldEnc = path.join(oldDir, "blip_vision_encoder.onnx");
      var oldDec = path.join(oldDir, "blip_text_decoder.onnx");
      if (fs.existsSync(oldEnc) && fs.existsSync(oldDec)) {
        var newEnc = path.join(VISION_DIR, "blip_vision_encoder.onnx");
        var newDec = path.join(VISION_DIR, "blip_text_decoder.onnx");
        if (!fs.existsSync(newEnc) || !fs.existsSync(newDec)) {
          fs.mkdirSync(VISION_DIR, { recursive: true });
          for (var fi = 0; fi < FILES.length; fi++) {
            var f = FILES[fi];
            var oldPath = path.join(oldDir, f);
            var newPath = path.join(VISION_DIR, f);
            if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
              fs.copyFileSync(oldPath, newPath);
              send({ type: "log", message: "Migrated " + f + " from old location" });
            }
          }
        }
      }
    }
  } catch (_) {}

  // Download small config files first (sequential), then large ONNX files in parallel
  for (var i = 0; i < FILES.length; i++) {
    var file = FILES[i];
    var isLarge = file.endsWith(".onnx");
    if (!isLarge) {
      await downloadFile(file, function (p) {
        send({ type: "progress", progress: p });
      });
    }
  }

  // Download ONNX files in parallel
  var onnxFiles = FILES.filter(function (f) { return f.endsWith(".onnx"); });
  var downloads = onnxFiles.map(function (file) {
    return downloadFile(file, function (p) {
      send({ type: "progress", progress: p });
    });
  });
  await Promise.all(downloads);
}

// ── Tokenizer ────────────────────────────────────────────────────

function loadTokenizer() {
  var raw = JSON.parse(
    fs.readFileSync(path.join(VISION_DIR, "tokenizer.json"), "utf8"),
  );
  var vocab = raw.model.vocab;
  var idToToken = {};
  var tokenToId = {};
  for (var token in vocab) {
    var id = vocab[token];
    idToToken[id] = token;
    tokenToId[token] = id;
  }
  return {
    idToToken: idToToken,
    tokenToId: tokenToId,
    clsId: 101,
    sepId: 102,
    padId: 0,
  };
}

// ── Image preprocessing ──────────────────────────────────────────

async function preprocessImage(imagePath) {
  var result = await sharp(imagePath)
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "cover", position: "center" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  var data = result.data;
  var mean = [0.48145466, 0.4578275, 0.40821073];
  var std = [0.26862954, 0.26130258, 0.27577711];
  var pixels = IMAGE_SIZE * IMAGE_SIZE;
  var floatData = new Float32Array(3 * pixels);

  for (var i = 0; i < pixels; i++) {
    var r = data[i * 3] / 255.0;
    var g = data[i * 3 + 1] / 255.0;
    var b = data[i * 3 + 2] / 255.0;
    floatData[i] = (r - mean[0]) / std[0];
    floatData[pixels + i] = (g - mean[1]) / std[1];
    floatData[2 * pixels + i] = (b - mean[2]) / std[2];
  }

  return new ort.Tensor("float32", floatData, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
}

// ── Model loading ────────────────────────────────────────────────

async function loadModels() {
  if (visionSession && textSession) return true;

  var visionPath = path.join(VISION_DIR, "blip_vision_encoder.onnx");
  var textPath = path.join(VISION_DIR, "blip_text_decoder.onnx");
  if (!fs.existsSync(visionPath) || !fs.existsSync(textPath)) return false;

  if (!visionSession) {
    visionSession = await ort.InferenceSession.create(visionPath, {
      executionProviders: ["cpu"],
    });
  }
  if (!textSession) {
    textSession = await ort.InferenceSession.create(textPath, {
      executionProviders: ["cpu"],
    });
  }
  if (!tokenizer) {
    tokenizer = loadTokenizer();
  }
  return true;
}

// ── Inference ────────────────────────────────────────────────────

function argmax(arr) {
  var best = -Infinity;
  var bestIdx = 0;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] > best) {
      best = arr[i];
      bestIdx = i;
    }
  }
  return bestIdx;
}

function isRepetitive(caption, generated) {
  if (!caption || generated.length === 0) return false;
  var words = caption.split(/\s+/);
  if (words.length < 3) return false;
  var uniqueWords = new Set(words);
  var ratio = uniqueWords.size / words.length;
  return ratio < MAX_REPETITION_RATIO;
}

async function describeImage(imagePath, retryCount) {
  retryCount = retryCount || 0;
  if (retryCount >= MAX_RETRIES) return null;

  if (!(await loadModels())) return null;

  var pixelValues = await preprocessImage(imagePath);

  var vOut = await visionSession.run({ pixel_values: pixelValues });
  var encHidden = vOut.encoder_hidden_states;

  var inputIds = [tokenizer.clsId];
  var generated = [];
  var usedTokens = new Set();

  for (var step = 0; step < MAX_NEW_TOKENS; step++) {
    var idsData = new BigInt64Array(inputIds.length);
    for (var j = 0; j < inputIds.length; j++) {
      idsData[j] = BigInt(inputIds[j]);
    }
    var idsTensor = new ort.Tensor("int64", idsData, [1, inputIds.length]);

    var output = await textSession.run({
      input_ids: idsTensor,
      encoder_hidden_states: encHidden,
    });
    var logits = output.logits;
    var vocabSize = logits.dims[2];
    var offset = (inputIds.length - 1) * vocabSize;
    var scores = logits.data.slice(offset, offset + vocabSize);

    // Repetition penalty
    var penalizedScores = new Float32Array(vocabSize);
    for (var i = 0; i < vocabSize; i++) {
      if (usedTokens.has(i)) {
        penalizedScores[i] = scores[i] / 2;
      } else {
        penalizedScores[i] = scores[i];
      }
    }

    var nextToken = argmax(penalizedScores);
    if (nextToken === tokenizer.sepId) break;
    generated.push(nextToken);
    usedTokens.add(nextToken);
    inputIds.push(nextToken);
  }

  var caption = "";
  for (var k = 0; k < generated.length; k++) {
    var token = tokenizer.idToToken[generated[k]] || "";
    if (token.slice(0, 2) === "##") {
      caption += token.slice(2);
    } else {
      caption += " " + token;
    }
  }
  caption = caption.trim();

  if (isRepetitive(caption, generated)) {
    return describeImage(imagePath, retryCount + 1);
  }

  return caption || null;
}

// ── IPC message handling ─────────────────────────────────────────

process.on("message", async function (message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "load") {
    try {
      await downloadAll();
      await loadModels();
      send({ type: "ready" });
    } catch (e) {
      send({ type: "load-error", error: e.message || String(e) });
    }
    return;
  }

  if (message.type === "describe") {
    try {
      var caption = await describeImage(message.imagePath);
      send({ type: "result", id: message.id, caption: caption });
    } catch (e) {
      send({
        type: "describe-error",
        id: message.id,
        error: e.message || String(e),
      });
    }
  }
});

process.on("disconnect", function () {
  process.exit(0);
});
