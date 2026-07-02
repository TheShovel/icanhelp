const fs = require("fs");
const path = require("path");
const { ocrImage, isSupportedImage, imageExtensions } = require("./ocr");

const MAX_TEXT_BYTES = 100 * 1024;
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".jsonl",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".html",
  ".htm",
  ".xml",
  ".csv",
  ".log",
  ".py",
  ".rb",
  ".rs",
  ".go",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".sh",
  ".bash",
  ".zsh",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".conf",
]);

function textExtensions() {
  return Array.from(TEXT_EXTENSIONS, function (ext) {
    return ext.slice(1);
  });
}

function ensureFile(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("No attachment selected.");
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    throw new Error("Attachment file was not found.");
  }

  if (!stat.isFile()) {
    throw new Error("Attachment must be a file.");
  }

  return stat;
}

function attachmentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (isSupportedImage(filePath)) return "image";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  return null;
}

function readTextAttachment(filePath, stat) {
  const data = fs.readFileSync(filePath);
  const text = data.subarray(0, MAX_TEXT_BYTES).toString("utf8").trim();
  if (stat.size <= MAX_TEXT_BYTES) return text;
  return text + "\n\n[Attachment truncated to 100 KB.]";
}

async function prepareAttachment(filePath) {
  const stat = ensureFile(filePath);
  const type = attachmentType(filePath);

  if (!type) {
    throw new Error("Unsupported attachment type. Choose an image or text file.");
  }

  const text = type === "image"
    ? (await ocrImage(filePath)).trim()
    : readTextAttachment(filePath, stat);

  return {
    path: filePath,
    name: path.basename(filePath),
    type,
    text,
  };
}

function supportedAttachmentExtensions() {
  return imageExtensions().concat(textExtensions());
}

module.exports = { prepareAttachment, supportedAttachmentExtensions };
