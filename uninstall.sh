#!/bin/bash

# =============================================================================
#  obrain — uninstaller
# =============================================================================

OK='\033[0;32m'
WARN='\033[0;33m'
ERR='\033[0;31m'
ACC='\033[0;36m'
HI='\033[1;37m'
DM='\033[2m'
RS='\033[0m'

echo ""
echo -e "${ERR}"
cat << 'ART'
             _               _
   ___ | |__  _ __ __ _(_)_ __
  / _ \| '_ \| '__/ _` | | '_ \   REMOVE
 | (_) | |_) | | | (_| | | | | |
  \___/|_.__/|_|  \__,_|_|_| |_|
ART
echo -e "${RS}"
echo -e "  ${DM}Removes obrain components. Your notes are safe unless you say otherwise.${RS}"
echo ""

# ── locate brain ─────────────────────────────────────────────────────────────
FALLBACK="$HOME/obrain"
echo -e "  Where is your brain?"
echo -e "  ${DM}Enter for default: $FALLBACK${RS}"
read -rp "  Path: " BD
BD="${BD:-$FALLBACK}"
BD="${BD/#\~/$HOME}"
echo ""

# ── 1. global skills ────────────────────────────────────────────────────────
echo -e "${HI}[1/3] Global skills${RS}"
GS="$HOME/.claude/skills"
ct=0
for s in brain-setup morning weekly recap todo digest import-vault; do
  [ -d "$GS/$s" ] && rm -rf "$GS/$s" && ((ct++))
done
[ "$ct" -gt 0 ] && echo -e "  ${OK}+${RS} Removed $ct skills from ~/.claude/skills/" \
                 || echo -e "  ${DM}- nothing to remove${RS}"

# ── 2. brain folder ─────────────────────────────────────────────────────────
echo ""
echo -e "${HI}[2/3] Brain folder${RS}"
if [ -d "$BD" ]; then
  echo ""
  echo -e "  What to do with ${ACC}$BD${RS}?"
  echo ""
  echo -e "  ${ACC}1${RS}  Remove scaffolding only (.claude/, CLAUDE.md, memory.md, todo.md)"
  echo -e "     ${DM}Keeps all your notes${RS}"
  echo ""
  echo -e "  ${ACC}2${RS}  Delete everything"
  echo -e "     ${ERR}Notes will be gone${RS}"
  echo ""
  echo -e "  ${ACC}3${RS}  Skip"
  echo ""
  read -rp "  Choice [1/2/3]: " pick

  case "$pick" in
    1)
      # restore original CLAUDE.md if backup exists
      BACKUP=$(ls -t "$BD"/CLAUDE.md.bak-* 2>/dev/null | head -1)
      if [ -n "$BACKUP" ]; then
        mv "$BACKUP" "$BD/CLAUDE.md"
        rm -f "$BD"/CLAUDE.md.bak-* 2>/dev/null
        echo -e "  ${OK}+${RS} Restored original CLAUDE.md"
      else
        rm -f "$BD/CLAUDE.md"
      fi
      rm -rf "$BD/.claude"
      rm -f "$BD/memory.md" "$BD/todo.md"
      echo -e "  ${OK}+${RS} Scaffolding removed — notes untouched"
      ;;
    2)
      read -rp "  Type DELETE to confirm: " conf
      if [ "$conf" = "DELETE" ]; then
        rm -rf "$BD"
        echo -e "  ${OK}+${RS} Deleted $BD"
      else
        echo -e "  ${DM}- skipped${RS}"
      fi
      ;;
    *)
      echo -e "  ${DM}- skipped${RS}"
      ;;
  esac
else
  echo -e "  ${DM}- no brain at $BD${RS}"
fi

# ── 4. apps ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${HI}[3/3] Apps (optional)${RS}"
echo ""

if [ -d "/Applications/Obsidian.app" ] || brew list --cask obsidian &>/dev/null 2>&1; then
  read -rp "  Remove Obsidian? [y/N]: " a
  if [[ "$a" =~ ^[Yy] ]]; then
    brew list --cask obsidian &>/dev/null 2>&1 && brew uninstall --cask obsidian || rm -rf "/Applications/Obsidian.app"
    echo -e "  ${OK}+${RS} Obsidian removed"
  fi
fi

if command -v claude &>/dev/null; then
  read -rp "  Remove Claude Code? [y/N]: " a
  if [[ "$a" =~ ^[Yy] ]]; then
    npm list -g @anthropic-ai/claude-code &>/dev/null 2>&1 && npm uninstall -g @anthropic-ai/claude-code \
      || echo -e "  ${WARN}! Can't auto-remove. Try: npm uninstall -g @anthropic-ai/claude-code${RS}"
  fi
fi

echo ""
echo -e "  ${OK}Done.${RS} obrain removed."
echo -e "  ${DM}Your brain is on its own now. Good luck out there.${RS}"
echo ""
