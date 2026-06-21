#!/usr/bin/env bash
# Pi'de çalıştırın: journal olmadan ~/newscrux-custom/data/service.log'a yazar.
# Tam deploy yapmadan önce teşhis için yeterli.
set -euo pipefail

REPO="${HOME}/newscrux-custom"
UNIT="${HOME}/.config/systemd/user/newscrux.service"

mkdir -p "${REPO}/data"

if [[ -f "${REPO}/newscrux.service" ]]; then
  cp "${REPO}/newscrux.service" "${UNIT}"
else
  echo "Uyarı: ${REPO}/newscrux.service yok — mevcut unit dosyasını elle güncelleyin."
  exit 1
fi

systemctl --user daemon-reload
systemctl --user restart newscrux || true
sleep 2

echo ""
echo "=== durum ==="
systemctl --user status newscrux -l --no-pager | head -15 || true

echo ""
echo "=== service.log (son 40 satır) ==="
if [[ -f "${REPO}/data/service.log" ]]; then
  tail -n 40 "${REPO}/data/service.log"
else
  echo "(log henüz yok — servis bir kez daha denesin)"
  systemctl --user restart newscrux
  sleep 3
  tail -n 40 "${REPO}/data/service.log" 2>/dev/null || echo "Hâlâ log yok; elle: node dist/index.js --lang=en"
fi

echo ""
echo "İzle: tail -f ${REPO}/data/service.log"
