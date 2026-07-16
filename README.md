<div align="center">
  <img src="https://github.com/TheShovel/icanhelp/blob/website/website_assets/textLogo.png" alt="icanhelp" width="240">
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

> [!WARNING]
> This project is **Linux only**. The installer and app require a glibc-based Linux desktop environment and will not run on macOS, Windows, or musl-based systems like Alpine Linux.

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

The installer supports **x86_64** and **ARM64 (aarch64)** machines running a glibc-based Linux distro with a desktop environment. It does not work on musl-based systems like Alpine Linux, on headless/WSL setups without a desktop, or on 32-bit ARM.

## Setup

On first launch the setup panel appears. Select a model from the download list (Qwen 3.5 2B recommended).

## Features

- Runs fully offline
- Model download manager
- File attachments
- Screenshot capture
- Bash command execution
- Web search
- Theme system
- Vision model
- Word document creation (.docx)

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
- App data: `~/.local/share/icanhelp/` (models, vision model, logs)
  - Models: `~/.local/share/icanhelp/models/`
  - Vision model cache: `~/.local/share/icanhelp/transformers/`
  - Logs: `~/.local/share/icanhelp/vision.log`, `ocr.log`
