---
name: knowledge-engine
description: Maintains and improves the project's local RAG knowledge base. Use when asked to add knowledge, create ingestion scripts, or improve the AI's ability to retrieve information.
---

# Knowledge Engine

This project has a local RAG (Retrieval-Augmented Generation) knowledge base at `knowledge/` directory.
The AI assistant (Canhelpy) uses it to answer questions without needing bigger model weights.

## Architecture

- `knowledge/` — markdown files organized by 9 categories (linux/, programming/, daily/, health/, finance/, home/, creative/, science/, general/)
- Current size: **85 files, 8024 embedded chunks** (verified via `npm run knowledge -- --stats`)
- `src/main/rag.js` — chunking, embedding (all-MiniLM-L6-v2), cosine similarity search, persistent JSON store at `~/.local/share/icanhelp/knowledge.json`
- `scripts/ingest-knowledge.js` — bulk-imports all `knowledge/` files into the vector store
- `scripts/fetch-knowledge.sh` — downloads external references (tldr-pages, systemd, Python docs) to expand the knowledge base
- System prompt in `src/main/llm-local.js` instructs the model to always search before answering
- Auto-search in `src/main/main.js` injects relevant knowledge entries before every user prompt

## Adding Knowledge

1. Create a markdown file in the appropriate `knowledge/<category>/` directory
2. Use dense, factual formatting — lists, tables, code blocks, clear headings
3. Frontmatter is optional; the ingestion script reads category from directory name and topic from filename
4. Run `npm run ingest` to embed everything into the vector store
5. Run `npm run fetch-knowledge` to download external references (tldr-pages, systemd, Python stdlib)

## Recently Added Topics (gaps filled)
- `linux/firewall.md` — UFW, firewalld, nftables, iptables, nmap, fail2ban
- `linux/systemd-timers.md` — calendar timers as a cron replacement
- `linux/disk-performance.md` — df/du/iostat/vmstat/perf monitoring
- `linux/signals-exit-codes.md` — Unix signals, shell exit codes, traps
- `programming/git-advanced.md` — rebase, stash, bisect, reflog, recovery
- `programming/rest-api-design.md` — resource naming, status codes, pagination, auth
- `science/measurement-units.md` — SI units, constants, conversions
- `general/troubleshooting.md` — methodology, root-cause classes, bisect

## Guidelines

- Prefer actionable, practical knowledge over theory
- Include concrete examples, commands with flags, and common use cases
- Structure for RAG: chunk-sized sections (~300-500 chars) that work well as standalone retrievals
- Cover: commands, configs, troubleshooting, best practices, common errors
