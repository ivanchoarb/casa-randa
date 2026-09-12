#!/bin/bash
# Run the installed Claude Code from the repository root.
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

if command -v claude >/dev/null 2>&1; then
  exec claude "$@"
fi

if [[ -x "$HOME/.local/bin/claude" ]]; then
  exec "$HOME/.local/bin/claude" "$@"
fi

# Claude Desktop bundles a CLI; discover its newest installed version.
claude_root="$HOME/Library/Application Support/Claude/claude-code"
claude_version=""
if [[ -d "$claude_root" ]]; then
  while IFS= read -r version; do
    if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] &&
       [[ -x "$claude_root/$version/claude.app/Contents/MacOS/claude" ]]; then
      claude_version="$version"
      break
    fi
  done < <(ls -1 "$claude_root" | sort -t. -k1,1nr -k2,2nr -k3,3nr)
fi

if [[ -n "$claude_version" ]]; then
  exec "$claude_root/$claude_version/claude.app/Contents/MacOS/claude" "$@"
fi

printf '%s\n' 'No se encontró Claude Code. Instalación oficial: https://code.claude.com/docs/en/quickstart' >&2
exit 127
