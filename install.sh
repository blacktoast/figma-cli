#!/usr/bin/env bash
set -euo pipefail

echo "Installing figma-cli..."

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required (v18+). Install it first."
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "Error: npm is required."
  exit 1
fi

npm install
npm run build
npm link

echo ""
echo "Done! Run 'figma-cli --help' to get started."
echo "First time? Run 'figma-cli init' to set up your Figma API token."
