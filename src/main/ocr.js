const { createWorker } = require("tesseract.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
]);

let worker = null;
let ocrQueue = Promise.resolve();

function imageExtensions() {
  return Array.from(IMAGE_EXTENSIONS, function (ext) {
    return ext.slice(1);
  });
}

function isSupportedImage(imagePath) {
  return IMAGE_EXTENSIONS.has(path.extname(imagePath || "").toLowerCase());
}

async function getWorker() {
  if (!worker) {
    worker = await createWorker("eng", 1, {
      cachePath: path.join(os.homedir(), ".cache", "icanhelp", "tesseract"),
      logger: () => {},
    });
  }
  return worker;
}

function enqueueOCR(task) {
  const run = ocrQueue.then(task, task);
  ocrQueue = run.catch(function () {});
  return run;
}

async function ocrImage(imagePath) {
  if (!isSupportedImage(imagePath)) {
    throw new Error("Unsupported image type.");
  }
  if (!fs.existsSync(imagePath)) {
    throw new Error("Image file was not found.");
  }

  return await enqueueOCR(async function () {
    const w = await getWorker();
    const { data } = await w.recognize(imagePath);
    return data.text || "";
  });
}

async function shutdownOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

module.exports = { ocrImage, shutdownOCR, isSupportedImage, imageExtensions };
