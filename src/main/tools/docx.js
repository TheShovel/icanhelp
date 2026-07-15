const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphsFromText(text) {
  return text
    .split(/\n\n+/)
    .filter(function (p) { return p.trim(); })
    .map(function (p) {
      var lines = p.trim().split("\n");
      return lines
        .map(function (line) {
          return (
            "<w:p>" +
            "<w:r><w:rPr></w:rPr><w:t xml:space=\"preserve\">" +
            escapeXml(line) +
            "</w:t></w:r>" +
            "</w:p>"
          );
        })
        .join("");
    })
    .join("");
}

function buildDocumentXml(text) {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    "<w:body>" +
    paragraphsFromText(text) +
    "</w:body>" +
    "</w:document>"
  );
}

function buildContentTypesXml() {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    "</Types>"
  );
}

function buildRelsXml() {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>"
  );
}

function buildDocRelsXml() {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    "</Relationships>"
  );
}

function sanitizeFilename(name) {
  return (name || "document")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 60) || "document";
}

async function createDocx(args) {
  var content = (args && args.content) || "";
  var filename = sanitizeFilename(args && args.filename);

  if (!content.trim()) {
    return JSON.stringify({
      error: "content is required. Provide the text for the document.",
    });
  }

  var tmpDir = path.join(os.tmpdir(), "icanhelp-docx-" + Date.now());
  var wordDir = path.join(tmpDir, "word");
  var relsDir = path.join(tmpDir, "_rels");

  try {
    fs.mkdirSync(wordDir, { recursive: true });
    fs.mkdirSync(relsDir, { recursive: true });

    fs.writeFileSync(path.join(tmpDir, "[Content_Types].xml"), buildContentTypesXml());
    fs.writeFileSync(path.join(relsDir, ".rels"), buildRelsXml());
    fs.writeFileSync(path.join(wordDir, "document.xml"), buildDocumentXml(content));
    fs.mkdirSync(path.join(wordDir, "_rels"), { recursive: true });
    fs.writeFileSync(path.join(wordDir, "_rels", "document.xml.rels"), buildDocRelsXml());

    var docxPath = path.join(os.tmpdir(), filename + ".docx");

    // Build zip with no compression (store) for simplicity.
    // Use system zip; fall back to storing as plain XML if zip unavailable.
    try {
      execFileSync("zip", ["-0", "-r", "-q", docxPath, "."], {
        cwd: tmpDir,
        timeout: 10000,
        stdio: "ignore",
      });
    } catch (_) {
      // If zip is unavailable, save as plain XML as last resort.
      fs.writeFileSync(docxPath, buildDocumentXml(content));
      docxPath = docxPath.replace(/\.docx$/, ".xml");
    }

    return JSON.stringify({
      ok: true,
      path: docxPath,
      filename: path.basename(docxPath),
      size: fs.statSync(docxPath).size,
      preview: content.slice(0, 500),
    });
  } catch (e) {
    return JSON.stringify({ error: "Failed to create document: " + (e.message || String(e)) });
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { createDocx };
