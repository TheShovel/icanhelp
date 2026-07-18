# Contributing to icanhelp

Thanks for wanting to help. icanhelp is a free, open-source Linux desktop AI assistant that runs entirely on your own hardware: no cloud, no GPU required, no account needed.

## Our stance on AI

We don't support AI-generated "art". We see AI as a practical tool meant to simplify tedious tasks and make life easier, not to replace the things we enjoy doing.

- We will **never** add features that generate images, music, or videos.
- All art in this project (buddy icons, banners, logos) is made by TheShovel and icanhelp contributors, without any generative AI tools.
- Contributions that add generative-media features will be declined.

We build AI that helps people, not AI that replaces human creativity.

Using AI assistants to write code is fine, provided a human reviews every change before submitting. We are programmers too; we can tell if you are vibe coding brah.

## Code of Conduct

Be respectful, constructive, and kind. We want this to be a welcoming space for everyone, regardless of experience level. Harassment, abuse, and spam won't be tolerated.

## How to contribute

### Reporting bugs

Open an issue on GitHub. Include:

- Your distro and architecture (`uname -m`)
- Steps to reproduce
- What you expected vs what happened
- Relevant logs from `~/.local/share/icanhelp/vision.log` or `ocr.log` if applicable

### Suggesting features

Open an issue tagged as an enhancement. Explain the use case and why it fits the project. Keep in mind:

- The app runs **fully offline**. Features depending on cloud APIs won't be accepted.
- It targets **Linux desktops only** (glibc-based, x86_64 or ARM64).
- It should work on **low-resource hardware** (CPU-only, as little as ~600 MB RAM for the model).

### Pull requests

1. **Fork and branch.** Create a branch off `main` with a short, descriptive name.
2. **Keep it focused.** One PR = one feature or fix.
3. **Write clean code.** Follow the code style below.
4. **Test your changes.** Run `npm test` and make sure existing tests pass.
5. **Don't add comments that restate the code.** See the code style section.
6. **Update relevant docs** if your change affects user-facing behavior.

### First-time setup

```bash
git clone https://github.com/TheShovel/icanhelp.git
cd icanhelp
npm install
npm start          # launch the app
npm test           # run the test suite
```

Requirements: **Node.js 20+**, npm, git. Linux with a desktop environment.

## Code style

This project follows clean, minimal code principles. Before submitting code, read these rules; they're enforced in review.

### Comments

- **Do not write comments that restate the code.** If the code is self-explanatory, leave it bare.
- Only add a comment when it explains **non-obvious intent**, **constraints**, or **tradeoffs**.
- No section-header banners (`// ======`), no obvious labels (`// DOM references`, `// State`).
- Prefer self-documenting code: clear variable names, simple logic, obvious structure.

### Styling / CSS

- Write only the styles needed for the feature to function.
- No decorative flourishes, elaborate animations, or visual effects without a clear functional purpose.
- Use simple selectors. Avoid deep nesting when a flat rule works.

### General

- A file with fewer lines is better, all else being equal.
- If a comment could be replaced by a better variable or function name, do that instead.
- Plain JavaScript only. No TypeScript.

## Project structure

```
src/
  main/           # Electron main process (backend)
    main.js       # entry point, IPC handlers, window management
    llm-local.js  # local LLM inference (node-llama-cpp)
    store.js      # config, themes, chat persistence (encrypted)
    vision.js     # local vision model (ONNX)
    model-manager.js  # model download, listing, compatibility
    tools/        # built-in tools (bash, math, docx, etc.)
  renderer/       # Electron renderer (frontend)
    index.html
    renderer.js   # UI logic
    style.css
scripts/          # build & utility scripts
  build.sh        # electron-builder wrapper (deb, AppImage, dir)
  install.sh      # one-command installer
assets/           # buddy art, icons, banners
```

## Testing

Tests use Node.js's built-in test runner:

```bash
npm test
```

This runs unit tests for the store, tools, timing, and renderer. Add tests for new functionality when practical.

## Building

```bash
npm run build          # all targets (deb, AppImage, dir)
npm run build:deb      # .deb package only
npm run build:appimage # AppImage only
npm run build:dir      # unpacked directory
```

Output lands in `dist/`.

## Design principles

When contributing, keep these in mind:

- **Offline-first.** The app must work without internet. Web search is optional, never required.
- **Low-resource.** It should run on old laptops with CPU-only inference.
- **Linux-only.** The project targets glibc-based Linux desktops. No macOS/Windows support.
- **User control.** The user owns their data, models, and config. Everything is local.
- **Privacy-respecting.** No telemetry, no analytics, no accounts.

## Questions?

Open a GitHub issue.
