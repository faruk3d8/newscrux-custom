!Proje ve proje sayfası düzenlenmeye devam etmektedir.

# Newscrux-Custom

> Yapay zekâ destekli haber toplayıcı: çok dilli yapılandırılmış özetler, Telegram bot kontrolü ve zamanlanmış tarama

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)
[![Languages](https://img.shields.io/badge/Languages-5-orange?style=flat)](src/i18n.ts)
[![GitHub](https://img.shields.io/badge/GitHub-faruk3d8-181717?style=flat&logo=github)](https://github.com/faruk3d8/newscrux-custom)

**Fork kaynağı:** [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux) — orijinal proje Pushover bildirimleri ve interval tabanlı zamanlama kullanır. Bu sürüm Telegram bot kontrolü, sabit saatler, 3D/CAD haber katmanı ve Raspberry Pi dağıtım araçları ekler.

---

## Ne Yapar?

Newscrux-Custom, AI/ML RSS kaynaklarını izler, makaleleri yapay zekâ ile ilgi açısından filtreler, gerekirse tam metin çıkarır, seçtiğiniz dilde yapılandırılmış özet üretir ve **Telegram** üzerinden HTML mesaj olarak iletir.

Her bildirim **ne oldu**, **neden önemli** ve **önemli bir detay** içerir — İngilizce, Türkçe, Almanca, Fransızca veya İspanyolca.

Bot komutlarıyla zamanlanmış taramayı duraklatabilir, manuel poll başlatabilir, durumu ve kredi kullanımını görebilirsiniz. İsteğe bağlı **3D/CAD AI haber katmanı** ayrı kaynaklar ve aylık bütçe sınırı ile çalışır (açıkken günlük otomatik tarama).

Varsayılan otomatik tarama (Europe/Istanbul): **12:00** ve **20:00**.

---

## Bildirim Örneği

**Türkçe (`--lang=tr`):**

```
Başlık: AGI'ye doğru ilerlemeyi ölçmek: Bilişsel bir çerçeve

📰 Google DeepMind

Ne oldu: Google DeepMind, yapay genel zeka (AGI) yolunda ilerlemeyi
değerlendirmek için bilişsel bilim temelli bir çerçeve yayınladı.

Neden önemli: Bu çerçeve, AI sistemlerinin genel zeka yeteneklerini
ortak bir temelde değerlendirmeye yardımcı olabilir.

💡 200.000 dolar ödüllü Kaggle hackathonu başlatıldı.
```

Mesajlar Telegram'da HTML biçiminde gönderilir. Bot arayüz dili `/langtr` ve `/langen` ile ayrı ayarlanabilir; özet dili `--lang` ile belirlenir.

---

## Özellikler

- 🌍 **5 dil** — `--lang` ile özet dili: `en`, `tr`, `de`, `fr`, `es`
- 🧠 **Yapılandırılmış özetler** — Ne oldu + Neden önemli + Ana detay (DeepSeek / OpenRouter)
- 📰 **RSS profilleri** — `minimal` (5 kaynak) veya `full` (13 kaynak)
- 🔍 **AI ilgi filtresi** — Düşük puanlı makaleler özetlenmeden elenir
- 📄 **Hibrit içerik çıkarma** — Önce RSS özeti, kısaysa güvenli HTTP ile tam metin
- ⚡ **Makale durum hattı** — `discovered → enriched → summarized → sent`, kalıcı kuyruk
- 🔒 **Veri kaybı yok** — Atomik kuyruk yazımı, yeniden deneme, yeniden başlatmada devam
- 📊 **Operasyon metrikleri** — Döngü istatistikleri log ve `/status` komutu
- 🤖 **Telegram bot** — Duraklat/devam, manuel poll (`/pollnow`), yetkili sohbet kilidi
- ⏰ **Saat bazlı zamanlama** — Interval yerine İstanbul saatiyle sabit saatler
- 🛡️ **SSRF koruması** — Özel IP ve güvensiz yönlendirmeler engellenir
- 🎮 **3D AI katmanı** (isteğe bağlı) — Ayrı RSS/GitHub/arXiv, aylık bütçe guard
- 🍓 **Raspberry Pi / systemd** — Kullanıcı birimi, deploy script, dosya logu

---

## Orijinal newscrux'tan Farklar

Bu bölüm, [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux) ile **newscrux-custom** arasındaki ana farkları özetler. Tam analiz: [docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt).

| Konu | Orijinal newscrux | newscrux-custom |
|------|-------------------|-----------------|
| Bildirim | [Pushover](https://pushover.net) | **Telegram Bot API** (HTML) |
| Zamanlama | `POLL_INTERVAL_MINUTES` (ör. 15 dk döngü) | **Sabit saatler** (varsayılan 12:00, 20:00 IST) |
| Kullanıcı etkileşimi | Yok | **Bot komutları** (`/pause`, `/pollnow`, `/status`, …) |
| Kimlik doğrulama | Pushover anahtarları | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` |
| RSS profili | 13 kaynak (sabit) | **`minimal` (5) veya `full` (13)** |
| Güvenlik (HTTP) | Standart fetch | **`url-security.ts`** (SSRF koruması) |
| 3D / CAD haberleri | Yok | **İsteğe bağlı katman** + bütçe limiti |
| Maliyet izleme | Yok | Token log, OpenRouter kredi uyarısı |
| Dağıtım | Manuel systemd | **install-systemd.sh**, **deploy-to-pi.sh** |
| Bot arayüz dili | Yok | TR/EN (`src/bot-i18n.ts`) |

**Değişmeyenler:** Aynı npm bağımlılık seti, aynı özet pipeline mantığı, aynı 5 dil paketi (`src/i18n.ts`), MIT lisans.

**Ayarları nerede değiştirirsiniz?** Komut adları ve saatler → [CONFIGURATION.md](CONFIGURATION.md) ve `src/telegram-commands.config.ts`. Ortam değişkenleri → `.env` (şablon: `.env.example`).

---

## Hızlı Başlangıç

```bash
git clone https://github.com/faruk3d8/newscrux-custom.git
cd newscrux-custom
npm install
cp .env.example .env        # OpenRouter + Telegram bilgilerinizi girin
npm run build
npm start -- --lang=tr      # veya: en, de, fr, es
```

**Gereksinimler (Prerequisites):**

- [Node.js 18+](https://nodejs.org)
- [OpenRouter API anahtarı](https://openrouter.ai/keys)
- Telegram bot token ([@BotFather](https://t.me/BotFather)) ve sayısal **chat ID**

`.env` ve `data/` dizinini asla commit etmeyin (`.gitignore` içinde). Sunucuda: `chmod 600 .env`.

---

## Mimari

```
RSS Kaynakları (minimal veya full profil)
        │
        ▼
  Fetch + Parse
        │
        ▼
  Kaynaklar arası dedup (başlık benzerliği)
        │
        ▼
  Keşfet → Kuyruk (kalıcı JSON, data/)
        │
        ├─ high priority (official_blog) ────────────────────┐
        │                                                     │
        ▼                                                     │
  İlgi filtresi (AI 1–10)                                    │
  Eşik altı elenir                                            │
        │                                                     │
        └─────────────────────────────────────────────────── ▼
                                                   Zenginleştir (SSRF-güvenli fetch)
                                                             │
                                                             ▼
                                                   Özetle (DeepSeek JSON)
                                                             │
                                                             ▼
                                                   Telegram HTML mesajı
                                                             │
        ┌────────────────────────────────────────────────────┘
        │
        ▼
  Zamanlayıcı (Europe/Istanbul)  ←→  Telegram bot (komutlar, yetki)
        │
        ▼
  (İsteğe bağlı) 3D katman — ayrı kuyruk, bütçe guard, günlük otomatik saat
```

---

## Desteklenen Diller

| Kod | Dil | Bildirim etiketleri (örnek) |
|-----|-----|----------------------------|
| `en` | İngilizce | "What happened:" / "Why it matters:" |
| `tr` | Türkçe | "Ne oldu:" / "Neden önemli:" |
| `de` | Almanca | "Was passiert ist:" / "Warum es wichtig ist:" |
| `fr` | Fransızca | "Ce qui s'est passé :" / "Pourquoi c'est important :" |
| `es` | İspanyolca | "Qué pasó:" / "Por qué importa:" |

Her dil paketi AI sistem prompt'u, kaynak türü etiketleri ve bildirim metinlerini içerir.

---

## Yapılandırma

Detaylı rehber: **[CONFIGURATION.md](CONFIGURATION.md)** — komut slug'ları, saatler, 3D ayarları, feed profili.

### CLI seçenekleri

| Bayrak | Açıklama | Varsayılan |
|--------|----------|------------|
| `--lang`, `-l` | Özet dili: `en`, `tr`, `de`, `fr`, `es` | `tr` (veya `data/control-state.json`) |
| `--help`, `-h` | Yardım | — |
| `--version`, `-v` | Sürüm | — |

**Örnekler:**

```bash
npm start -- --lang=tr
npm start -- -l de
npm start                    # varsayılan Türkçe
```

### Ortam değişkenleri (`.env`)

| Değişken | Zorunlu | Varsayılan | Açıklama |
|----------|---------|------------|----------|
| `OPENROUTER_API_KEY` | Evet | — | OpenRouter API anahtarı |
| `TELEGRAM_BOT_TOKEN` | Evet | — | BotFather token |
| `TELEGRAM_CHAT_ID` | Evet | — | Botu kullanabilecek sohbet ID |
| `OPENROUTER_MODEL` | Hayır | `deepseek/deepseek-v3.2-speciale` | Özet modeli |
| `FEED_PROFILE` | Hayır | `full` | `minimal` (5) veya `full` (13) kaynak |
| `MAX_ARTICLES_PER_POLL` | Hayır | `5` | Döngü başına makale limiti |
| `ARXIV_MAX_PER_POLL` | Hayır | `8` | Döngü başına arXiv limiti |
| `RELEVANCE_THRESHOLD` | Hayır | `7` | Minimum ilgi puanı (1–10) |
| `LOG_LEVEL` | Hayır | `info` | `debug`, `info`, `warn`, `error` |

**Otomatik tarama saatleri** `.env` içinde değil; `src/telegram-commands.config.ts` dosyasındadır (`SCHEDULE_HOURS`, `SCHEDULE_TIMEZONE`).

---

## Telegram Bot Komutları

| Komut | Açıklama |
|-------|----------|
| `/start`, `/help`, `/commands` | Yardım ve komut listesi |
| `/status` | Zamanlayıcı, kuyruk, kredi, token kullanımı |
| `/pause`, `/resume` | Zamanlanmış taramayı durdur / devam ettir |
| `/pollnow` | Tam manuel tarama (alias: `/poll`) |
| `/langtr`, `/langen` | Bot arayüz dili |
| `/3dainews` | 3D katman durumu |
| `/3dainewsopen`, `/3dainewsclose` | 3D katmanı aç / kapat |

3D katman açıkken otomatik tarama `THREED_SCHEDULE_HOUR` saatinde (varsayılan 12:00 IST) çalışır — bkz. `src/threed.config.ts`.

Komut adlarını veya saatleri değiştirmek için: `src/telegram-commands.config.ts` — bkz. [CONFIGURATION.md](CONFIGURATION.md).

---

## RSS Kaynakları

`FEED_PROFILE=full` iken 13 kaynak; `minimal` iken 5 kaynak aktiftir.

| Kaynak | Tür | Öncelik |
|--------|-----|---------|
| OpenAI News | `official_blog` | yüksek (filtre bypass) |
| Google AI Blog | `official_blog` | yüksek |
| Google DeepMind | `official_blog` | yüksek |
| Hugging Face Blog | `official_blog` | normal |
| TechCrunch AI | `media` | normal |
| MIT Technology Review AI | `media` | normal |
| The Verge AI | `media` | normal |
| Ars Technica | `media` | normal |
| arXiv cs.CL / cs.LG / cs.AI | `research` | normal |
| Import AI | `newsletter` | normal |
| Ahead of AI | `newsletter` | normal |

Kaynak eklemek veya çıkarmak: `src/feeds.ts` içindeki `ALL_FEEDS` dizisi.

---

## Dağıtım

### Raspberry Pi / Linux (systemd)

```bash
# 1. Klonla ve derle
git clone https://github.com/faruk3d8/newscrux-custom.git ~/newscrux-custom
cd ~/newscrux-custom
npm install
cp .env.example .env
nano .env                                       # API anahtarlarını doldurun
npm run build

# 2. Servisi kur (script veya manuel)
./scripts/install-systemd.sh
# veya:
# cp newscrux.service ~/.config/systemd/user/
# nano ~/.config/systemd/user/newscrux.service   # --lang gerekirse

# 3. Etkinleştir ve başlat (kullanıcı düzeyi systemd)
systemctl --user daemon-reload
systemctl --user enable newscrux
systemctl --user start newscrux

# 4. Canlı log
journalctl --user -u newscrux -f
# veya dosya logu: tail -f ~/newscrux-custom/data/service.log
```

Servis dosyası `%h/newscrux-custom` yolunu kullanır; farklı dizine klonladıysanız `newscrux.service` ve `scripts/install-systemd.sh` içinde güncelleyin.

### Uzak makineden deploy (SSH)

```bash
./scripts/deploy-to-pi.sh pi@raspberrypi.local
```

Hedef kullanıcı ve host'u argüman olarak verin; script varsayılan IP veya kişisel yol içermez.

---

## Nasıl Çalışır?

1. **Fetch** — Aktif RSS profiline göre kaynaklar taranır (`rss-parser`).
2. **Dedup** — Kaynaklar arası başlık benzerliği ile tekrarlar elenir.
3. **Keşfet** — Yeni makaleler kalıcı kuyruğa (`data/article-queue.json`) `discovered` olarak eklenir.
4. **Filtre** — AI ilgi puanı; eşik altı makaleler özetlenmez. `official_blog` yüksek öncelikli kaynaklar filtreyi atlayabilir.
5. **Zenginleştir** — Özet kısaysa SSRF korumalı HTTP ile tam metin; üst sınır summarizer için uygulanır.
6. **Özetle** — OpenRouter üzerinden yapılandırılmış JSON çıktı (seçilen dilde).
7. **Gönder** — Telegram API; başarılı gönderimden sonra `sent` işaretlenir.
8. **Yeniden dene** — Başarısız adımlar kuyrukta kalır, sonraki döngüde tekrar denenir.
9. **Zamanlayıcı + bot** — Sabit saatlerde otomatik poll; komutlarla manuel müdahale.

---

## Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [CONFIGURATION.md](CONFIGURATION.md) | Komut adları, saatler, 3D, `.env` |
| [docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt) | Orijinal vs custom — tam kıyaslama analizi (TR) |
| [docs/README.txt](docs/README.txt) | `docs/` klasörü açıklaması |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Katkı rehberi |
| [NOTICE](NOTICE) | Fork atıfı ve telif notu |

`personal/` klasörü **GitHub'a gitmez** (`.gitignore`) — yalnızca yerel güvenlik notları.

---

## Güvenlik

- Makale URL'leri `url-security.ts` ile doğrulanır (özel IP, metadata host, güvensiz redirect engeli).
- Derleme sonrası: `npm run test:security`
- `.env`, `data/`, `personal/` commit edilmemeli; sunucuda `chmod 600 .env`
- Token ve chat ID'yi issue veya commit mesajlarına yapıştırmayın

---

## Geliştirme

```bash
npm run dev              # tsx src/index.ts
npm run build
npm run test:security
```

---

## Upstream, Yazar ve Lisans

| Proje | GitHub | Yazar |
|-------|--------|-------|
| **newscrux** (orijinal) | [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux) | [Alican Kiraz](https://github.com/alicankiraz1) |
| **newscrux-custom** (bu fork) | [faruk3d8/newscrux-custom](https://github.com/faruk3d8/newscrux-custom) | [faruk3d8](https://github.com/faruk3d8) |

**newscrux-custom**, Pushover yerine Telegram, bot zamanlaması, 3D katman ve operasyon araçları ekleyen bir fork'tur. Orijinal MIT lisansı geçerlidir — ayrıntılar [LICENSE](LICENSE) ve [NOTICE](NOTICE).

---

## GitHub'a Yükleme

Depo henüz GitHub'da yoksa veya sadece upstream'e bağlıysa aşağıdaki adımları izleyin.

### 1. GitHub'da boş depo oluşturun

1. [https://github.com/new](https://github.com/new) adresine gidin.
2. **Repository name:** `newscrux-custom`
3. **Public** seçin.
4. README, `.gitignore` veya lisans **eklemeyin** (zaten projede var).
5. **Create repository** ile oluşturun.

### 2. Yerel repoda remote ayarlayın

Proje klasöründe (`newscrux-custom`):

```bash
cd ~/Projects/newscrux-custom   # kendi yolunuz

# Upstream'i koruyun (orijinal newscrux)
git remote rename origin upstream 2>/dev/null || true
git remote add upstream https://github.com/alicankiraz1/newscrux.git 2>/dev/null || true

# Kendi fork'unuz
git remote add origin https://github.com/faruk3d8/newscrux-custom.git
# Zaten origin varsa ve upstream değilse:
# git remote set-url origin https://github.com/faruk3d8/newscrux-custom.git

git remote -v
```

Beklenen çıktı örneği:

```
origin    https://github.com/faruk3d8/newscrux-custom.git (fetch/push)
upstream  https://github.com/alicankiraz1/newscrux.git (fetch/push)
```

### 3. Commit edilmemesi gerekenler

Push öncesi kontrol:

```bash
git status
```

Şunlar **listedeki olmamalı** (`.gitignore` kapsar):

- `.env` (API anahtarları)
- `data/` (kuyruk, log, control state)
- `personal/`
- `node_modules/`
- `dist/` (build çıktısı)

`.env` yanlışlıkla staged ise: `git reset HEAD .env`

### 4. İlk commit ve push

```bash
git add -A
git status   # son bir kez .env / data kontrolü

git commit -m "feat: Telegram fork, docs, and public release prep for faruk3d8/newscrux-custom"

git branch -M main
git push -u origin main
```

GitHub kimlik doğrulaması: SSH kullanıyorsanız remote URL `git@github.com:faruk3d8/newscrux-custom.git` olabilir.

### 5. Sonraki güncellemeler

```bash
git add .
git commit -m "açıklayıcı mesaj"
git push
```

Upstream'den güncelleme almak (isteğe bağlı):

```bash
git fetch upstream
git merge upstream/main   # veya rebase
```

### 6. Depo ayarları (öneri)

GitHub repo **About** kısmına kısa açıklama: *Telegram bot + AI news digest fork of newscrux*

**Topics:** `telegram-bot`, `rss`, `openrouter`, `typescript`, `raspberry-pi`

**Website:** README'deki upstream linki veya kendi sayfanız.

Push tamamlandığında depo adresi: **https://github.com/faruk3d8/newscrux-custom**
