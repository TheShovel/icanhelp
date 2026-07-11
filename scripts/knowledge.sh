#!/usr/bin/env bash
# knowledge — fetch external references and embed the whole knowledge base
# Usage:
#   bash scripts/knowledge.sh            # fetch (if missing) + ingest
#   bash scripts/knowledge.sh --fetch    # force re-fetch external sources
#   bash scripts/knowledge.sh --ingest   # skip fetch, ingest only
#   bash scripts/knowledge.sh --stats    # show vector-store stats
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KNOWLEDGE_DIR="$ROOT/knowledge"
FETCH=auto
INGEST=1
STATS=0

for arg in "$@"; do
  case "$arg" in
    --fetch)  FETCH=force ;;
    --ingest) FETCH=skip ;;
    --stats)  STATS=1 ;;
    --help|-h)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

echo "=== icanhelp Knowledge Pipeline ==="
echo "Root: $ROOT"
echo ""

# ---- Step 1: Fetch external references ----
if [ "$FETCH" = "skip" ]; then
  echo "[fetch] skipped (--ingest)"
elif [ "$FETCH" = "force" ] || [ ! -f "$KNOWLEDGE_DIR/linux/tldr-cmds.md" ]; then
  echo "[fetch] Downloading external references..."
  bash "$ROOT/scripts/fetch-knowledge.sh"
else
  echo "[fetch] sources already present (use --fetch to refresh)"
fi

# ---- Step 2: Ingest into vector store ----
if [ "$STATS" = "1" ]; then
  echo ""
  echo "[stats] Vector store:"
  node -e "require('$ROOT/src/main/rag').listKnowledge().then(console.log)"
  exit 0
fi

if [ "$INGEST" = "1" ]; then
  echo ""
  echo "[ingest] Embedding knowledge base..."
  node "$ROOT/scripts/ingest-knowledge.js"
fi

echo ""
echo "=== Done ==="
echo "Run 'npm run knowledge -- --stats' to inspect the vector store."
