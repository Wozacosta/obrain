#!/bin/bash
set -e

# =============================================================================
#  obrain setup — hooks Obsidian into Claude Code
# =============================================================================

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── colors ───────────────────────────────────────────────────────────────────
B='\033[1m'       D='\033[2m'       R='\033[0m'
OK='\033[0;32m'   WARN='\033[0;33m' ERR='\033[0;31m'
ACC='\033[0;36m'  HI='\033[1;37m'

dot()  { echo -e "  ${OK}+${R} $1"; }
nah()  { echo -e "  ${D}~ $1${R}"; }
hey()  { echo -e "  ${WARN}! $1${R}"; }
nop()  { echo -e "  ${ERR}x $1${R}"; }

cp_if() { [ -f "$1" ] && cp "$1" "$2" || hey "missing: $1"; }

# ── banner ───────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${ACC}"
cat << 'ART'
         _               _
    ___ | |__  _ __ __ _(_)_ __
   / _ \| '_ \| '__/ _` | | '_ \
  | (_) | |_) | | | (_| | | | | |
   \___/|_.__/|_|  \__,_|_|_| |_|
ART
echo -e "${R}"
echo -e "  ${D}hook Obsidian into Claude Code — local, private, yours${R}"
echo ""
echo -e "  ${ACC}Obsidian${R}       markdown notes on your disk"
echo -e "  ${ACC}Claude Code${R}    reads your brain each session"
echo -e "  ${ACC}Commands${R}       /brain-setup /morning /weekly /recap /todo /digest /import-vault"
echo ""

# ── platform ─────────────────────────────────────────────────────────────────
[[ "$OSTYPE" == darwin* ]] || { hey "macOS only for now."; exit 1; }

# =============================================================================
#  1 — tools
# =============================================================================
echo -e "${HI}[1/3] Tools${R}"

command -v brew &>/dev/null && nah "Homebrew" || {
  echo "  Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  dot "Homebrew"
}

if [ -d "/Applications/Obsidian.app" ] || brew list --cask obsidian &>/dev/null 2>&1; then
  nah "Obsidian"
else
  brew install --cask obsidian && dot "Obsidian"
fi

command -v claude &>/dev/null && nah "Claude Code" || {
  curl -fsSL https://claude.ai/install.sh | sh
  dot "Claude Code — restart your terminal if 'claude' isn't found"
}

# =============================================================================
#  2 — brain directory
# =============================================================================
echo ""
echo -e "${HI}[2/3] Brain${R}"
echo -e "  ${D}Where should it live? (default: ~/obrain)${R}"
read -rp "  Path: " BD
BD="${BD:-$HOME/obrain}"
BD="${BD/#\~/$HOME}"
[ "${#BD}" -gt 1 ] && BD="${BD%/}"

# safety: don't overlap with the repo
REAL_BD="$(cd "$BD" 2>/dev/null && pwd || echo "$BD")"
REAL_HERE="$(cd "$HERE" 2>/dev/null && pwd)"
[ "$REAL_BD" = "$REAL_HERE" ] && { hey "Can't be the repo folder. Using ~/obrain."; BD="$HOME/obrain"; }
[ -e "$BD" ] && [ ! -d "$BD" ] && { nop "That's a file, not a folder."; exit 1; }

# existing content?
PRE=false; OLD_C=false
[ -d "$BD/.obsidian" ] && PRE=true
[ -f "$BD/CLAUDE.md" ] && OLD_C=true
[ -d "$BD" ] && [ -n "$(ls -A "$BD" 2>/dev/null | grep -v '^\.\(DS_Store\)$')" ] && PRE=true

if [ "$PRE" = true ]; then
  echo ""
  echo -e "  ${ACC}Found existing stuff at $BD${R}"
  echo -e "  Will add what's missing. Won't touch your notes."
  [ "$OLD_C" = true ] && echo -e "  CLAUDE.md gets backed up."
  echo ""
  read -rp "  Cool? [Y/n]: " YN; YN="${YN:-Y}"
  [[ "$YN" =~ ^[Yy] ]] || { echo "  Bailed."; exit 0; }
  [ "$OLD_C" = true ] && {
    BK="CLAUDE.md.bak-$(date +%Y%m%d-%H%M%S)"
    cp "$BD/CLAUDE.md" "$BD/$BK"
    dot "Saved CLAUDE.md as $BK"
  }
fi

# build it
mkdir -p "$BD"/{drop,daily,weekly,projects,refs,done}
mkdir -p "$BD/.claude/skills"/{brain-setup,morning,weekly,recap,todo,digest,import-vault}

cp_if "$HERE/CLAUDE.md" "$BD/CLAUDE.md"
{ [ "$PRE" = false ] || [ ! -f "$BD/memory.md" ]; } && cp_if "$HERE/memory.md" "$BD/memory.md"

CMDS=(brain-setup morning weekly recap todo digest import-vault)
for c in "${CMDS[@]}"; do
  cp_if "$HERE/skills/$c/SKILL.md" "$BD/.claude/skills/$c/SKILL.md"
done

# global install so commands work everywhere
GS="$HOME/.claude/skills"
for c in "${CMDS[@]}"; do
  mkdir -p "$GS/$c"
  cp_if "$HERE/skills/$c/SKILL.md" "$GS/$c/SKILL.md"
done

[ "$PRE" = true ] && dot "Merged into $BD" || dot "Brain created at $BD"
dot "Commands available globally"

# =============================================================================
#  3 — file import
# =============================================================================
echo ""
echo -e "${HI}[3/3] Import${R}"
echo -e "  ${D}Have files to bring in? Enter a folder path — they'll land in drop/.${R}"
echo -e "  ${D}Claude reads PDFs, docs, images directly. No extra tools.${R}"
echo ""
read -rp "  Folder (Enter to skip): " SRC

if [ -n "$SRC" ] && [ -d "$SRC" ]; then
  cp -n "$SRC"/* "$BD/drop/" 2>/dev/null || true
  CT=$(ls -1 "$BD/drop/" 2>/dev/null | wc -l | tr -d ' ')
  dot "$CT files copied to drop/"
elif [ -n "$SRC" ]; then
  hey "Not found: $SRC"
fi

# =============================================================================
#  verify
# =============================================================================
echo ""
echo -e "${HI}Status${R}"

{ [ -d "/Applications/Obsidian.app" ] || brew list --cask obsidian &>/dev/null 2>&1; } \
  && dot "Obsidian" || nop "Obsidian missing"

command -v claude &>/dev/null \
  && dot "Claude Code $(claude --version 2>/dev/null | head -1)" \
  || hey "Claude Code not in PATH yet"

[ -f "$BD/CLAUDE.md" ] && dot "Brain at $BD" || nop "Brain files missing"

SC=$(find "$BD/.claude/skills" -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
dot "$SC commands"

# =============================================================================
#  done
# =============================================================================
echo ""
[ "$PRE" = true ] && echo -e "  ${OK}Brain upgraded.${R}" || echo -e "  ${OK}Brain ready.${R}"
echo ""
echo -e "  ${HI}Where:${R} $BD"
echo ""
echo -e "  ${HI}Now:${R}"
echo -e "  1. Open Obsidian, pick $BD as your vault, enable CLI in settings"
echo -e "  2. ${D}cd \"$BD\" && claude${R}"
echo -e "  3. Run ${D}/brain-setup${R}"
echo ""
echo -e "  Got files? Drop them in ${ACC}drop/${R} and say ${D}\"digest and sort drop/\"${R}"
echo ""
echo -e "  ${D}Safe to re-run anytime.${R}"
echo ""

open -a Obsidian "$BD" 2>/dev/null || open -a Obsidian 2>/dev/null || true
