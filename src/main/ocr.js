const { appPath, ocrLog, tesseractCache } = require("./paths");

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
]);
const OCR_SETUP_TIMEOUT_MS = 60 * 1000;
const OCR_RECOGNIZE_TIMEOUT_MS = 30 * 1000;

let worker = null;
let workerPromise = null;
let workerGeneration = 0;
let ocrQueue = Promise.resolve();

function imageExtensions() {
  return Array.from(IMAGE_EXTENSIONS, function (ext) {
    return ext.slice(1);
  });
}

function isSupportedImage(imagePath) {
  return IMAGE_EXTENSIONS.has(path.extname(imagePath || "").toLowerCase());
}

function log(msg) {
  try {
    var dir = appPath();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      ocrLog(),
      new Date().toISOString() + " " + msg + "\n",
    );
  } catch {}
}

function withTimeout(promise, timeoutMs, message) {
  var timer;
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

async function getWorker() {
  if (worker) return worker;
  if (!workerPromise) {
    var generation = workerGeneration;
    workerPromise = createWorker("eng", 1, {
      cachePath: tesseractCache(),
      logger: () => {},
    })
      .then(function (createdWorker) {
        if (generation !== workerGeneration) {
          createdWorker.terminate().catch(function () {});
          throw new Error("OCR worker was reset.");
        }
        worker = createdWorker;
        return createdWorker;
      })
      .catch(function (e) {
        worker = null;
        throw e;
      })
      .finally(function () {
        workerPromise = null;
      });
  }
  return workerPromise;
}

function terminateWorker() {
  workerGeneration += 1;
  var oldWorker = worker;
  worker = null;
  workerPromise = null;
  if (oldWorker) {
    oldWorker.terminate().catch(function (e) {
      log("OCR worker termination failed: " + (e.message || String(e)));
    });
  }
}

function enqueueOCR(task) {
  var run = ocrQueue.then(task, task);
  ocrQueue = run.catch(function () {});
  return run;
}

async function recognizeImageText(imagePath) {
  var w;
  try {
    w = await withTimeout(
      getWorker(),
      OCR_SETUP_TIMEOUT_MS,
      "OCR setup timed out.",
    );
  } catch (e) {
    terminateWorker();
    throw e;
  }

  try {
    var result = await withTimeout(
      w.recognize(imagePath),
      OCR_RECOGNIZE_TIMEOUT_MS,
      "OCR timed out.",
    );
    return (result.data.text || "").trim();
  } catch (e) {
    terminateWorker();
    throw e;
  }
}

async function ocrImage(imagePath) {
  if (!isSupportedImage(imagePath)) {
    throw new Error("Unsupported image type.");
  }
  if (!fs.existsSync(imagePath)) {
    throw new Error("Image file was not found.");
  }

  var [description, text] = await Promise.all([
    describeImage(imagePath).catch(function (e) {
      log("Vision failed: " + (e.message || String(e)));
      return null;
    }),
    enqueueOCR(function () {
      return recognizeImageText(imagePath);
    }).catch(function (e) {
      log("OCR failed: " + (e.message || String(e)));
      return "";
    }),
  ]);

  var parts = [];
  if (description) {
    parts.push(description);
  }
  if (text) {
    parts.push("[Text in image]: " + text);
  }

  if (parts.length === 0) return "";
  return parts.join("\n");
}

async function shutdownOCR() {
  workerGeneration += 1;
  if (worker) {
    var oldWorker = worker;
    worker = null;
    workerPromise = null;
    await oldWorker.terminate();
  }
}

module.exports = { ocrImage, shutdownOCR, isSupportedImage, imageExtensions };
