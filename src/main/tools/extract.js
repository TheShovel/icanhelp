const { ocrImage } = require("../ocr");
const { describeImage } = require("../vision");
const { extractText: extractWithModel } = require("../extract-model");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { appPath } = require("../paths");

const MAX_CONTENT_LENGTH = 12000;
const MAX_IMAGE_COUNT = 5;
const FETCH_TIMEOUT_MS = 15000;

function stripHtml(html) {
  var text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "")

  // Replace block elements with newlines
  text = text
    .replace(/<\/?(div|p|h[1-6]|li|tr|br|article|section|main|pre|blockquote|table|ul|ol|dl)[^>]*>/gi, "\n")

  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(parseInt(code, 10));
    });

  // Collapse whitespace
  text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim();

  // Remove very short lines (menu items, nav crumbs)
  var lines = text.split("\n").filter(function (line) {
    var trimmed = line.trim();
    return trimmed.length > 3 || /^[A-Z][a-z]/.test(trimmed);
  });

  return lines.join("\n").trim();
}

function extractTitle(html) {
  var m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

function extractImages(html, baseUrl) {
  var imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  var srcsetRegex = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi;
  var urls = [];
  var seen = new Set();
  var m;

  while ((m = imgRegex.exec(html)) !== null) {
    var src = resolveUrl(m[1], baseUrl);
    if (src && !seen.has(src) && isImageUrl(src)) {
      seen.add(src);
      urls.push(src);
    }
  }

  return urls.slice(0, MAX_IMAGE_COUNT);
}

function resolveUrl(url, base) {
  if (!url || url.startsWith("data:")) return null;
  try {
    return new URL(url, base).href;
  } catch (_) {
    return null;
  }
}

function isImageUrl(url) {
  return /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(url);
}

async function fetchPage(url) {
  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    var res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return { error: "HTTP " + res.status + " " + res.statusText };
    }

    var contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { error: "Not an HTML page (content-type: " + contentType + ")" };
    }

    var html = await res.text();
    return { html: html, finalUrl: res.url };
  } catch (e) {
    if (e.name === "AbortError") {
      return { error: "Request timed out after " + FETCH_TIMEOUT_MS / 1000 + "s" };
    }
    return { error: "Failed to fetch: " + (e.message || String(e)) };
  } finally {
    clearTimeout(timer);
  }
}

async function processImage(imgUrl, tmpDir) {
  try {
    var res = await fetch(imgUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;

    var ext = path.extname(new URL(imgUrl).pathname).split("?")[0] || ".jpg";
    if (!/^\.(png|jpe?g|webp|gif|bmp)$/i.test(ext)) ext = ".jpg";

    var tmpFile = path.join(tmpDir, "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + ext);
    var buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(tmpFile, buf);

    var result = {};
    try {
      var desc = await describeImage(tmpFile);
      if (desc) result.description = desc;
    } catch (_) {}

    try {
      var text = await ocrImage(tmpFile);
      if (text) result.ocr_text = text;
    } catch (_) {}

    try { fs.unlinkSync(tmpFile); } catch (_) {}

    if (result.description || result.ocr_text) return result;
    return null;
  } catch (_) {
    return null;
  }
}

async function extractWebpage(args) {
  var url = (args && args.url) || "";
  var shouldExtract = args && args.extractImages !== false;
  var maxImages = (args && args.maxImages) || 3;

  if (!url) {
    return JSON.stringify({ error: "url is required" });
  }

  try {
    new URL(url);
  } catch (_) {
    return JSON.stringify({ error: "Invalid URL: " + url });
  }

  var page = await fetchPage(url);
  if (page.error) {
    return JSON.stringify({ error: page.error });
  }

  var html = page.html;
  var finalUrl = page.finalUrl || url;

  var title = extractTitle(html);

  var text;
  var modelResult = await Promise.race([
    extractWithModel(html).catch(function () { return null; }),
    new Promise(function (r) { return setTimeout(function () { return r(null); }, 5000); }),
  ]);
  if (modelResult && modelResult.text && modelResult.text.length > 30) {
    text = modelResult.text;
  } else {
    text = stripHtml(html);
  }

  if (text.length > MAX_CONTENT_LENGTH) {
    text = text.slice(0, MAX_CONTENT_LENGTH) + "\n\n... (truncated)";
  }

  var result = {
    url: finalUrl,
    title: title,
    text: text,
  };

  if (shouldExtract) {
    var imgUrls = extractImages(html, finalUrl).slice(0, maxImages);
    if (imgUrls.length > 0) {
      var tmpDir = path.join(os.tmpdir(), "icanhelp-extract-" + Date.now());
      fs.mkdirSync(tmpDir, { recursive: true });

      var images = [];
      for (var i = 0; i < imgUrls.length; i++) {
        var processed = await processImage(imgUrls[i], tmpDir);
        if (processed) {
          images.push({ url: imgUrls[i], ...processed });
        }
      }

      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

      if (images.length > 0) {
        result.images = images;
      }
    }
  }

  return JSON.stringify(result, null, 2);
}

module.exports = { extractWebpage };
