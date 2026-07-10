# icanhelp

<div align="center">
  <img src="https://img.shields.io/github/languages/top/TheShovel/icanhelp?style=flat-square&logo=javascript&label=language" alt="Language">&nbsp;&nbsp;
  <img src="https://img.shields.io/github/license/TheShovel/icanhelp?style=flat-square" alt="License">&nbsp;&nbsp;
  <img src="https://img.shields.io/github/last-commit/TheShovel/icanhelp?style=flat-square&logo=git" alt="Last Commit">
</div>

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

- Runs mostly offline
- Model download manager
- File attachments
- Screenshot capture
- Bash command execution
- Web search
- Knowledge base
- Theme system
- Vision model

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

## Build

Build distributable packages for Linux:

```bash
npm run build              # all targets (deb, AppImage, dir)
npm run build:deb          # deb only
npm run build:appimage     # AppImage only
npm run build:dir          # unpacked directory only
```

Artifacts are written to `dist/`.

- **deb** - Debian/Ubuntu package
- **AppImage** - portable self-contained executable
- **dir** - unpacked directory for direct use or further packaging

Icons are auto-generated from the avatar artwork on first build.

## Dev

```bash
ELECTRON_DEV=true npm start  # opens DevTools
```
