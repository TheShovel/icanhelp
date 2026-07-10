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

# ── helpers ──────────────────────────────────────────────────────
log()     { printf "${GRAY}  ◆${RST} %s\n" "$*"; }
ok()      { printf "${GREEN}  ✔${RST} %s\n" "$*"; }
warn()    { printf "${YELLOW}  ⚠${RST} %s\n" "$*" >&2; }
fail()    { printf "${RED}  ✘${RST} %s\n" "$*" >&2; exit 1; }
heading() { printf "\n${BOLD}${BLUE}▸ %s${RST}\n" "$*"; }
sub()     { printf "${DIM}    %s${RST}\n" "$*"; }

# spinner — runs a command with a simple frame spinner
# all output is hidden; on failure it's dumped to stderr
spinner() {
  local label="$1"
  local cmd="$2"
  local pid="" frame=0 logf
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

  logf="$(mktemp)"
  printf "  ${CYAN}%s${RST} ${DIM}%s${RST}" "${frames[0]}" "$label"
  eval "$cmd" >"$logf" 2>&1 &
  pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}%s${RST} ${DIM}%s${RST}" "${frames[frame]}" "$label"
    ((frame = (frame + 1) % ${#frames[@]}))
    sleep 0.08
  done

  wait "$pid"
  local rc=$?
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

if [ ${#missing[@]} -gt 0 ]; then
  for cmd in "${missing[@]}"; do fail "Missing required dependency: ${BOLD}$cmd${RST}"; done
  exit 1
fi

ok "Node.js  $(node --version 2>/dev/null || echo '?')"
ok "npm      $(npm --version  2>/dev/null || echo '?')"
ok "git      $(git --version 2>/dev/null | head -1 | sed 's/git version //' || echo '?')"
ok "rsync    $(rsync --version 2>/dev/null | head -1 | sed 's/.*version //' | cut -d' ' -f1 || echo '?')"

# ── download ─────────────────────────────────────────────────────
heading "Downloading"

rm -rf "$CLONE_DIR"
spinner "Cloning repository …" "git clone --depth=1 '$REPO' '$CLONE_DIR'"
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
spinner "Installing dependencies …" "npm install --ignore-scripts=false --no-audit --no-fund"
ok "Dependencies installed"

log "Creating launcher script …"
mkdir -p "$(dirname "$LAUNCHER")"
cat > "$LAUNCHER" << 'LAUNCHEREOF'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
exec npx electron . "$@"
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
