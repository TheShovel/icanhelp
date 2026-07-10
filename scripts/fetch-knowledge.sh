#!/usr/bin/env bash
# fetch-knowledge — downloads extra knowledge from public sources
# Usage: bash scripts/fetch-knowledge.sh
set -euo pipefail

KNOWLEDGE_DIR="$(cd "$(dirname "$0")/.." && pwd)/knowledge"

echo "=== Fetching External Knowledge ==="
echo "Target: $KNOWLEDGE_DIR"
echo ""

# 1. Fetch common Linux command cheatsheets
echo "[1/5] Fetching Linux command references..."
mkdir -p "$KNOWLEDGE_DIR/linux"

# tldr-pages collection (simplified man pages)
if [ ! -f "$KNOWLEDGE_DIR/linux/tldr-collection.md" ]; then
  echo "  Downloading tldr-pages..."
  # Fetch common tldr pages as reference
  for cmd in find grep sed awk tar rsync ssh scp curl wget crontab fdisk mkfs ln chown chmod; do
    echo "    $cmd"
    curl -sL "https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/common/$cmd.md" \
      2>/dev/null >> "$KNOWLEDGE_DIR/linux/tldr-cmds.md.tmp" || true
    echo -e "\n---\n" >> "$KNOWLEDGE_DIR/linux/tldr-cmds.md.tmp"
  done
  mv "$KNOWLEDGE_DIR/linux/tldr-cmds.md.tmp" "$KNOWLEDGE_DIR/linux/tldr-cmds.md" 2>/dev/null || true
  echo "  Done."
fi

# 2. Fetch systemd service list
echo "[2/5] Fetching systemd documentation..."
# systemd man page summaries are available in markdown
curl -sL "https://raw.githubusercontent.com/systemd/systemd/main/man/systemd.service.xml" \
  2>/dev/null | sed 's/<[^>]*>//g' | sed '/^$/d' | head -200 \
  > "$KNOWLEDGE_DIR/linux/systemd-service-guide.md" 2>/dev/null || true

# 3. Fetch Python standard library overview
echo "[3/5] Fetching programming references..."
curl -sL "https://docs.python.org/3/tutorial/stdlib.html" \
  2>/dev/null | python3 -c "
import sys, re, html
content = sys.stdin.read()
# extract text from HTML
text = re.sub(r'<[^>]+>', ' ', content)
text = html.unescape(text)
lines = [l.strip() for l in text.split('\n') if l.strip()]
print('\n'.join(lines[:500]))
" > "$KNOWLEDGE_DIR/programming/python-stdlib.md" 2>/dev/null || true

# 4. Fetch common API status codes reference
echo "[4/5] Fetching HTTP reference..."
cat > "$KNOWLEDGE_DIR/general/http-status-codes.md" << 'HTTPEOF'
# HTTP Status Codes Reference

## 1xx Informational
- 100 Continue
- 101 Switching Protocols
- 102 Processing (WebDAV)
- 103 Early Hints

## 2xx Success
- 200 OK
- 201 Created
- 202 Accepted
- 203 Non-Authoritative Information
- 204 No Content
- 205 Reset Content
- 206 Partial Content
- 207 Multi-Status (WebDAV)
- 208 Already Reported (WebDAV)
- 226 IM Used (HTTP Delta encoding)

## 3xx Redirection
- 300 Multiple Choices
- 301 Moved Permanently
- 302 Found (Previously "Moved temporarily")
- 303 See Other
- 304 Not Modified
- 305 Use Proxy (deprecated)
- 306 Switch Proxy (unused)
- 307 Temporary Redirect
- 308 Permanent Redirect

## 4xx Client Error
- 400 Bad Request
- 401 Unauthorized
- 402 Payment Required (experimental)
- 403 Forbidden
- 404 Not Found
- 405 Method Not Allowed
- 406 Not Acceptable
- 407 Proxy Authentication Required
- 408 Request Timeout
- 409 Conflict
- 410 Gone
- 411 Length Required
- 412 Precondition Failed
- 413 Payload Too Large
- 414 URI Too Long
- 415 Unsupported Media Type
- 416 Range Not Satisfiable
- 417 Expectation Failed
- 418 I'm a Teapot (RFC 2324, April Fools)
- 421 Misdirected Request
- 422 Unprocessable Entity (WebDAV)
- 423 Locked (WebDAV)
- 424 Failed Dependency (WebDAV)
- 425 Too Early (RFC 8470)
- 426 Upgrade Required
- 428 Precondition Required
- 429 Too Many Requests
- 431 Request Header Fields Too Large
- 451 Unavailable For Legal Reasons

## 5xx Server Error
- 500 Internal Server Error
- 501 Not Implemented
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout
- 505 HTTP Version Not Supported
- 506 Variant Also Negotiates
- 507 Insufficient Storage (WebDAV)
- 508 Loop Detected (WebDAV)
- 510 Not Extended
- 511 Network Authentication Required
HTTPEOF
echo "  Done."

# 5. Generate a summary of the knowledge base structure
echo "[5/5] Building knowledge index..."
find "$KNOWLEDGE_DIR" -name "*.md" -exec basename {} \; | sort | while read -r f; do
  echo "- ${f%.md}"
done > /tmp/kb-index.txt

echo ""
echo "=== Fetch Complete ==="
echo "Knowledge files: $(find "$KNOWLEDGE_DIR" -name '*.md' | wc -l)"
echo ""
echo "Run 'node scripts/ingest-knowledge.js' to embed into vector store."
