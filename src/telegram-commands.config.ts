/**
 * =============================================================================
 * TELEGRAM BOT KOMUTLARI VE ZAMANLAMA AYARLARI
 * =============================================================================
 *
 * Bu dosyayı düzenleyerek bot komutlarını ve otomatik arama saatlerini
 * değiştirebilirsiniz. Değişiklikten sonra projeyi yeniden derleyin:
 *
 *   npm run build
 *
 * systemd kullanıyorsanız servisi yeniden başlatın:
 *
 *   systemctl --user restart newscrux
 *
 * Not: Komutlar Telegram'da tam olarak burada yazdığınız gibi kullanılır
 * (ör. /durdur). BotFather'da aynı komutları tanımlamanız önerilir.
 */

/** İstanbul saati için zaman dilimi */
export const SCHEDULE_TIMEZONE = 'Europe/Istanbul';

/**
 * Günlük otomatik arama saatleri (24 saat formatı, yerel saat).
 * Sistem duraklatılmadıysa bu saatlerde RSS taraması yapılır ve sonuç gönderilir.
 */
export const SCHEDULE_HOURS = [12, 20] as const;

/** Manuel /ara komutu için minimum bekleme süresi (dakika) */
export const MANUAL_POLL_COOLDOWN_MINUTES = 15;

/**
 * Bot komutları — istediğiniz metne çevirebilirsiniz.
 * Sadece Telegram'da gönderilen komut metnini değiştirin; mantık aynı kalır.
 */
export const BOT_COMMANDS = {
  /** Zamanlanmış aramaları durdurur (manuel /ara hâlâ çalışır) */
  stop: '/durdur',

  /** Zamanlanmış aramaları tekrar açar */
  start: '/baslat',

  /** Hemen bir arama döngüsü başlatır (zamanlanmış saat dışında da) */
  pollNow: '/ara',

  /** Durum: aktif/duraklatıldı, sonraki otomatik arama saati */
  status: '/durum',
} as const;

/**
 * Bot yanıt mesajları (Türkçe).
 * Bildirim dili --lang=tr ile ayrıca ayarlanır; bunlar sadece komut cevaplarıdır.
 */
export const BOT_MESSAGES = {
  unauthorized: 'Bu botu kullanma yetkiniz yok.',
  stopped: 'Zamanlanmış aramalar durduruldu. Manuel arama için komutu kullanabilirsiniz.',
  started: 'Zamanlanmış aramalar tekrar aktif.',
  pollStarted: 'Manuel arama başlatıldı…',
  pollAlreadyRunning: 'Bir arama zaten devam ediyor, lütfen bekleyin.',
  pollCooldown: 'Manuel arama için lütfen bir süre bekleyin.',
  pollDone: 'Manuel arama tamamlandı.',
  pollFailed: 'Arama sırasında hata oluştu. Logları kontrol edin.',
  statusPaused: 'Durum: DURAKLATILDI (zamanlanmış aramalar kapalı)',
  statusRunning: 'Durum: AKTIF (zamanlanmış aramalar açık)',
  nextRun: 'Sonraki otomatik arama',
  unknownCommand: 'Bilinmeyen komut. Kullanılabilir komutlar',
} as const;
