# Newscrux-Custom

> Yapay zekâ destekli haber toplayıcı: çok dilli yapılandırılmış özetler, Telegram bot kontrolü ve zamanlanmış tarama.

[Node.js](https://nodejs.org)
[TypeScript](https://www.typescriptlang.org)
[License: MIT](LICENSE)
[Languages](src/i18n.ts)

**Fork kaynağı:** [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux)

---

## Ne Yapar?

Newscrux-Custom, AI/ML RSS kaynaklarını izler (`full` profilde 13, `minimal` profilde 5), makaleleri yapay zekâ ile ilgi açısından filtreler, gerekirse tam metin çıkarır, seçtiğiniz dilde yapılandırılmış özet üretir ve bildirimleri **[Telegram](https://telegram.org)** üzerinden telefonunuza iletir.

Her bildirim **ne oldu**, **neden önemli** ve **tek bir önemli detay** içerir — İngilizce, Türkçe, Almanca, Fransızca veya İspanyolca.

İsteğe bağlı **3D AI haber araması** varsayılan olarak kapalıdır; açıldığında ana akıştan bağımsız RSS, GitHub ve arXiv kaynaklarını tarar, özetleyip Telegram’a iletir.

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

---

## Özellikler

- 🌍 **5 dil** — `--lang` ile özet dili: `en`, `tr`, `de`, `fr`, `es`
- 🧠 **Yapılandırılmış özetler** — Ne oldu + Neden önemli + Ana detay (DeepSeek / OpenRouter)
- 📰 **13 RSS kaynağı** — OpenAI, Google AI, DeepMind, TechCrunch, arXiv ve daha fazlası
- 🔍  **Yapay zeka alaka düzeyi filtrelemesi** — Yalnızca önemli haberleri sunar; alakasız makaleler özetlemeden önce bırakılır.
- 📄 **Hibrit içerik çıkarma** — önce RSS snippet, snippet çok kısa olduğunda tam metin kazıma (cheerio aracılığıyla)
- ⚡ **Makale durum hattı** — `discovered → enriched → summarized → sent`, kalıcı kuyruk
- 🔒 **Veri kaybı yok** — Atomik kuyruk yazımı, yeniden deneme, yeniden başlatmada devam
- 📊 **Operasyon metrikleri** — Döngü istatistikleri log ve `/status` komutu
- 🤖 **Telegram bot** — Duraklat/devam, manuel poll (`/pollnow`), yetkili sohbet kilidi
- ⏰ **Esnek zamanlama** — Sabit saatler (`SCHEDULE_HOURS`) veya 15/30/60 dk aralık (`data/control-state.json`)
- 🛡️ **SSRF koruması** — Özel IP ve güvensiz yönlendirmeler engellenir
- 🎮 **3D AI katmanı** (isteğe bağlı) — Ayrı RSS/GitHub/arXiv

---

## Orijinal newscrux'tan Farklar

Bu bölüm, [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux) ile **newscrux-custom** arasındaki ana farkları özetler. Tam analiz: [docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt).

Ayrıntılar: [CONFIGURATION.md](CONFIGURATION.md).

---

## Hızlı Başlangıç

```bash
git clone https://github.com/faruk3d8/newscrux-custom.git
cd newscrux-custom
npm install
cp .env.example .env        # OpenRouter + Telegram bilgilerinizi girin
npm run build
npm start -- --lang=en      # veya: tr, de, fr, es (varsayılan: en)
```

**Gereksinimler (Prerequisites):**

- [Node.js 18+](https://nodejs.org)
- [OpenRouter API anahtarı](https://openrouter.ai/keys)
- Telegram bot token ([@BotFather](https://t.me/BotFather)) ve sayısal **chat ID**

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
  (İsteğe bağlı) 3D katman — ayrı kuyruk, aylık harcama uyarısı, günlük otomatik saat
```

---

## Desteklenen Diller


| Kod  | Dil        | Bildirim etiketleri (örnek)                           |
| ---- | ---------- | ----------------------------------------------------- |
| `en` | İngilizce  | "What happened:" / "Why it matters:"                  |
| `tr` | Türkçe     | "Ne oldu:" / "Neden önemli:"                          |
| `de` | Almanca    | "Was passiert ist:" / "Warum es wichtig ist:"         |
| `fr` | Fransızca  | "Ce qui s'est passé :" / "Pourquoi c'est important :" |
| `es` | İspanyolca | "Qué pasó:" / "Por qué importa:"                      |


Her dil paketi AI sistem prompt'u, kaynak türü etiketleri ve bildirim metinlerini içerir.

---

## Yapılandırma

Detaylı rehber: **[CONFIGURATION.md](CONFIGURATION.md)** — komut slug'ları, saatler, 3D ayarları, feed profili.

### CLI seçenekleri

Orijinal [newscrux](https://github.com/alicankiraz1/newscrux) ile aynı `--help` / `--version` yapısı; bu fork ek olarak zamanlama bayrakları sunar.


| Bayrak               | Açıklama                                                                              | Varsayılan                                                        |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--lang`, `-l`       | Özet dili: `en`, `tr`, `de`, `fr`, `es`                                               | `en` (ilk kurulum; `data/control-state.json` varsa oradan okunur) |
| `--tz`, `--timezone` | Otomatik tarama saat dilimi (IANA, örn. `Europe/Istanbul`)                            | `Europe/Istanbul`                                                 |
| `--schedule-hours`   | Günlük tarama saatleri, virgülle (0–23)                                               | `12,20`                                                           |
| `--3d-on`            | İsteğe bağlı **3D AI haber katmanını** açar (`data/control-state.json` içine yazılır) | kapalı (varsayılan)                                               |
| `--3d-off`           | 3D AI haber katmanını kapatır                                                         | —                                                                 |
| `--help`, `-h`       | Yardım                                                                                | —                                                                 |
| `--version`, `-v`    | Sürüm                                                                                 | —                                                                 |


**Öncelik:** CLI bayrakları → `.env` (`SCHEDULE_`*, `THREED_`*) → derlenmiş varsayılanlar.

**3D katman:** Ana RSS akışından bağımsız, **varsayılan olarak kapalıdır**. Açmak için başlangıçta `--3d-on`, çalışırken Telegram `/3dainewsopen`, veya kalıcı durum `data/control-state.json` (`threeDNewsEnabled: true`). Kapatmak için `--3d-off` veya `/3dainewsclose`. Açıkken günlük otomatik tarama `THREED_SCHEDULE_HOUR` saatinde (varsayılan 12:00, `SCHEDULE_TIMEZONE` ile aynı IANA) çalışır.

**Yerel örnekler:**

```bash
npm start -- --help
npm start -- --lang=en
npm start -- --lang=tr --tz=Europe/Istanbul --schedule-hours=12,20
npm start -- --3d-on              # 3D haber taramasını aç
npm start -- --3d-off             # 3D haber taramasını kapat
npm start                    # varsayılan: en, Europe/Istanbul 12:00 ve 20:00; 3D kapalı
```

**SSH üzerinden test (Raspberry Pi / uzak sunucu):**

```bash
# Yardım ve sürüm
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && node dist/index.js --help'
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && node dist/index.js --version'

# Ön planda kısa test (Ctrl+C ile durdurun; systemd servisini durdurmadan)
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && node dist/index.js --lang=en --tz=Europe/Istanbul --schedule-hours=12,20'
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && node dist/index.js --3d-on'

# Servis durumu ve log
ssh pi@raspberrypi.local 'systemctl --user status newscrux'
ssh pi@raspberrypi.local 'journalctl --user -u newscrux -n 50 --no-pager'
ssh pi@raspberrypi.local 'tail -f ~/newscrux-custom/data/service.log'
```

### Ortam değişkenleri (`.env`)


| Değişken                | Zorunlu | Varsayılan                        | Açıklama                                |
| ----------------------- | ------- | --------------------------------- | --------------------------------------- |
| `OPENROUTER_API_KEY`    | Evet    | —                                 | OpenRouter API anahtarı                 |
| `TELEGRAM_BOT_TOKEN`    | Evet    | —                                 | BotFather token                         |
| `TELEGRAM_CHAT_ID`      | Evet    | —                                 | Botu kullanabilecek sohbet ID           |
| `OPENROUTER_MODEL`      | Hayır   | `deepseek/deepseek-v3.2-speciale` | Özet modeli                             |
| `FEED_PROFILE`          | Hayır   | `full`                            | `minimal` (5) veya `full` (13) kaynak   |
| `MAX_ARTICLES_PER_POLL` | Hayır   | `5`                               | Döngü başına makale limiti              |
| `ARXIV_MAX_PER_POLL`    | Hayır   | `8`                               | Döngü başına arXiv limiti               |
| `RELEVANCE_THRESHOLD`   | Hayır   | `7`                               | Minimum ilgi puanı (1–10)               |
| `LOG_LEVEL`             | Hayır   | `info`                            | `debug`, `info`, `warn`, `error`        |
| `SCHEDULE_TIMEZONE`     | Hayır   | `Europe/Istanbul`                 | Otomatik tarama saat dilimi (IANA)      |
| `SCHEDULE_HOURS`        | Hayır   | `12,20`                           | Günlük tarama saatleri (0–23, virgülle) |


**Zamanlama önceliği:** CLI (`--tz`, `--schedule-hours`) → `.env` → varsayılan. Örnek: `npm start -- --lang=tr --tz=Europe/Berlin --schedule-hours=9,18`

**Komut adları** yalnızca `src/telegram-commands.config.ts` içindedir — bkz. [CONFIGURATION.md](CONFIGURATION.md).

---

## Telegram Bot Komutları


| Komut                             | Açıklama                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, `/help`, `/commands`    | Yardım ve komut listesi                                                                                                                              |
| `/status`                         | Zamanlayıcı, kuyruk, kredi, token kullanımı; altta **Ana kaynak: [newscrux](https://github.com/alicankiraz1/newscrux)** (tıklanabilir upstream link) |
| `/pause`, `/resume`               | Zamanlanmış taramayı durdur / devam ettir                                                                                                            |
| `/pollnow`                        | Tam manuel tarama (alias: `/poll`)                                                                                                                   |
| `/languages`                      | Özet dili seçimi (inline menü: tr–es)                                                                                                                |
|                                   |                                                                                                                                                      |
| `/3dainews`                       | 3D katman durumu                                                                                                                                     |
| `/3dainewsopen`, `/3dainewsclose` | 3D katmanı aç / kapat                                                                                                                                |


3D katman açıkken otomatik tarama `THREED_SCHEDULE_HOUR` saatinde (varsayılan 12:00 IST) çalışır — bkz. `src/threed.config.ts`.

Komut adlarını değiştirmek için: `src/telegram-commands.config.ts`. Tarama saatleri ve saat dilimi için `.env` veya CLI — bkz. [CONFIGURATION.md](CONFIGURATION.md).

---

## RSS Kaynakları

`FEED_PROFILE=full` iken 13 kaynak; `minimal` iken 5 kaynak aktiftir.


| Kaynak                      | Tür             | Öncelik                |
| --------------------------- | --------------- | ---------------------- |
| OpenAI News                 | `official_blog` | yüksek (filtre bypass) |
| Google AI Blog              | `official_blog` | yüksek                 |
| Google DeepMind             | `official_blog` | yüksek                 |
| Hugging Face Blog           | `official_blog` | normal                 |
| TechCrunch AI               | `media`         | normal                 |
| MIT Technology Review AI    | `media`         | normal                 |
| The Verge AI                | `media`         | normal                 |
| Ars Technica                | `media`         | normal                 |
| arXiv cs.CL / cs.LG / cs.AI | `research`      | normal                 |
| Import AI                   | `newsletter`    | normal                 |
| Ahead of AI                 | `newsletter`    | normal                 |


Kaynak eklemek veya çıkarmak: `src/feeds.ts` içindeki `ALL_FEEDS` dizisi.

### 3D AI katmanı kaynakları (isteğe bağlı)

Ana akıştan **ayrı** bir haber katmanıdır: mesh / NeRF / CAD / text-to-3D odaklı kaynaklar. **Varsayılan kapalıdır** — yalnızca `--3d-on`, `/3dainewsopen` veya `data/control-state.json` ile açıldığında taranır. Toplam **17** kaynak (`src/threed.config.ts`, `src/feeds-3d.ts`).


| Kaynak                           | Tür             | Not                                                |
| -------------------------------- | --------------- | -------------------------------------------------- |
| NVIDIA Blog                      | `official_blog` | `THREED_FEED_NVIDIA` ile URL değiştirilebilir      |
| Stability AI Blog                | `official_blog` |                                                    |
| Blender Nation                   | `media`         |                                                    |
| Tripo AI Blog                    | `official_blog` |                                                    |
| Meshy Blog                       | `official_blog` |                                                    |
| GitHub: microsoft/TRELLIS        | `release`       | Release atom                                       |
| GitHub: tencent/Hunyuan3D-2      | `release`       |                                                    |
| GitHub: tencent/Hunyuan3D-2.1    | `release`       |                                                    |
| GitHub: VAST-AI-Research/TripoSR | `release`       |                                                    |
| GitHub: VAST-AI-Research/TripoSG | `release`       |                                                    |
| GitHub: gudo7208/CAD-Coder       | `release`       | text                                               |
| GitHub: anniedoris/CAD-Coder     | `release`       | image                                              |
| arXiv cs.GR                      | `research`      | tüm makaleler                                      |
| arXiv cs.CV                      | `research`      | `THREED_CS_CV_KEYWORDS` ile filtreli               |
| Hugging Face Blog                | `official_blog` | ana akışla paylaşımlı (`THREED_SHARED_FEED_NAMES`) |
| TechCrunch AI                    | `media`         | paylaşımlı                                         |
| The Verge AI                     | `media`         | paylaşımlı                                         |


Kaynak eklemek veya çıkarmak: `src/threed.config.ts` (`THREED_RSS_FEEDS`, `THREED_GITHUB_RELEASE_REPOS`, `THREED_ARXIV_CATEGORIES`, `THREED_SHARED_FEED_NAMES`). Ayrıntılı `.env` anahtarları: [CONFIGURATION.md](CONFIGURATION.md) ve `.env.example`.

---

## Dağıtım

Raspberry Pi veya herhangi bir Linux sunucusunda **kullanıcı düzeyi systemd** ile çalışır (root gerekmez). Upstream [newscrux README](https://github.com/alicankiraz1/newscrux#deployment) ile aynı model: birim dosyası `~/.config/systemd/user/`, `systemctl --user enable/start`, `journalctl --user -f`. Bu fork ek olarak `data/service.log` dosya logu ve `loginctl enable-linger` kullanır — SSH oturumu kapalıyken de servis ayakta kalır.

**İlk kurulum varsayılanları:** özet dili **İngilizce (`en`)**, zamanlama **Europe/Istanbul** saatiyle **12:00** ve **20:00** (`.env` veya `SCHEDULE_`* ile değiştirilebilir). systemd biriminde `--lang=…` kullanmayın; dil `data/control-state.json` içinde kalıcıdır ve her yeniden başlatmada üzerine yazılır.

### Raspberry Pi / Linux (systemd)

```bash
# 1. Klonla ve derle
git clone https://github.com/faruk3d8/newscrux-custom.git ~/newscrux-custom
cd ~/newscrux-custom
npm install
cp .env.example .env
nano .env                                       # OPENROUTER + TELEGRAM bilgilerini doldurun
chmod 600 .env
npm run build

# 2. systemd birim dosyasını kur
mkdir -p ~/.config/systemd/user ~/newscrux-custom/data
cp newscrux.service ~/.config/systemd/user/
# Gerekirse %h/newscrux-custom yolunu düzenleyin; --lang eklemeyin

# 3. Etkinleştir ve başlat
systemctl --user daemon-reload
systemctl --user enable newscrux
systemctl --user start newscrux

# SSH kapalıyken de çalışsın
loginctl enable-linger "$(whoami)"

# 4. Canlı log
journalctl --user -u newscrux -f
tail -f ~/newscrux-custom/data/service.log
```

Servis dosyası `%h/newscrux-custom` yolunu kullanır; farklı dizine klonladıysanız `newscrux.service` içindeki `WorkingDirectory` ve `ExecStart` yollarını güncelleyin.

**Kurulum doğrulama:**

```bash
systemctl --user is-active newscrux
node dist/index.js --help
grep -E '^SCHEDULE_' .env    # SCHEDULE_TIMEZONE=Europe/Istanbul, SCHEDULE_HOURS=12,20
```

### Uzak makineden güncelleme (SSH)

Pi üzerinde doğrudan:

```bash
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && git pull && npm install && npm run build && systemctl --user restart newscrux'
```

Mac'ten rsync ile (`.env` ve `data/` korunur):

```bash
rsync -avz --delete \
  --exclude node_modules --exclude dist --exclude .env --exclude data --exclude .git \
  ./ pi@raspberrypi.local:~/newscrux-custom/
ssh pi@raspberrypi.local 'cd ~/newscrux-custom && npm install && npm run build && systemctl --user restart newscrux'
```

Ön planda hata ayıklama:

```bash
systemctl --user stop newscrux
cd ~/newscrux-custom && node dist/index.js --lang=en
```

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


| Dosya                                                                            | Açıklama                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------- |
| [CONFIGURATION.md](CONFIGURATION.md)                                             | Komut adları, saatler, 3D, `.env`               |
| [docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt) | Orijinal vs custom — tam kıyaslama analizi (TR) |
| [docs/README.txt](docs/README.txt)                                               | `docs/` klasörü açıklaması                      |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                               | Katkı rehberi                                   |
| [NOTICE](NOTICE)                                                                 | Fork atıfı ve telif notu                        |


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

**newscrux-custom**, Pushover yerine Telegram, bot zamanlaması, 3D konusunda arama katmanı ve operasyon araçları ekleyen bir fork'tur. Orijinal MIT lisansı geçerlidir — ayrıntılar [LICENSE](LICENSE) ve [NOTICE](NOTICE).

sosyal medya hesapları.

---

