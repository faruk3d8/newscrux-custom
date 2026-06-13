#!/usr/bin/env bash
# Raspberry Pi: systemd user servisi kurulumu (SSH kapalıyken de çalışır)
set -euo pipefail

REPO_DIR="${HOME}/newscrux"
SERVICE_NAME="newscrux.service"
USER_UNIT_DIR="${HOME}/.config/systemd/user"

if [[ ! -d "${REPO_DIR}" ]]; then
  echo "Hata: ${REPO_DIR} bulunamadı."
  exit 1
fi

if [[ ! -f "${REPO_DIR}/dist/index.js" ]]; then
  echo "Hata: dist/index.js yok. Önce: cd ${REPO_DIR} && npm run build"
  exit 1
fi

mkdir -p "${USER_UNIT_DIR}"
cp "${REPO_DIR}/${SERVICE_NAME}" "${USER_UNIT_DIR}/"

if [[ -f "${REPO_DIR}/.env" ]]; then
  chmod 600 "${REPO_DIR}/.env"
  echo ".env izinleri 600 yapıldı"
fi

systemctl --user daemon-reload
systemctl --user enable "${SERVICE_NAME}"
systemctl --user restart "${SERVICE_NAME}"

# Oturum kapalı / SSH yokken de servisin çalışması için
loginctl enable-linger "$(whoami)"

echo ""
echo "Kurulum tamam."
echo "  Durum:  systemctl --user status ${SERVICE_NAME}"
echo "  Log:    journalctl --user -u ${SERVICE_NAME} -f"
echo "  Yeniden başlat: systemctl --user restart ${SERVICE_NAME}"
