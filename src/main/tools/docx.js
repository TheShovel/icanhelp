const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { Lexer } = require("marked");

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeHtmlEntities(str) {
  return String(str)
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#62;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ");
}

// Direct formatting for headings instead of relying on named styles
// (the docx has no styles.xml, so Word ignores w:pStyle references).
var HEADING_RPR = {
  1: "<w:rPr><w:b/><w:bCs/><w:sz w:val=\"36\"/></w:rPr>",
  2: "<w:rPr><w:b/><w:bCs/><w:sz w:val=\"28\"/></w:rPr>",
  3: "<w:rPr><w:b/><w:bCs/><w:sz w:val=\"24\"/></w:rPr>",
  4: "<w:rPr><w:b/><w:bCs/><w:sz w:val=\"22\"/></w:rPr>",
  5: "<w:rPr><w:b/><w:sz w:val=\"20\"/></w:rPr>",
  6: "<w:rPr><w:b/><w:sz w:val=\"20\"/></w:rPr>",
};

function renderHeading(token) {
  var rpr = HEADING_RPR[token.depth] || HEADING_RPR[1];
  var runs = renderInlineTokens(token.tokens, rpr);
  var spacing = "<w:spacing w:before=\"200\" w:after=\"100\"/>";
  return "<w:p><w:pPr>" + spacing + "</w:pPr>" + runs + "</w:p>";
}

function runOpen(rpr) {
  return "<w:r><w:rPr>" + rpr + "</w:rPr>";
}

function runText(text) {
  return "<w:t xml:space=\"preserve\">" + escapeXml(text) + "</w:t>";
}

function runClose() {
  return "</w:r>";
}

function renderInlineRun(text, rpr) {
  return runOpen(rpr) + runText(decodeHtmlEntities(text)) + runClose();
}

var INLINE_STYLES = {
  strong: { open: "<w:b/><w:bCs/>" },
  em:     { open: "<w:i/><w:iCs/>" },
  del:    { open: "<w:strike/>" },
  codespan: { open: "<w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\"/>" },
  link:   { open: "<w:u w:val=\"single\"/><w:color w:val=\"0563C1\"/>" },
};

function renderInlineTokens(tokens, activeStyles) {
  if (!tokens) return "";
  activeStyles = activeStyles || "";
  var parts = [];
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if (t.type === "text") {
      if (t.tokens && t.tokens.length > 0) {
        parts.push(renderInlineTokens(t.tokens, activeStyles));
      } else if (activeStyles) {
        parts.push(runOpen(activeStyles) + runText(decodeHtmlEntities(t.text)) + runClose());
      } else {
        parts.push(renderInlineRun(t.text, ""));
      }
    } else if (t.type === "br") {
      parts.push("<w:r><w:br/></w:r>");
    } else if (t.type === "image") {
      parts.push(renderInlineRun("[Image: " + (t.title || t.text || "") + "]", ""));
    } else {
      var style = INLINE_STYLES[t.type];
      if (style) {
        var innerTokens = t.tokens;
        if (!innerTokens && t.text) {
          parts.push(runOpen(activeStyles + style.open) + runText(t.text) + runClose());
        } else {
          parts.push(renderInlineTokens(innerTokens, activeStyles + style.open));
        }
      } else if (t.tokens) {
        parts.push(renderInlineTokens(t.tokens, activeStyles));
      } else if (t.text) {
        parts.push(activeStyles
          ? runOpen(activeStyles) + runText(t.text) + runClose()
          : renderInlineRun(t.text, ""));
      }
    }
  }
  return parts.join("");
}

function ppr(style) {
  var spacing = "<w:spacing w:before=\"80\" w:after=\"80\"/>";
  if (style) {
    return "<w:pPr><w:pStyle w:val=\"" + style + "\"/>" + spacing + "</w:pPr>";
  }
  return "<w:pPr>" + spacing + "</w:pPr>";
}

function buildParagraph(content, style) {
  return "<w:p>" + ppr(style) + content + "</w:p>";
}

function renderListItems(items, ordered, numberingState) {
  var numId = ++numberingState.nextNumId;
  numberingState.instances.push({ numId: numId, ordered: ordered });
  var parts = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var inner = item.tokens ? renderInlineTokens(item.tokens) : renderInlineRun(item.text || "", "");
    parts.push(
      "<w:p>" +
      "<w:pPr>" +
      "<w:pStyle w:val=\"ListParagraph\"/>" +
      "<w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"" + numId + "\"/></w:numPr>" +
      "</w:pPr>" +
      inner +
      "</w:p>"
    );
  }
  return parts.join("");
}

