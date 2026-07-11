#!/usr/bin/env bash
# install.sh — Self-contained installer for icanhelp
# Run: curl -fsSL https://raw.githubusercontent.com/TheShovel/icanhelp/main/install.sh | bash
set -euo pipefail

# ── terminal colors ──────────────────────────────────────────────
RST='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'

# ── configurable paths ───────────────────────────────────────────
REPO="https://github.com/TheShovel/icanhelp.git"
CLONE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/icanhelp-install"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icanhelp"
APP_DIRS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor"
DESKTOP_FILE="$APP_DIRS/icanhelp.desktop"
LAUNCHER="$INSTALL_DIR/icanhelp.sh"

# ── progress bar ──────────────────────────────────────────────────
# usage: progress_bar <total> <label>
# reads lines from stdin, increments counter, draws bar
progress_bar() {
  local total=$1
  local label=$2
  local count=0
  local width=40

  # hide cursor
  printf "\033[?25l"

  while IFS= read -r line; do
    ((count++))
    local pct=0
    [ $total -gt 0 ] && pct=$(( count * 100 / total ))
    local filled=$(( count * width / total ))
    [ $filled -gt $width ] && filled=$width
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=filled; i<width; i++)); do bar+="░"; done
    printf "\r  ${CYAN}%s${RST} ${DIM}[%s]${RST} %3d%% (%d/%d)" "$label" "$bar" "$pct" "$count" "$total"
  done

  # show cursor, newline
  printf "\033[?25h\n"

  # if we didn't reach total, show completion
  if [ $count -lt $total ]; then
    printf "  ${GREEN}✓${RST} ${DIM}%s${RST} (completed %d of %d)\n" "$label" "$count" "$total"
  else
    printf "  ${GREEN}✓${RST} ${DIM}%s${RST}\n" "$label"
  fi
}

