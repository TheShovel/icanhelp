<div align="center">
  <img src="website/assets/textLogo.png" alt="icanhelp" width="240">
</div>

<div align="center">
  <img src="https://img.shields.io/github/languages/top/TheShovel/icanhelp?style=flat-square&logo=javascript&label=language" alt="Language">&nbsp;&nbsp;
  <img src="https://img.shields.io/github/license/TheShovel/icanhelp?style=flat-square" alt="License">&nbsp;&nbsp;
  <img src="https://img.shields.io/github/last-commit/TheShovel/icanhelp?style=flat-square&logo=git" alt="Last Commit">
</div>

Linux desktop AI assistant that runs as a transparent overlay, answers questions, executes commands, analyzes images, and searches the web, all running locally.

## Requirements

- **Node.js** 20+
- **npm**
- **git**
- **rsync**
- **curl**
- **unzip**

## Install

Run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/TheShovel/icanhelp/main/install.sh | bash
```

This clones the repo, copies files to `~/.local/share/icanhelp/`, installs dependencies, generates icons, and registers it as a system app. After it finishes, launch "icanhelp" from your app launcher.

Alternatively, clone and run manually:

```bash
git clone https://github.com/TheShovel/icanhelp.git
cd icanhelp
npm install
npm start
```

## Compatibility

The installer supports **x86_64** and **ARM64 (aarch64)** machines running a glibc-based Linux distro (Ubuntu, Fedora, Debian, Arch, openSUSE, and derivatives) with a desktop environment. It does not work on musl-based systems like Alpine Linux, on headless/WSL setups without a desktop, or on 32-bit ARM.

## Setup

On first launch the setup panel appears. Select a model from the download list (Qwen 3.5 2B recommended).

## Features

- Runs fully offline
- Model download manager
- File attachments
- Screenshot capture
- Bash command execution
- Web search
- Knowledge base
- Theme system
- Vision model

## Knowledge Base

The AI assistant has a local RAG (Retrieval-Augmented Generation) knowledge base at `knowledge/` - a curated collection of markdown files across 9 categories. The AI uses it to answer questions without needing larger model weights.

### Categories

| Category | Files | Topics |
|----------|-------|--------|
| `knowledge/creative/` | 35 | Music, photography, cooking, baking, sewing, drawing, writing, film, crafts |
| `knowledge/daily/` | 60 | Life skills, travel, parenting, relationships, career, fitness, car maintenance |
| `knowledge/finance/` | 12 | Budgeting, investing, taxes, retirement, credit, small business |
| `knowledge/general/` | 27 | History, philosophy, economics, politics, world religions, ethics |
| `knowledge/health/` | 50 | Mental health, nutrition, exercise, first aid, sleep, child development |
| `knowledge/home/` | 37 | Gardening, plumbing, woodworking, electrical, home security, cleaning |
| `knowledge/linux/` | 16 | Bash, systemd, kernel, networking, package management, troubleshooting |
| `knowledge/programming/` | 70 | Python, JS/TS, Rust, Go, databases, Docker, Kubernetes, ML, web dev |
| `knowledge/science/` | 32 | Physics, chemistry, biology, neuroscience, climate science, astronomy |

### How It Works

- `src/main/rag.js` - chunks, embeds (all-MiniLM-L6-v2), and performs cosine similarity search over the knowledge base
- Auto-search in `src/main/main.js` injects relevant knowledge entries before every user prompt
- The system prompt in `src/main/llm-local.js` instructs the model to always search before answering
- Data persists to `~/.local/share/icanhelp/knowledge.json`

### Adding Knowledge

1. Create a markdown file in the appropriate `knowledge/<category>/` directory
2. Use dense, factual formatting - lists, tables, code blocks, clear headings
3. Run `npm run ingest` to embed everything into the vector store
4. Run `npm run fetch-knowledge` to download external references
5. Run `npm run knowledge-stats` to see the current number of chunks per category

The AI can also use the `store_knowledge` tool at runtime to remember facts, instructions, or code snippets, and `search_knowledge` to retrieve them by meaning.

## Screenshot Dependencies

The screenshot feature tries these tools in order. Install at least one:

| Tool | Package | Works on |
|------|----------|----------|
| `spectacle` | `spectacle` | KDE Plasma (Wayland + X11) |
| `grim` | `grim` | Wayland (Sway, Hyprland, River) |
| `gnome-screenshot` | `gnome-screenshot` | GNOME (Wayland + X11) |
| `import` | `imagemagick` | X11 |
| `maim` | `maim` | X11 |
| `scrot` | `scrot` | X11 |

## Vision Model

Downloads automatically on first launch (~950 MB, cached at `~/.local/share/icanhelp/transformers/`). Uses local ONNX inference.

## Files

- Config: `~/.config/icanhelp/config.enc` (encrypted)
- App data: `~/.local/share/icanhelp/` (models, knowledge base, vision model, logs)
  - Models: `~/.local/share/icanhelp/models/`
  - Vision model cache: `~/.local/share/icanhelp/transformers/`
  - Knowledge base: `~/.local/share/icanhelp/knowledge.json`
  - Logs: `~/.local/share/icanhelp/vision.log`, `ocr.log`
