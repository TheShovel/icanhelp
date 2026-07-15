const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Hard cap on how many lines a single read_file_lines call may return.
// This keeps any one tool result well under the model's context limit.
const MAX_READ_LINES = 500;

// Files that read_file_lines is allowed to read line-by-line. Anything else
// (binaries, images, etc.) must go through read_file / ocr_image instead.
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.jsonl', '.js', '.jsx', '.ts', '.tsx',
  '.css', '.scss', '.html', '.htm', '.xml', '.csv', '.log', '.py', '.rb',
  '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp', '.sh', '.bash', '.zsh',
  '.yaml', '.yml', '.toml', '.ini', '.conf',
]);

// read_file refuses to dump files larger than this; it tells the model to use
// read_file_lines instead. Keeps a single tool result within context budget.
const SAFE_READ_BYTES = 64 * 1024;

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function countLines(filePath) {
  return new Promise(function (resolve, reject) {
    let count = 0;
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });
    rl.on('line', function () { count++; });
    rl.on('close', function () { resolve(count); });
    rl.on('error', reject);
  });
}

function readRange(filePath, startLine, endLine) {
  return new Promise(function (resolve, reject) {
    const lines = [];
    let current = 0;
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });
    rl.on('line', function (line) {
      current++;
      if (current >= startLine && current <= endLine) {
        lines.push(line);
      }
      if (current >= endLine) rl.close();
    });
    rl.on('close', function () { resolve(lines); });
    rl.on('error', reject);
  });
}

async function readFile({ path: filePath }) {
  if (/^https?:\/\//i.test(filePath)) {
    return "Error: '" + filePath + "' is a URL, not a file path. Use extract_webpage() to fetch and read webpage content.";
  }
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > SAFE_READ_BYTES) {
      const totalLines = await countLines(filePath);
      return (
        'File is too large to read in full (' + stat.size + ' bytes, about ' +
        totalLines + ' lines). Reading it all at once would exceed the model\'s ' +
        'context window. Use read_file_lines(path, startLine, maxLines) to read ' +
        'it in chunks (max ' + MAX_READ_LINES + ' lines per call). ' +
        'Only use read_file_lines for text files.'
      );
    }
    var content = fs.readFileSync(filePath, 'utf-8');
    if (content.length > SAFE_READ_BYTES)
      content = content.slice(0, SAFE_READ_BYTES) + '\n... (truncated)';
    return content;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function readFileLines({ path: filePath, startLine, maxLines }) {
  if (/^https?:\/\//i.test(filePath)) {
    return "Error: '" + filePath + "' is a URL, not a file path. Use extract_webpage() to fetch and read webpage content.";
  }
  try {
    if (!isTextFile(filePath)) {
      return (
        'read_file_lines only works on text files. "' + filePath + '" is not a ' +
        'recognized text file. Use ocr_image for images or read_file for other ' +
        'small files.'
      );
    }
    let start = typeof startLine === 'number' && startLine >= 1 ? Math.floor(startLine) : 1;
    let limit =
      typeof maxLines === 'number' && maxLines > 0 ? Math.floor(maxLines) : MAX_READ_LINES;
    if (limit > MAX_READ_LINES) limit = MAX_READ_LINES;

    const stat = fs.statSync(filePath);
    const totalLines = await countLines(filePath);
    if (start > totalLines) {
      return 'startLine ' + start + ' is past the end of the file (' + totalLines + ' lines).';
    }
    const endLine = Math.min(start + limit - 1, totalLines);
    const lines = await readRange(filePath, start, endLine);
    const more = endLine < totalLines;

    let out = 'File: ' + filePath + '\n';
    out += 'Showing lines ' + start + '-' + endLine + ' of ' + totalLines +
      ' (' + stat.size + ' bytes).\n';
    if (more) {
      out += 'More lines remain. Call read_file_lines with startLine=' + (endLine + 1) +
        ' to continue reading.\n';
    } else {
      out += 'End of file reached.\n';
    }
    out += '--- begin lines ---\n';
    out += lines.map(function (l, i) { return (start + i) + ': ' + l; }).join('\n');
    out += '\n--- end lines ---';
    return out;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function writeFile({ path: filePath, content }) {
  try {
    var dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return 'File written: ' + filePath;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function listDirectory({ path: dirPath }) {
  try {
    var entries = fs.readdirSync(dirPath, { withFileTypes: true });
    var lines = entries.map(function (e) {
      var type = e.isDirectory() ? '📁' : '📄';
      return type + ' ' + e.name;
    });
    return lines.join('\n') || '(empty directory)';
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

module.exports = { readFile, readFileLines, writeFile, listDirectory };