function renderCodeBlock(text, lang) {
  var lines = text.split("\n");
  var parts = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    parts.push(
      "<w:p>" +
      "<w:pPr>" +
      "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F0F0F0\"/>" +
      "<w:spacing w:before=\"20\" w:after=\"20\"/>" +
      "</w:pPr>" +
      "<w:r>" +
      "<w:rPr><w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\"/></w:rPr>" +
      "<w:t xml:space=\"preserve\">" + escapeXml(line) + "</w:t>" +
      "</w:r>" +
      "</w:p>"
    );
  }
  return parts.join("");
}

function renderBlockToken(token, numberingState) {
  switch (token.type) {
    case "heading":
      return renderHeading(token);
    case "paragraph":
      return buildParagraph(renderInlineTokens(token.tokens), "");
    case "list":
      return renderListItems(token.items, token.ordered, numberingState);
    case "code":
      return renderCodeBlock(token.text, token.lang || "");
    case "blockquote":
      if (token.tokens) {
        return token.tokens.map(function (t) {
          var rendered = renderBlockToken(t, numberingState);
          return rendered.replace("<w:pPr>", '<w:pPr><w:ind w:left="720" w:right="720"/>');
        }).join("");
      }
      return buildParagraph(
        renderInlineRun(token.text || "", ""),
        ""
      ).replace("<w:pPr>", '<w:pPr><w:ind w:left="720" w:right="720"/>');
    case "hr":
      return buildParagraph(
        "<w:r><w:rPr></w:rPr></w:r>",
        ""
      ).replace(
        "<w:pPr>",
        "<w:pPr><w:pBdr><w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"1\" w:color=\"auto\"/></w:pBdr>"
      );
    case "table":
      return renderTable(token);
    case "space":
    case "html":
      return "";
    default:
      if (token.tokens) {
        return token.tokens.map(function (t) { return renderBlockToken(t, numberingState); }).join("");
      }
      if (token.text) {
        return buildParagraph(renderInlineRun(token.text, ""), "");
      }
      return "";
  }
}

function renderTable(token) {
  var parts = [];
  var header = token.header || [];
  var rows = token.rows || [];

  var allRows = header.length > 0 ? [header].concat(rows) : rows;
  var tblBorders = "<w:tblBorders>" +
    "<w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "<w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "<w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "<w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "<w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "<w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"auto\"/>" +
    "</w:tblBorders>";

  parts.push("<w:tbl><w:tblPr>" + tblBorders + "</w:tblPr>");

  for (var r = 0; r < allRows.length; r++) {
    var row = allRows[r];
    for (var c = 0; c < row.length; c++) {
      var cell = row[c];
      var cellText = cell.tokens ? renderInlineTokens(cell.tokens) : renderInlineRun(cell.text || "", "");
      var isHeader = r === 0 && header.length > 0;
      parts.push(
        "<w:p>" +
        (isHeader ? "<w:pPr><w:pStyle w:val=\"Heading4\"/></w:pPr>" : "") +
        cellText +
        "</w:p>"
      );
    }
    if (r < allRows.length - 1) {
      parts.push(buildParagraph("", ""));
    }
  }
  parts.push("</w:tbl>");
  return parts.join("");
}

function buildNumberingXml(numberingState) {
  var instances = numberingState.instances;
  if (instances.length === 0) return "";

  var abstractBullet = 0;
  var abstractDecimal = 1;

  var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +

    // Abstract bullet numbering
    '<w:abstractNum w:abstractNumId="' + abstractBullet + '">' +
    '<w:multiLevelType w:val="hybridMultilevel"/>' +
    '<w:lvl w:ilvl="0">' +
    '<w:start w:val="1"/>' +
    '<w:numFmt w:val="bullet"/>' +
    '<w:lvlText w:val=""/>' +
    '<w:lvlJc w:val="left"/>' +
    '<w:pPr>' +
    '<w:ind w:left="720" w:hanging="360"/>' +
    '</w:pPr>' +
    '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr>' +
    '</w:lvl>' +
    '</w:abstractNum>' +

    // Abstract decimal numbering
    '<w:abstractNum w:abstractNumId="' + abstractDecimal + '">' +
    '<w:multiLevelType w:val="hybridMultilevel"/>' +
    '<w:lvl w:ilvl="0">' +
    '<w:start w:val="1"/>' +
    '<w:numFmt w:val="decimal"/>' +
    '<w:lvlText w:val="%1."/>' +
    '<w:lvlJc w:val="left"/>' +
    '<w:pPr>' +
    '<w:ind w:left="720" w:hanging="360"/>' +
    '</w:pPr>' +
    '</w:lvl>' +
    '</w:abstractNum>';

  for (var i = 0; i < instances.length; i++) {
    var inst = instances[i];
    var absId = inst.ordered ? abstractDecimal : abstractBullet;
    xml += '<w:num w:numId="' + inst.numId + '">' +
      '<w:abstractNumId w:val="' + absId + '"/>' +
      '</w:num>';
  }

  xml += '</w:numbering>';
  return xml;
}

