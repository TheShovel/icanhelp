# icanhelp

Linux desktop AI assistant that runs as a transparent overlay, answers questions, executes commands, analyzes images, and searches the web.

## Requirements

- **Node.js** 20+
- **npm** 
- **Python 3**
- **Electron** (installed via npm)

## Install

```bash
git clone https://github.com/yourname/icanhelp.git
cd icanhelp
npm install
```

## Configure

On first launch the setup panel appears. Fill in your LLM provider:

- **OpenCode** `https://opencode.ai/zen/go/v1` + API key (recommended)
- **OpenRouter** `https://openrouter.ai/api/v1` + API key
- **OpenAI** `https://api.openai.com/v1` + API key
- **Ollama** `http://localhost:11434/v1` (no key needed; model must support tool calling)

Then select a model and save.

## Run

```bash
npm start
```

The buddy icon appears in the bottom-right corner. Click it to open chat.

## Features

- Chat with any LLM via OpenCode, OpenRouter, OpenAI, or Ollama
- File attachments: images get OCR + vision description automatically
- Screenshot capture: attaches a screenshot of your desktop
- Bash command execution with sudo support
- Web search
- Theme system: AI can create, save, and apply CSS themes
- Vision model: local BLIP image captioning, no API needed

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

If none are installed, the app prompts you to install `imagemagick` with your sudo password.

## Vision Model

Downloads automatically on first launch (~950 MB, cached at `~/.cache/icanhelp/transformers/`). Uses local ONNX inference, no API calls or token needed.

## Files

- Config: `~/.config/icanhelp/config.enc` (encrypted)
- Vision model cache: `~/.cache/icanhelp/transformers/`
- Logs: `~/.cache/icanhelp/vision.log`, `ocr.log`

## Dev

```bash
ELECTRON_DEV=true npm start  # opens DevTools
```
