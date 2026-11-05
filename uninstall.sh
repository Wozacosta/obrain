#!/bin/bash
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
command -v node &>/dev/null || { echo "obrain needs Node.js 20.12+: https://nodejs.org"; exit 1; }
[ -d "$HERE/node_modules" ] || (cd "$HERE" && npm install --omit=dev --silent) || exit 1
exec node "$HERE/bin/obrain.js" uninstall "$@"
