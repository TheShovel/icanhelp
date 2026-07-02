# icanhelp — Linux AI Desktop Assistant

## Plan

### 1. Overview

A frameless, transparent, always-on-top Electron app that renders an animated AI assistant overlay. Clicking it opens a chat panel where you ask questions or give tasks. The assistant has tools to run bash commands, read/write files, and perform actions on your Linux desktop. It's movable, customizable, and integrates with an LLM backend.

---

### 2. Tech Stack

| Layer          | Choice                          | Rationale                          |
|----------------|---------------------------------|------------------------------------|
| Desktop Shell  | Electron                        | Cross-platform, access to system   |
| UI             | HTML / CSS / Vanilla JS         | No framework overhead for overlay  |
| Backend Logic  | Node.js (main process)          | Direct system access via child_process |
| LLM Integration| OpenRouter / Ollama / OpenAI    | Configurable backend               |
| IPC            | Electron IPC (contextBridge)    | Secure renderer ↔ main comms       |
| Build          | electron-builder                | Packaging for Linux                |

---

### 3. Architecture

```
┌──────────────────────────────────────────────────┐
│                   Linux Desktop                   │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │           Electron Main Process              │ │
│  │                                              │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  │ │
│  │  │ Window   │  │ Tool Exec │  │ LLM      │  │ │
│  │  │ Manager  │  │ (bash,    │  │ Client   │  │ │
│  │  │          │  │  fs, etc) │  │          │  │ │
│  │  └──────────┘  └───────────┘  └──────────┘  │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                         │ IPC                      │
│  ┌──────────────────────────────────────────────┐ │
│  │           Electron Renderer Process          │ │
│  │  (Transparent, frameless, always-on-top)     │ │
│  │                                              │ │
│  │  ┌─────────────────┐  ┌──────────────────┐   │ │
│  │  │ Assistant Avatar │  │ Chat Panel       │   │ │
│  │  │ (always visible) │  │ (toggle on click) │   │ │
│  │  └─────────────────┘  └──────────────────┘   │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

---

### 4. Phases (Incremental Build)

#### Phase 1 — Electron Shell & Transparent Overlay

**Goal:** A frameless, transparent Electron window pinned on top of everything that shows a simple assistant icon.

Files:
- `package.json` — project config, scripts, dependencies
- `src/main/main.js` — Electron main process
- `src/main/preload.js` — secure context bridge
- `src/renderer/index.html` — overlay HTML
- `src/renderer/style.css` — frameless transparent styles
- `src/renderer/renderer.js` — overlay logic

Deliverable:
- Window has no chrome, transparent background, `alwaysOnTop: true`
- Shows a small circular avatar (e.g. a pulsing dot or emoji) in the bottom-right corner
- Can be dragged around the screen by clicking and dragging the avatar
- Clicking the avatar shows a hidden chat panel

---

#### Phase 2 — Click-to-Ask Chat Panel

**Goal:** Click the assistant → chat panel slides open → type a question → get a response.

Files:
- `src/renderer/index.html` — add chat panel markup
- `src/renderer/style.css` — chat panel styles
- `src/renderer/renderer.js` — chat toggling, message rendering, Enter-to-send

Deliverable:
- Single text input at bottom, message list above
- Messages appear in a bubble layout (user right, assistant left)
- Chat panel is resizable/draggable
- Pressing Escape closes the panel

---

#### Phase 3 — LLM Integration

**Goal:** Connect the chat to an LLM so the assistant actually answers questions.

Files:
- `src/main/llm.js` — LLM client module (OpenRouter first, fallback configurable)
- `src/main/preload.js` — expose `askLLM` to renderer
- `src/renderer/renderer.js` — wire send button to IPC call
- `.env` — API key configuration (gitignored)

Deliverable:
- Typing a question sends it to the LLM via the main process
- Response streams or appears in the chat
- Configurable provider (OpenRouter, OpenAI, Ollama local)
- Model name configurable in settings

---

#### Phase 4 — Tool Execution (Bash & File System)

**Goal:** The LLM can invoke tools — run bash commands, read/write files, list directories — through structured function calling.

Files:
- `src/main/tools/registry.js` — tool registry + dispatch
- `src/main/tools/bash.js` — execute shell commands (with safety limits)
- `src/main/tools/fs.js` — read, write, list files
- `src/main/tools/tool_schemas.js` — JSON schemas for LLM tool definitions
- `src/main/llm.js` — add tool-calling loop (LLM responds with tool call → execute → feed back)
- `src/main/preload.js` — expose relevant APIs if needed

Deliverable:
- The LLM can decide to run a bash command, see its output, and respond based on it
- Commands are sandboxed: timeout, max output size, allowlist/denylist configured
- User is prompted before dangerous commands (sudo, rm -rf, etc.) — configurable

Tool schema examples:
```json
{
  "name": "run_bash",
  "description": "Execute a bash command on the user's Linux system",
  "parameters": {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "The bash command to run" }
    },
    "required": ["command"]
  }
}
```

---

#### Phase 5 — Dragging & Customization

**Goal:** Move the assistant anywhere, customize appearance, persist preferences.

Files:
- `src/renderer/renderer.js` — drag-to-move with local position persistence
- `src/main/store.js` — electron-store for persistent settings
- `src/renderer/style.css` — CSS custom properties for theming
- Settings UI (inline in the chat panel)

Deliverable:
- Drag the assistant by its avatar to reposition it
- Position persists across restarts (saved to disk)
- Right-click menu: settings, quit
- Settings panel: change assistant name, avatar emoji, LLM endpoint, model
- Theme: light/dark, transparency level

---

#### Phase 6 — Task Mode & Autonomy

**Goal:** The assistant can perform multi-step tasks autonomously — browse files, install packages, run scripts, etc. — while reporting progress.

Files:
- `src/main/task/task_manager.js` — orchestrate multi-step workflows
- `src/main/tools/screenshot.js` — take screen captures (for visual context)
- `src/main/tools/notify.js` — send desktop notifications
- `src/renderer/renderer.js` — show task progress (stepped UI, streaming logs)

Deliverable:
- "Install Node.js and set up a project" → assistant plans steps, executes them, reports results
- Progress indicators per step
- User can cancel a running task
- Confirmation prompts for destructive actions

---

#### Phase 7 — Polish & Packaging

**Goal:** Production-ready packaging, auto-start, tray icon.

Files:
- `build/` — electron-builder config
- `src/main/tray.js` — system tray icon
- `src/main/autostart.js` — autostart on login

Deliverable:
- Packaged as `.AppImage` / `.deb` / `.rpm`
- System tray icon with quick actions
- Option to start on login
- Clean install/uninstall

---

### 5. Safety & Guardrails

| Concern            | Mitigation                                              |
|--------------------|---------------------------------------------------------|
| Dangerous commands | Prompt user for sudo, rm -rf, dd, mkfs, etc.           |
| Infinite loops     | Tool call limit per turn (e.g. 25 max)                 |
| Bash timeouts      | All commands get a timeout (default 30s)               |
| Output floods      | Max output truncation (e.g. 100KB)                     |
| API keys           | Stored in `.env` / config file, never logged            |
| Privacy            | Chat logs stored locally; user can clear them           |

---

### 6. Filesystem Layout

```
icanhelp/
├── package.json
├── .env                          # API keys (gitignored)
├── .gitignore
├── PLAN.md                       # this file
├── README.md
├── src/
│   ├── main/
│   │   ├── main.js               # Electron entry
│   │   ├── preload.js            # contextBridge
│   │   ├── llm.js                # LLM client
│   │   ├── store.js              # Persistence
│   │   ├── tray.js               # System tray
│   │   └── tools/
│   │       ├── registry.js       # Tool registry
│   │       ├── bash.js           # Bash execution
│   │       ├── fs.js             # File system tools
│   │       ├── schemas.js        # Tool JSON schemas
│   │       ├── screenshot.js     # Screen capture
│   │       └── notify.js         # Desktop notifications
│   └── renderer/
│       ├── index.html            # Overlay + chat UI
│       ├── style.css             # All styles
│       └── renderer.js           # All renderer logic
├── assets/
│   └── icon.png                  # App icon
└── build/
    └── electron-builder.yml      # Packaging config
```

---

### 7. Execution Order

| # | Phase                     | Est. Time | What to test                                  |
|---|---------------------------|-----------|-----------------------------------------------|
| 1 | Electron Shell + Overlay | ~20 min   | Window appears, transparent, always-on-top, draggable |
| 2 | Chat Panel                | ~15 min   | Click opens chat, type + send works           |
| 3 | LLM Integration           | ~20 min   | Ask a question, get an answer via LLM         |
| 4 | Tool Execution            | ~25 min   | "List files in ~" → bash runs, output shown   |
| 5 | Dragging & Customization  | ~15 min   | Move it, change settings, restart preserves   |
| 6 | Task Mode                 | ~20 min   | Multi-step task runs, progress shown          |
| 7 | Polish & Packaging        | ~15 min   | AppImage built, tray icon works               |

**Total estimated build time: ~2 hours** (with testing between phases).

---

### 8. How We'll Work

1. I complete **one phase** — write all the code, config, and assets.
2. You **test it** — run `npm start` or the appropriate command.
3. If it works, you say **"continue"** and I move to the next phase.
4. If something is broken, I fix it before moving on.
5. Repeat until all 7 phases are done.

---

**Ready to start? Confirm the plan and I'll begin Phase 1.**