# spinner — runs a command with a live frame spinner
spinner() {
  local label="$1"
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  shift

  local logf
  logf="$(mktemp)"

  # background spinner process
  (
    local frame=0
    while true; do
      printf "\r  ${CYAN}%s${RST} ${DIM}%s${RST}" "${frames[frame]}" "$label"
      ((frame = (frame + 1) % ${#frames[@]}))
      sleep 0.08
    done
  ) &
  local spinner_pid=$!

  # foreground command, output captured
  set +e
  "$@" >"$logf" 2>&1
  local rc=$?
  set -e

  kill "$spinner_pid" 2>/dev/null || true
  wait "$spinner_pid" 2>/dev/null || true

  if [ $rc -eq 0 ]; then
    printf "\r${BOLD}${GREEN}  ✓${RST} ${DIM}%s${RST}\n" "$label"
    rm -f "$logf"
  else
    printf "\r${BOLD}${RED}  ✗${RST} ${DIM}%s${RST}\n" "$label"
    cat "$logf" >&2
    rm -f "$logf"
    return $rc
  fi
}

# run a command with a progress bar based on output lines
# usage: progress_cmd <total> <label> <command...>
progress_cmd() {
  local total=$1
  local label=$2
  shift 2

  # run command, pipe output through progress bar
  set +e
  "$@" 2>&1 | progress_bar "$total" "$label"
  local rc=${PIPESTATUS[0]}
  set -e
  return $rc
}

# progress_bar <total> <label>
# reads lines from stdin, draws progress bar
progress_bar() {
  local total=$1
  local label=$2
  local count=0
  local width=40

  # hide cursor
  printf "[?25l"

  while IFS= read -r line; do
    ((count++))
    local pct=0
    [ $total -gt 0 ] && pct=$(( count * 100 / total ))
    local filled=$(( count * width / total ))
    [ $filled -gt $width ] && filled=$width
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=filled; i<width; i++)); do bar+="░"; done
    printf "\r  ${CYAN}%s${RST} ${DIM}[%s]${RST} %3d%% (%d/%d)" "$label" "$bar" "$pct" "$count" "$total"
  done

  # show cursor, newline
  printf "[?25h
"

  # completion message
  if [ $count -lt $total ]; then
    printf "  ${GREEN}✓${RST} ${DIM}%s${RST} (completed %d of %d)
" "$label" "$count" "$total"
  else
    printf "  ${GREEN}✓${RST} ${DIM}%s${RST}
" "$label"
  fi
}

# ── helpers ──────────────────────────────────────────────────────
log()     { printf "${GRAY}  ◆${RST} %b\n" "$*"; }
ok()      { printf "${GREEN}  ✔${RST} %b\n" "$*"; }
warn()    { printf "${YELLOW}  ⚠${RST} %b\n" "$*" >&2; }
fail()    { printf "${RED}  ✘${RST} %b\n" "$*" >&2; exit 1; }
heading() { printf "\n${BOLD}${BLUE}▸ %b${RST}\n" "$*"; }
sub()     { printf "${DIM}    %b${RST}\n" "$*"; }

# ── banner ───────────────────────────────────────────────────────
clear 2>/dev/null || true
printf "${BOLD}${CYAN}"
cat << "BANNER"
   ╭──────────────────────────────────────╮
   │                                      │
   │            icanhelp                  │
   │     Linux Desktop AI Assistant       │
   │                                      │
   ╰──────────────────────────────────────╯
BANNER
printf "${RST}"

# ── check prerequisites ─────────────────────────────────────────
heading "Checking prerequisites"

missing=()
command -v node  &>/dev/null || missing+=("node")
command -v npm   &>/dev/null || missing+=("npm")
command -v git   &>/dev/null || missing+=("git")
command -v rsync &>/dev/null || missing+=("rsync")
command -v curl  &>/dev/null || missing+=("curl")
command -v unzip &>/dev/null || missing+=("unzip")

if [ ${#missing[@]} -gt 0 ]; then
  for cmd in "${missing[@]}"; do fail "Missing required dependency: ${BOLD}$cmd${RST}"; done
  exit 1
fi

ok "Node.js  $(node --version 2>/dev/null || echo '?')"
ok "npm      $(npm --version  2>/dev/null || echo '?')"
ok "git      $(git --version 2>/dev/null | head -1 | sed 's/git version //' || echo '?')"
ok "rsync    $(rsync --version 2>/dev/null | head -1 | sed 's/.*version //' | cut -d' ' -f1 || echo '?')"
ok "curl     $(curl --version 2>/dev/null | head -1 | awk '{print $2}' || echo '?')"
ok "unzip    $(unzip -v 2>/dev/null | head -1 | awk '{print $2}' || echo '?')"

# ── download ─────────────────────────────────────────────────────
heading "Downloading"

rm -rf "$CLONE_DIR"
spinner "Cloning repository …" git clone --depth=1 "$REPO" "$CLONE_DIR"
ok "Source fetched"

# ── install ──────────────────────────────────────────────────────
cd "$CLONE_DIR"
heading "Installing"

log "Copying files to ${DIM}$INSTALL_DIR${RST}"
mkdir -p "$INSTALL_DIR"
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  "$CLONE_DIR"/ "$INSTALL_DIR/"
ok "Files copied"

log "Generating application icons"
ICON_SRC="$INSTALL_DIR/assets/buddyArt/idle.png"
if [ -f "$ICON_SRC" ]; then
  mkdir -p "$INSTALL_DIR/build/icons"

  mkdir -p "$ICON_DIR/256x256/apps"
  if command -v magick &>/dev/null; then
    magick "$ICON_SRC" -resize 256x256 -background none -gravity center \
      -extent 256x256 "$ICON_DIR/256x256/apps/icanhelp.png" 2>/dev/null
  else
    cp "$ICON_SRC" "$ICON_DIR/256x256/apps/icanhelp.png"
  fi

  mkdir -p "$ICON_DIR/512x512/apps"
  if command -v magick &>/dev/null; then
    magick "$ICON_SRC" -resize 512x512 -background none -gravity center \
      -extent 512x512 "$ICON_DIR/512x512/apps/icanhelp.png" 2>/dev/null
  else
    cp "$ICON_DIR/256x256/apps/icanhelp.png" "$ICON_DIR/512x512/apps/icanhelp.png"
  fi

  cp "$ICON_DIR/512x512/apps/icanhelp.png" "$INSTALL_DIR/build/icons/icon.png"

  mkdir -p "$ICON_DIR/48x48/apps"
  if command -v magick &>/dev/null; then
    magick "$ICON_SRC" -resize 48x48 -background none -gravity center \
      -extent 48x48 "$ICON_DIR/48x48/apps/icanhelp.png" 2>/dev/null
  else
    cp "$ICON_SRC" "$ICON_DIR/48x48/apps/icanhelp.png"
  fi

  ok "Icons generated (48×48, 256×256, 512×512)"
else
  warn "Buddy art not found, skipping icons"
fi

cd "$INSTALL_DIR"
echo ""
log "Installing dependencies …"

set +e
npm install --ignore-scripts=false --no-audit --no-fund 2>&1
rc=$?
set -e
if [ $rc -ne 0 ]; then
  fail "npm install failed (exit $rc)"
fi

log "Running postinstall scripts …"

# electron: download + extract binary
# npm 11 blocks the postinstall, and extract-zip hangs on Node 26,
# so we use curl + unzip instead of Node.js tooling
ELECTRON_VER=$(node -e "console.log(require('./node_modules/electron/package.json').version)")
ELECTRON_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/electron"

case "$(uname -m)" in
  x86_64)  ELECTRON_ARCH="x64" ;;
  aarch64) ELECTRON_ARCH="arm64" ;;
  armv7l)  ELECTRON_ARCH="armv7l" ;;
  *)       fail "Unsupported architecture: $(uname -m)" ;;
