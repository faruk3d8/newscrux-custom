# Newscrux-Custom

> Yapay zekâ destekli haber toplayıcı: çok dilli yapılandırılmış özetler, Telegram bot kontrolü ve zamanlanmış tarama.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)
[![Languages](https://img.shields.io/badge/Languages-5-orange?style=flat)](src/i18n.ts)
[![ESM](https://img.shields.io/badge/ESM-native-blueviolet?style=flat)](package.json)

**Fork kaynağı:** [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux)

---

## Ne Yapar?

Newscrux-Custom, AI/ML RSS kaynaklarını izler, makaleleri yapay zekâ ile ilgi açısından filtreler, gerekirse tam metin çıkarır, seçtiğiniz dilde yapılandırılmış özet üretir ve bildirimleri **[Telegram](https://telegram.org)** üzerinden iletir.

Her bildirim **ne oldu**, **neden önemli** ve **tek bir önemli detay** içerir — İngilizce, Türkçe, Almanca, Fransızca veya İspanyolca.

İsteğe bağlı **3D AI haber katmanı** varsayılan olarak kapalıdır; açıldığında ana akıştan bağımsız RSS, GitHub ve arXiv kaynaklarını tarar, özetleyip Telegram’a iletir.

---

## Bildirim Örnekleri

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

**English (`--lang=en`):**

```
Title: OpenAI announces enterprise agent toolkit

📰 TechCrunch AI

What happened: OpenAI released a new suite of tools for building
enterprise-grade autonomous agents, including improved function
calling, a persistent memory API, and a new orchestration layer.

Why it matters: This could significantly accelerate agent-based
automation in large organizations by reducing integration complexity.

💡 Initial access is being rolled out to select enterprise customers.
```

---

## Özellikler

- 🌍 **5 dil** — `--lang` ile özet dili: `en`, `tr`, `de`, `fr`, `es`
- 🧠 **Yapılandırılmış özetler** — Ne oldu + Neden önemli + Ana detay (DeepSeek / OpenRouter)
- 📰 **13 RSS kaynağı** — OpenAI, Google AI, DeepMind, TechCrunch, arXiv ve daha fazlası
- 🔍 **Yapay zeka alaka düzeyi filtrelemesi** — Yalnızca önemli haberleri sunar; alakasız makaleler özetlemeden önce elenir
- 📄 **Hibrit içerik çıkarma** — Önce RSS snippet, snippet kısa olduğunda tam metin kazıma (cheerio)
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

Ayrıntılı ayar rehberi: [CONFIGURATION.md](CONFIGURATION.md).

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

**Gereksinimler:**

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

| Bayrak               | Açıklama                                                                              | Varsayılan                                                        |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--lang`, `-l`       | Özet dili: `en`, `tr`, `de`, `fr`, `es`                                               | `en` (ilk kurulum; `data/control-state.json` varsa oradan okunur) |
| `--tz`, `--timezone` | Otomatik tarama saat dilimi (IANA, örn. `Europe/Istanbul`)                            | `Europe/Istanbul`                                                 |
| `--schedule-hours`   | Günlük tarama saatleri, virgülle (0–23)                                               | `12,20`                                                           |
| `--3d-on`            | İsteğe bağlı **3D AI haber katmanını** açar (`data/control-state.json` içine yazılır) | kapalı (varsayılan)                                               |
| `--3d-off`           | 3D AI haber katmanını kapatır                                                         | —                                                                 |
| `--help`, `-h`       | Yardım                                                                                | —                                                                 |
| `--version`, `-v`    | Sürüm                                                                                 | —                                                                 |

**Öncelik:** CLI bayrakları → `.env` (`SCHEDULE_*`, `THREED_*`) → derlenmiş varsayılanlar.

**3D katman:** Ana RSS akışından bağımsız, **varsayılan olarak kapalıdır**. Açmak için `--3d-on`, Telegram `/3dainewsopen` veya `data/control-state.json` (`threeDNewsEnabled: true`). Kapatmak için `--3d-off` veya `/3dainewsclose`.

**Örnekler:**

```bash
npm start -- --help
npm start -- --lang=en
npm start -- --lang=tr --tz=Europe/Istanbul --schedule-hours=12,20
npm start -- --3d-on
npm start -- --3d-off
npm start                    # varsayılan: en, Europe/Istanbul 12:00 ve 20:00; 3D kapalı
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

---

## Telegram Bot Komutları

| Komut                             | Açıklama                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, `/help`, `/commands`    | Yardım ve komut listesi                                                                                                               |
| `/status`                         | Zamanlayıcı, kuyruk, kredi, token kullanımı; altta **Ana kaynak: [newscrux](https://github.com/alicankiraz1/newscrux)** (upstream link) |
| `/pause`, `/resume`               | Zamanlanmış taramayı durdur / devam ettir                                                                                             |
| `/pollnow`                        | Tam manuel tarama (alias: `/poll`)                                                                                                    |
| `/languages`                      | Özet dili seçimi (inline menü: tr–es)                                                                                                 |
| `/3dainews`                       | 3D katman durumu                                                                                                                      |
| `/3dainewsopen`, `/3dainewsclose` | 3D katmanı aç / kapat                                                                                                                 |

---

## RSS Kaynakları

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

### 3D AI katmanı kaynakları (isteğe bağlı)

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

---

## Dağıtım

### Raspberry Pi / Linux (systemd)

```bash
# 1. Klonla ve derle
git clone https://github.com/faruk3d8/newscrux-custom.git ~/newscrux-custom
cd ~/newscrux-custom
npm install
cp .env.example .env
nano .env
chmod 600 .env
npm run build

# 2. Servis dosyasını kur
mkdir -p ~/.config/systemd/user
cp newscrux.service ~/.config/systemd/user/

# 3. Etkinleştir ve başlat
systemctl --user daemon-reload
systemctl --user enable newscrux
systemctl --user start newscrux

# 4. Canlı log
journalctl --user -u newscrux -f
```

Servis dosyası `%h` (systemd home directory specifier) kullanır; yollar otomatik olarak ev dizininize çözülür. Root erişimi gerekmez. Ek olarak stdout/stderr `data/service.log` dosyasına yazılır.

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
| ----- | -------- |
| [CONFIGURATION.md](CONFIGURATION.md) | Komut adları, saatler, 3D, `.env` |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Katkı rehberi |
| [NOTICE](NOTICE) | Fork atıfı ve telif notu |
| [docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt](docs/UPSTREAM-KARSILASTIRMA-RAPORU.txt) | Orijinal vs custom — teknik kıyaslama (TR) |

---

## Güvenlik

- Makale URL'leri `src/url-security.ts` ile doğrulanır (özel IP, metadata host, güvensiz redirect engeli).
- Derleme sonrası kontrol: `npm run test:security`
- `.env`, `data/` ve `personal/` commit edilmemeli; sunucuda `chmod 600 .env`
- API anahtarı, bot token ve chat ID'yi issue veya commit mesajlarına yapıştırmayın

---

## Geliştirme

```bash
npm run dev              # tsx ile doğrudan src/index.ts
npm run build            # dist/ üret
npm run test:security    # SSRF / URL güvenlik testleri
```

Yeni dil, komut veya feed eklerken [CONTRIBUTING.md](CONTRIBUTING.md) ve [CONFIGURATION.md](CONFIGURATION.md) dosyalarına bakın.

---

## Upstream, Yazar ve Lisans

**newscrux-custom**, Pushover yerine Telegram, bot zamanlaması, isteğe bağlı 3D/CAD haber katmanı ve SSRF sertleştirmesi ekleyen bir fork'tur.

- Orijinal proje: [alicankiraz1/newscrux](https://github.com/alicankiraz1/newscrux) — **Alican Kiraz**
- Bu fork: [faruk3d8/newscrux-custom](https://github.com/faruk3d8/newscrux-custom)

MIT lisansı — ayrıntılar [LICENSE](LICENSE) ve [NOTICE](NOTICE).
