const fs = require('fs');
const path = require('path');

async function readFile({ path: filePath }) {
  try {
    var content = fs.readFileSync(filePath, 'utf-8');
    if (content.length > 50000) content = content.slice(0, 50000) + '\n... (truncated)';
    return content;
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

module.exports = { readFile, writeFile, listDirectory };