esac

ELECTRON_ZIP="$ELECTRON_CACHE/electron-v${ELECTRON_VER}-linux-${ELECTRON_ARCH}.zip"
ELECTRON_DIST="node_modules/electron/dist"
ELECTRON_BIN="$ELECTRON_DIST/electron"

if [ -x "$ELECTRON_BIN" ] && [ -f node_modules/electron/path.txt ]; then
  ok "electron already installed"
else
  if [ ! -f "$ELECTRON_ZIP" ]; then
    log "Downloading electron v${ELECTRON_VER} …"
    mkdir -p "$ELECTRON_CACHE"
    set +e
    curl -fsSL \
      "https://github.com/electron/electron/releases/download/v${ELECTRON_VER}/electron-v${ELECTRON_VER}-linux-${ELECTRON_ARCH}.zip" \
      -o "$ELECTRON_ZIP" 2>&1
    rc=$?
    set -e
    if [ $rc -ne 0 ]; then
      fail "electron download failed (exit $rc)"
    fi
  fi

  log "Extracting electron …"
  set +e
  unzip -o "$ELECTRON_ZIP" -d "$ELECTRON_DIST" >/dev/null 2>&1
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    fail "electron extraction failed (exit $rc)"
  fi

  printf 'electron' > node_modules/electron/path.txt
  chmod +x "$ELECTRON_BIN"

  if [ ! -x "$ELECTRON_BIN" ]; then
    fail "electron binary not found at $ELECTRON_BIN"
  fi
  ok "electron installed"
fi

# node-llama-cpp: download native binaries
set +e
node node_modules/node-llama-cpp/dist/cli/cli.js postinstall 2>&1
rc=$?
set -e
if [ $rc -ne 0 ]; then
  warn "node-llama-cpp postinstall failed (exit $rc)"
fi

ok "Dependencies installed"

# ── ingest knowledge base ──────────────────────────────────────────
heading "Building knowledge base"
log "Counting documents …"
# Count total markdown files for progress bar
TOTAL_DOCS=$(find "$INSTALL_DIR/knowledge" -type f -name "*.md" 2>/dev/null | wc -l)
if [ "$TOTAL_DOCS" -eq 0 ]; then
  warn "No knowledge documents found"
else
  log "Embedding $TOTAL_DOCS documents …"
  warn "This can take a while the first time, depending on your hardware."
  progress_cmd "$TOTAL_DOCS" "Ingesting knowledge base …" npm run ingest
  ok "Knowledge base ready"
fi

NPM_BIN="$(command -v npm)"

log "Creating launcher script …"
mkdir -p "$(dirname "$LAUNCHER")"
cat > "$LAUNCHER" << LAUNCHEREOF
#!/usr/bin/env bash
cd "$INSTALL_DIR" || exit 1
"$NPM_BIN" start
LAUNCHEREOF
chmod +x "$LAUNCHER"
ok "Launcher created"

log "Registering system application …"
mkdir -p "$APP_DIRS"
cat > "$DESKTOP_FILE" << DESKTOPeof
[Desktop Entry]
Type=Application
Name=icanhelp
Comment=Linux desktop AI assistant
Exec=$LAUNCHER
Icon=icanhelp
Categories=Utility;
Terminal=false
StartupNotify=false
DESKTOPeof
chmod 644 "$DESKTOP_FILE"
ok "Desktop entry written"

if command -v update-desktop-database &>/dev/null; then
  update-desktop-database "$APP_DIRS" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache &>/dev/null; then
  gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true
fi
ok "System icon cache updated"

# ── cleanup ──────────────────────────────────────────────────────
rm -rf "$CLONE_DIR"

# ── done ─────────────────────────────────────────────────────────
echo ""
printf "${BOLD}${GREEN}╭──────────────────────────────────────────╮${RST}\n"
printf "${BOLD}${GREEN}│${RST}${BOLD}          Installation complete!${RST}            ${BOLD}${GREEN}│${RST}\n"
printf "${BOLD}${GREEN}╰──────────────────────────────────────────╯${RST}\n"
echo ""
printf "  ${BOLD}Installed to:${RST}\n"
printf "    ${CYAN}%s${RST}\n" "$INSTALL_DIR"
echo ""
printf "  ${BOLD}How to launch:${RST}\n"
printf "    • Open icanhelp from your system app launcher\n"
printf "    • Run  ${CYAN}%s${RST}\n" "$LAUNCHER"
echo ""
printf "  ${BOLD}Uninstall:${RST}\n"
printf "    ${GRAY}rm -rf %s${RST}\n" "$INSTALL_DIR"
printf "    ${GRAY}rm %s${RST}\n" "$DESKTOP_FILE"
echo ""
