# icanhelp

Linux desktop AI assistant that runs as a transparent overlay, answers questions, executes commands, analyzes images, and searches the web, all running locally.

## Requirements

- **Node.js** 20+
- **npm**

## Install

```bash
git clone https://github.com/TheShovel/icanhelp.git
cd icanhelp
npm install
```

## Run

```bash
npm start
```

## Setup

On first launch the setup panel appears. Select a model from the download list (Qwen 3.5 2B recommended).

## Features

- Runs entirely offline with the built-in local provider
- Chat with GGUF models via node-llama-cpp (Qwen 3.5, Qwen 2.5)
- Model download manager with recommended models from HuggingFace
- File attachments: images get OCR + vision description automatically
- Screenshot capture: attaches a screenshot of your desktop
- Bash command execution with sudo support
- Web search
- Knowledge base: the AI can store and retrieve information using semantic search
- Theme system: AI can create, save, and apply CSS themes
- Vision model: local BLIP image captioning, no API needed

## Knowledge Base

The AI can use the `store_knowledge` tool to remember facts, instructions, or code snippets. Use `search_knowledge` to retrieve information by meaning. Data persists to `~/.cache/icanhelp/knowledge.json`.

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

Downloads automatically on first launch (~950 MB, cached at `~/.cache/icanhelp/transformers/`). Uses local ONNX inference.

## Files

- Config: `~/.config/icanhelp/config.enc` (encrypted)
- Models: `~/.cache/icanhelp/models/`
- Vision model cache: `~/.cache/icanhelp/transformers/`
- Knowledge base: `~/.cache/icanhelp/knowledge.json`
- Logs: `~/.cache/icanhelp/vision.log`, `ocr.log`

## Dev

```bash
ELECTRON_DEV=true npm start  # opens DevTools
```
