#!/usr/bin/env bash
# publish.sh — Build and push HomeCraft Docker images to Docker Hub
# Usage: ./publish.sh <semantic-version>
#   e.g. ./publish.sh 1.0.0
#        ./publish.sh 1.2.3-beta.1

set -euo pipefail

DOCKER_USER="pradeepravi"
API_IMAGE="${DOCKER_USER}/homecraft-api"
WEB_IMAGE="${DOCKER_USER}/homecraft-web"

# ── Validate version argument ─────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Error: version required."
  echo "Usage: $0 <semantic-version>   e.g. $0 1.0.0"
  exit 1
fi

VERSION="$1"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9._-]+)?$ ]]; then
  echo "Error: '${VERSION}' is not a valid semantic version (e.g. 1.0.0 or 1.2.3-beta.1)."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Docker login check ────────────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker daemon is not running."
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          HomeCraft — Docker Publish Script         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Version : ${VERSION}"
echo "  API     : ${API_IMAGE}:${VERSION}"
echo "  Web     : ${WEB_IMAGE}:${VERSION}"
echo ""

# ── Build backend ─────────────────────────────────────────────────────────────
echo "▶ Building backend image..."
docker build \
  --platform linux/amd64 \
  -t "${API_IMAGE}:${VERSION}" \
  -t "${API_IMAGE}:latest" \
  "${SCRIPT_DIR}/backend"

echo "  ✓ Backend built"

# ── Build frontend ────────────────────────────────────────────────────────────
echo ""
echo "▶ Building frontend image..."
docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_URL=/api \
  -t "${WEB_IMAGE}:${VERSION}" \
  -t "${WEB_IMAGE}:latest" \
  "${SCRIPT_DIR}/frontend"

echo "  ✓ Frontend built"

# ── Push images ───────────────────────────────────────────────────────────────
echo ""
echo "▶ Pushing images to Docker Hub..."

docker push "${API_IMAGE}:${VERSION}"
docker push "${API_IMAGE}:latest"
echo "  ✓ Pushed ${API_IMAGE}:${VERSION}"

docker push "${WEB_IMAGE}:${VERSION}"
docker push "${WEB_IMAGE}:latest"
echo "  ✓ Pushed ${WEB_IMAGE}:${VERSION}"

echo ""
echo "✅  Done! Images published:"
echo "    ${API_IMAGE}:${VERSION}"
echo "    ${WEB_IMAGE}:${VERSION}"
echo ""
