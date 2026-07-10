# Code Editors & Vim

## Choosing an Editor
- **VS Code**: most popular — extensions, Git integration, terminal, debugging, IntelliSense
  - Pros: free, massive extension ecosystem, great JS/TS support, remote development
  - Cons: uses a lot of RAM, Microsoft telemetry
- **Neovim**: modern Vim fork — fast, terminal-based, highly configurable (Lua)
  - Pros: fast, keyboard-driven, low resource, everywhere (SSH)
  - Cons: steep learning curve, config-heavy, no built-in GUI
- **JetBrains** (IntelliJ, WebStorm, PyCharm, Goland): IDE for specific languages
  - Pros: best code analysis, refactoring, debugging in the business — smart
  - Cons: paid ($15-25/mo), heavy (RAM/CPU), slow startup
- **Sublime Text**: fast, lightweight, great for quick edits — paid ($99) but unlimited trial
- **Helix**: modal editor like Vim but easier setup, built-in LSP, kakoune-inspired
- **Zed**: new, Rust-based, fast, built-in AI, multiplayer — Mac only (for now)

## Vim Basics (survival mode)
- Modes: **Normal** (default, keyboard commands), **Insert** (typing text), **Visual** (selecting), **Command** (saving/quitting)
```
# Essential movements
h j k l      ← ↓ ↑ → (or arrow keys, but hjkl is faster)
w b          word forward/back
0 $          start/end of line
gg G         start/end of file
^f ^b        page down/up

# Insert
i            insert before cursor
a            insert after cursor
I            insert at start of line
A            insert at end of line
o            new line below and insert
O            new line above and insert

# Edit
x            delete character
dd           delete line
yy           yank (copy) line
p            paste after cursor
P            paste before cursor
u            undo
Ctrl+r       redo

# Save/quit
:w           save
:q           quit
:wq          save and quit
:q!          quit without saving
ZZ           save and quit (normal mode)
```

## Essential VS Code Keybindings
```
Ctrl+P        — file search (fast open)
Ctrl+Shift+P  — command palette
Ctrl+B        — toggle sidebar
Ctrl+`        — toggle terminal
Ctrl+D        — select word (repeat for multi-select)
Ctrl+Shift+L  — select all occurrences
Ctrl+/        — toggle comment
Alt+↑/↓       — move line up/down
Ctrl+Shift+K  — delete line
Ctrl+~        — focus terminal
F2            — rename symbol
F12           — go to definition
Ctrl+-        — go back
Ctrl+Shift+-  — go forward
Ctrl+Space    — trigger suggestion
```

## VS Code Essential Extensions
- **Prettier** — auto-format on save
- **ESLint** — JavaScript linting
- **GitLens** — Git blame, history inline
- **Error Lens** — inline error messages
- **Live Share** — collaborative editing
- **Thunder Client** — API testing (lightweight Postman)
- **GitHub Copilot** / **Tabnine** — AI autocomplete
- **Git Graph** — visual Git history
- **Markdown Preview Enhanced** — markdown preview
- **EditorConfig** — project-wide code style

## Terminal Basics
- **Ctrl+C** — interrupt (kill current command)
- **Ctrl+D** — EOF (exit shell, close file)
- **Ctrl+Z** — suspend foreground job
- **Ctrl+L** — clear screen
- **Ctrl+A** / **Ctrl+E** — start/end of line
- **Ctrl+U** — delete from cursor to start
- **Ctrl+K** — delete from cursor to end
- **Ctrl+W** — delete word backward
- **Ctrl+R** — reverse search command history
- **!!** — repeat last command
- **!$** — last argument of last command
- **Alt+.** — cycle through last arguments of previous commands

## tmux (Terminal Multiplexer)
```
tmux new -s session_name     — new session
tmux attach -t session_name  — attach
tmux ls                      — list sessions

Prefix (Ctrl+b) then:
%        — split vertical
"        — split horizontal
方向键    — navigate panes
x        — close pane
c        — new window
n/p      — next/previous window
[        — scroll mode (q to exit)
d        — detach
```

## Shell Productivity
- **aliases**: add to ~/.bashrc or ~/.zshrc
  ```bash
  alias ll='ls -la'
  alias gs='git status'
  alias gc='git commit'
  alias ..='cd ..'
  ```
- **fzf**: fuzzy finder — Ctrl+R for reverse history search, Ctrl+T for files
- **zoxide**: smart `cd` — learns your most-used directories, `z proj` jumps to /path/to/project
- **fd**: faster `find` — `fd 'pattern'`
- **bat**: `cat` with syntax highlighting
- **ripgrep (rg)**: faster `grep` — `rg 'pattern'`
- **lazygit**: terminal UI for Git
- **htop / btop**: process viewer
- **jq**: JSON query tool — `curl api | jq '.data'`