function buildDocumentXml(text) {
  var tokens = Lexer.lex(text);
  var numberingState = { nextNumId: 1, instances: [] };
  var bodyParts = [];

  for (var i = 0; i < tokens.length; i++) {
    var block = renderBlockToken(tokens[i], numberingState);
    if (block) bodyParts.push(block);
  }

  var numberingXml = buildNumberingXml(numberingState);

  return {
    documentXml:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" +
      bodyParts.join("") +
      "</w:body>" +
      "</w:document>",
    numberingXml: numberingXml,
  };
}

function buildContentTypesXml(hasNumbering) {
  var overrides = '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>';
  if (hasNumbering) {
    overrides += '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>';
  }
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    overrides +
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

function buildDocRelsXml(hasNumbering) {
  var rels = "";
  if (hasNumbering) {
    rels = '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>';
  }
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    rels +
    "</Relationships>"
  );
}

function sanitizeFilename(name) {
  return (name || "document")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 60) || "document";
}

function buildDocxFromMarkdown(content, filename) {
  if (!content || !content.trim()) {
    return { error: "content is required. Provide the text for the document." };
  }

  var safeName = sanitizeFilename(filename);
  var result = buildDocumentXml(content);
  var hasNumbering = result.numberingXml.length > 0;

  var tmpDir = path.join(os.tmpdir(), "icanhelp-docx-" + Date.now());
  var wordDir = path.join(tmpDir, "word");
  var relsDir = path.join(tmpDir, "_rels");

  try {
    fs.mkdirSync(wordDir, { recursive: true });
    fs.mkdirSync(relsDir, { recursive: true });

    fs.writeFileSync(path.join(tmpDir, "[Content_Types].xml"), buildContentTypesXml(hasNumbering));
    fs.writeFileSync(path.join(relsDir, ".rels"), buildRelsXml());
    fs.writeFileSync(path.join(wordDir, "document.xml"), result.documentXml);

    if (hasNumbering) {
      fs.writeFileSync(path.join(wordDir, "numbering.xml"), result.numberingXml);
    }

    fs.mkdirSync(path.join(wordDir, "_rels"), { recursive: true });
    fs.writeFileSync(path.join(wordDir, "_rels", "document.xml.rels"), buildDocRelsXml(hasNumbering));

    var docxPath = path.join(os.tmpdir(), safeName + ".docx");

    try {
      execFileSync("zip", ["-0", "-r", "-q", docxPath, "."], {
        cwd: tmpDir,
        timeout: 10000,
        stdio: "ignore",
      });
    } catch (_) {
      fs.writeFileSync(docxPath, result.documentXml);
      docxPath = docxPath.replace(/\.docx$/, ".xml");
    }

    return {
      ok: true,
      path: docxPath,
      filename: path.basename(docxPath),
      size: fs.statSync(docxPath).size,
      preview: content.slice(0, 500),
    };
  } catch (e) {
    return { error: "Failed to create document: " + (e.message || String(e)) };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function createDocx(args) {
  // New document generation flow: description-based.
  // The LLM provides a description + filename; the system handles research
  // gathering and launches a separate document-writing session.
  if (args && args.description) {
    return JSON.stringify({
      __doc_pending__: true,
      description: String(args.description || ""),
      filename: sanitizeFilename(args.filename),
    });
  }

  // Legacy flow: content-based (backward compatible).
  var content = (args && args.content) || "";
  var filename = sanitizeFilename(args && args.filename);

  if (!content.trim()) {
    return JSON.stringify({
      error: "content is required. Provide the text for the document.",
    });
  }

  var docxResult = buildDocxFromMarkdown(content, filename);
  return JSON.stringify(docxResult);
}

module.exports = { createDocx, buildDocxFromMarkdown, sanitizeFilename };
