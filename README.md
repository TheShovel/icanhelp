# icanhelp

Linux desktop AI assistant that runs as a transparent overlay, answers questions, executes commands, analyzes images, and searches the web — all running locally.

## Requirements

- **Node.js** 20+
- **npm**

## Install

```bash
git clone https://github.com/yourname/icanhelp.git
cd icanhelp
npm install
```

## Run

```bash
npm start
```

## Setup

On first launch the setup panel appears. Choose your provider:

- **Local (built-in)** — runs a GGUF model directly in Electron, no external software needed. Select a model from the download list (Qwen 2.5 3B recommended).
- **Ollama** — connects to a local Ollama instance at `http://localhost:11434/v1`.

## Features

- Runs entirely offline with the built-in local provider
- Chat with GGUF models via node-llama-cpp (Qwen 2.5, Llama 3.2, Phi-3, Mistral 7B)
- Ollama support for models that support tool calling
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

### Arch

```bash
sudo pacman -S grim
```

### Ubuntu / Debian

```bash
sudo apt-get install grim
```

## Vision Model

Downloads automatically on first launch (~950 MB, cached at `~/.cache/icanhelp/transformers/`). Uses local ONNX inference, no API calls or token needed.

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
