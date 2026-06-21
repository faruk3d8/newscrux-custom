#!/usr/bin/env bash
# Servisi durdurup hatayı terminalde göster (Pi debug).
set -euo pipefail

REPO="${HOME}/newscrux-custom"
cd "${REPO}"
mkdir -p data

echo "Servis durduruluyor..."
systemctl --user stop newscrux.service 2>/dev/null || true
sleep 1
pgrep -af 'newscrux/dist/index.js' && echo "UYARI: hâlâ çalışan süreç var" || true

echo ""
echo "Ön planda başlatılıyor (Ctrl+C ile çık)..."
echo "Çıktı ayrıca: data/foreground.log"
echo ""

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
fi

exec node dist/index.js --lang=en 2>&1 | tee -a data/foreground.log
