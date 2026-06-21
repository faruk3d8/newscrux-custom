#!/usr/bin/env bash
# Pi'de Telegram / servis sorun giderme (token değerlerini ekrana basmaz).
set -euo pipefail

REPO="${HOME}/newscrux-custom"
LOG_FILE="${REPO}/data/service.log"
cd "${REPO}"

echo "=== newscrux servis ==="
systemctl --user status newscrux.service -l --no-pager 2>/dev/null | head -20 || true
echo "active: $(systemctl --user is-active newscrux.service 2>/dev/null || echo unknown)"

echo ""
echo "=== .env (maskeli) ==="
if [[ -f .env ]]; then
  grep -E '^TELEGRAM_|^OPENROUTER_|^STARTUP_NOTIFY|^THREED_COMMAND' .env | sed -E \
    's/(TELEGRAM_BOT_TOKEN=).*/\1***set***/; s/(OPENROUTER_API_KEY=).*/\1***set***/; s/(TELEGRAM_CHAT_ID=).*/\1***/' \
    || true
else
  echo "UYARI: .env yok — servis validateConfig ile çıkar (exit 1)"
fi

echo ""
echo "=== build ==="
if [[ -f dist/index.js ]]; then
  echo "dist/index.js OK ($(wc -c < dist/index.js) bytes)"
else
  echo "HATA: dist/index.js yok — npm run build"
fi
if [[ -f dist/telegram-bot.js ]]; then
  echo "dist/telegram-bot.js OK"
  if grep -q 'pollnow\|pollNow' dist/telegram-bot.js 2>/dev/null; then
    echo "Manuel poll komutu (/pollnow): dist güncel görünüyor"
  fi
  echo "dist/telegram-bot.js mtime: $(stat -c '%y' dist/telegram-bot.js 2>/dev/null || stat -f '%Sm' dist/telegram-bot.js 2>/dev/null || echo '?')"
else
  echo "HATA: dist/telegram-bot.js yok — npm run build"
fi
if [[ -f dist/build-info.json ]]; then
  echo "build-info: $(grep -E '"version"|"builtAt"' dist/build-info.json 2>/dev/null | tr '\n' ' ' || cat dist/build-info.json 2>/dev/null | head -c 120)"
fi
echo "node: $(command -v node) $(node -v 2>/dev/null || echo '?')"

echo ""
echo "=== çalışan node süreçleri ==="
pgrep -af 'newscrux/dist/index.js' || echo "(yok)"

echo ""
echo "=== service.log (son 60 satır) ==="
if [[ -f "${LOG_FILE}" ]]; then
  tail -n 60 "${LOG_FILE}"
  if tail -n 15 "${LOG_FILE}" | grep -q 'Telegram bot listener started'; then
    echo ""
    echo "→ Son başlangıç logunda bot dinleyicisi görünüyor"
  fi
else
  echo "(henüz yok — servisi güncelle: ./scripts/install-systemd.sh)"
fi

echo ""
echo "=== journalctl (varsa) ==="
journalctl --user -u newscrux -n 30 --no-pager 2>/dev/null \
  | grep -v '^-- No entries' \
  || echo "(user journal yok — service.log kullanın)"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
  missing=()
  [[ -z "${OPENROUTER_API_KEY:-}" ]] && missing+=("OPENROUTER_API_KEY")
  [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]] && missing+=("TELEGRAM_BOT_TOKEN")
  [[ -z "${TELEGRAM_CHAT_ID:-}" ]] && missing+=("TELEGRAM_CHAT_ID")
  if ((${#missing[@]})); then
    echo ""
    echo "=== eksik env ==="
    printf '  - %s\n' "${missing[@]}"
  fi
  if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    echo ""
    echo "=== getMe (bot kimliği) ==="
    curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | head -c 400
    echo ""
    echo ""
    echo "=== deleteWebhook (temiz başlangıç) ==="
    curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" | head -c 200
    echo ""
  fi
fi

echo ""
echo "=== elle test (servisi durdurur) ==="
echo "  systemctl --user stop newscrux"
echo "  cd ~/newscrux-custom && node dist/index.js --lang=en"
echo ""
echo "Log izle: tail -f ${LOG_FILE}"
