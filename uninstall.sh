#!/usr/bin/env bash
set -euo pipefail

echo "Uninstalling figma-cli..."

npm unlink -g figma-cli

echo ""
echo "Done! figma-cli has been removed from your system."
