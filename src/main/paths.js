const path = require("path");
const os = require("os");

function resolveBaseDir() {
  const dataHome =
    process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
  return path.join(dataHome, "icanhelp");
}

const BASE_DIR = resolveBaseDir();

function appPath(...segments) {
  return path.join(BASE_DIR, ...segments);
}

module.exports = {
  BASE_DIR,
  appPath,
  modelsDir: () => appPath("models"),
  visionLog: () => appPath("vision.log"),
  ocrLog: () => appPath("ocr.log"),
  tesseractCache: () => appPath("tesseract"),
  visionModelDir: () => appPath("transformers", "ningpp--blip"),
};
