const ort = require("onnxruntime-node");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { visionModelDir } = require("./paths");

const MODEL_ID = "ningpp/blip-image-captioning-base-ONNX";
const CACHE_DIR = visionModelDir();
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

function send(msg) {
  if (process.send) process.send(msg);
}

async function downloadFile(filename, progressCb) {
  var dest = path.join(CACHE_DIR, filename);
  if (fs.existsSync(dest)) {
    var stat = fs.statSync(dest);
    if (stat.size > 1000) return dest;
    fs.unlinkSync(dest);
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  var url = HF_BASE + "/" + filename;
  send({ type: "log", message: "Downloading " + filename });

  var res = await fetch(url, { redirect: "follow" });
  if (!res.ok)
    throw new Error("Download failed: " + res.status + " " + filename);

  var total = parseInt(res.headers.get("content-length") || "0", 10);
  var reader = res.body.getReader();
  var loaded = 0;
  var fd = fs.openSync(dest, "w");

  while (true) {
    var result = await reader.read();
    if (result.done) break;
    fs.writeSync(fd, Buffer.from(result.value));
    loaded += result.value.length;
    if (progressCb && total > 0) {
      progressCb({ file: filename, loaded: loaded, total: total });
    }
  }

  fs.closeSync(fd);
  send({ type: "log", message: "Downloaded " + filename + " (" + Math.round(loaded / 1024 / 1024) + " MB)" });
  return dest;
}

async function downloadAll() {
  for (var i = 0; i < FILES.length; i++) {
    await downloadFile(FILES[i], function (p) {
      send({ type: "progress", progress: p });
    });
  }
}

function loadTokenizer() {
  var raw = JSON.parse(
    fs.readFileSync(path.join(CACHE_DIR, "tokenizer.json"), "utf8"),
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

async function loadModels() {
  if (visionSession && textSession) return true;

  var visionPath = path.join(CACHE_DIR, "blip_vision_encoder.onnx");
  var textPath = path.join(CACHE_DIR, "blip_text_decoder.onnx");
  if (!fs.existsSync(visionPath) || !fs.existsSync(textPath)) return false;

  if (!visionSession) {
    send({ type: "log", message: "Loading vision encoder ONNX" });
    visionSession = await ort.InferenceSession.create(visionPath, {
      executionProviders: ["cpu"],
    });
  }
  if (!textSession) {
    send({ type: "log", message: "Loading text decoder ONNX" });
    textSession = await ort.InferenceSession.create(textPath, {
      executionProviders: ["cpu"],
    });
  }
  if (!tokenizer) {
    tokenizer = loadTokenizer();
  }
  return true;
}

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
  if (retryCount >= MAX_RETRIES) {
    send({ type: "log", message: "Max retries reached for image description" });
    return null;
  }

  if (!(await loadModels())) return null;

  var pixelValues = await preprocessImage(imagePath);

  send({ type: "log", message: "Running vision encoder" });
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

    // Apply repetition penalty
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

  // Check for repetition and retry if needed
  if (isRepetitive(caption, generated)) {
    send({ type: "log", message: "Repetitive output detected, retrying (" + (retryCount + 1) + ")" });
    return describeImage(imagePath, retryCount + 1);
  }

  return caption || null;
}

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