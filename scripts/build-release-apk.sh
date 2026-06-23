#!/usr/bin/env bash
# Build standalone release APK (JS bundled inside — no Metro required).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=android-env.sh
source "$SCRIPT_DIR/android-env.sh"
cd "$SCRIPT_DIR/.."

echo "Building release APK (this may take several minutes)..."
cd android
./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
OUT="../La-Romana-Pago-Movil-release.apk"
cp "$APK" "$OUT"
echo ""
echo "Done: La-Romana-Pago-Movil-release.apk"
ls -lh "$OUT"
