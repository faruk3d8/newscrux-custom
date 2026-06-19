#!/usr/bin/env bash
# Mac'ten Pi'ye kod güncelleme. .env ve data/ korunur.
set -euo pipefail

# Örnek: ./scripts/deploy-to-pi.sh pi@raspberrypi.local
PI="${1:?Kullanım: $0 kullanici@host (ör. pi@raspberrypi.local)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Kaynak: ${SRC}"
echo "Hedef:  ${PI}:~/newscrux-custom/"
echo ""

echo "→ SSH bağlantı testi..."
if ! ssh -o ConnectTimeout=8 "${PI}" 'echo "SSH OK — $(hostname)"'; then
  echo ""
  echo "SSH başarısız. Kontrol listesi:"
  echo "  1. Pi açık mı? (LED / ekran)"
  echo "  2. Mac ve Pi aynı Wi‑Fi/LAN'da mı?"
  echo "  3. IP doğru mu? Pi'de: hostname -I"
  echo "  4. SSH açık mı? Pi'de: sudo systemctl status ssh"
  echo "  5. Farklı hedef ile dene: $0 kullanici@YENI_HOST"
  exit 1
fi

echo ""
echo "→ rsync (node_modules, dist, .env, data hariç)..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude data \
  --exclude .git \
  --exclude personal \
  "${SRC}/" "${PI}:~/newscrux-custom/"

echo ""
echo "→ Pi'de build + servis yeniden başlat..."
ssh "${PI}" 'set -e
  cd ~/newscrux-custom
  if [[ ! -f .env ]]; then
    echo "UYARI: ~/newscrux-custom/.env yok. cp .env.example .env yapıp doldur."
    exit 1
  fi
  npm install
  npm run build
  if [[ ! -f dist/index.js ]] || [[ ! -f dist/telegram-bot.js ]]; then
    echo "HATA: build tamamlanmadı — dist/index.js veya dist/telegram-bot.js eksik."
    exit 1
  fi
  echo "Build OK."
  if [[ -f newscrux.service ]]; then
    mkdir -p ~/.config/systemd/user
    cp newscrux.service ~/.config/systemd/user/newscrux.service
    systemctl --user daemon-reload
    if grep -qE '\''--lang=(en|tr)'\'' ~/.config/systemd/user/newscrux.service 2>/dev/null; then
      echo "UYARI: systemd unit hâlâ --lang= içeriyor; dil her restart'\''ta CLI ile ezilir."
      echo "       ExecStart satırından --lang=... kaldırın (repo newscrux.service güncel)."
    fi
  fi
  if systemctl --user cat newscrux.service >/dev/null 2>&1; then
    systemctl --user restart newscrux
  else
    echo "→ newscrux.service yok, kuruluyor..."
    bash scripts/install-systemd.sh
  fi
  sleep 2
  systemctl --user status newscrux --no-pager -l || true
'

echo ""
echo "Bitti. Log: ssh ${PI} 'tail -f ~/newscrux-custom/data/service.log'"
echo "Teşhis: ssh ${PI} 'cd ~/newscrux-custom && bash scripts/diagnose-telegram.sh'"
