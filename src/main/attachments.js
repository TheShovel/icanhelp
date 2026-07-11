const fs = require("fs");
const path = require("path");
const { ocrImage, isSupportedImage, imageExtensions } = require("./ocr");

// Cap on how much of an attached text file we inline into the prompt. Anything
// larger is summarized and the model is told to read the rest via read_file_lines.
const MAX_TEXT_BYTES = 16 * 1024;
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
  const totalLines = countFileLines(filePath);
  return (
    text +
    "\n\n[Attachment truncated to the first " + MAX_TEXT_BYTES / 1024 +
    " KB. The full file is " + stat.size + " bytes, about " + totalLines +
    " lines. To read the rest, call read_file_lines(path=\"" + filePath +
    "\", startLine=" + estimateStartLine(MAX_TEXT_BYTES) +
    ") and continue in chunks of up to 500 lines. Only use read_file_lines for text files.]"
  );
}

function countFileLines(filePath) {
  let count = 0;
  const buf = Buffer.alloc(64 * 1024);
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    let bytes;
    while ((bytes = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      for (let i = 0; i < bytes; i++) if (buf[i] === 0x0a) count++;
    }
  } catch (_) {
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  return count + 1;
}

function estimateStartLine(byteCap) {
  // Rough heuristic: assume ~40 bytes/line to point the model near the truncation point.
  return Math.max(1, Math.floor(byteCap / 40));
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
