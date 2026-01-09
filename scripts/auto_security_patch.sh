#!/bin/bash
set -e

# Project Root Directory (assumes script is in /scripts)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$PROJECT_DIR/src"

echo "=========================================="
echo "Starting Auto Security Patch"
echo "Date: $(date)"
echo "Target: $SRC_DIR"
echo "=========================================="

# 1. Run npm audit fix using a temporary Node.js container
#    This ensures we use the same Node version as the project and don't need local Node installed.
#    We mount the 'src' directory where package.json resides.
echo "[INFO] Running npm audit fix..."

docker run --rm \
  -v "$SRC_DIR":/app \
  -w /app \
  node:20-alpine \
  /bin/sh -c "npm audit fix --force"

# Note: --force is used to automated fixing of breaking changes if possible. 
# Remove --force if you want to be safer.

if [ $? -eq 0 ]; then
    echo "[INFO] Audit fix completed successfully."
else
    echo "[ERROR] npm audit fix failed."
    exit 1
fi

echo "=========================================="
echo "[SUCCESS] Patches applied to source code."
echo "To apply changes to the running application, please run:"
echo "  docker-compose -f docker-compose.prod.yml up -d --build"
echo "=========================================="
