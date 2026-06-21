/**
 * Telegram bot UI strings for de / fr / es (menus, status, notifications).
 */

import { THREED_BOT_COMMANDS } from './threed.config.js';
import type { BotMessages } from './bot-i18n.js';

export const BOT_LANGUAGES_COMMAND = 'languages';

const deMessages: BotMessages = {
  unauthorized: 'Sie sind nicht berechtigt, diesen Bot zu nutzen.',
  stopped: 'Geplante Suchen gestoppt. Für manuelle Suchen /pollnow verwenden.',
  started: 'Geplante Suchen fortgesetzt.',
  pollStarted: 'Manuelle Suche gestartet…',
  pollStartedFast: 'Schnelle manuelle Suche gestartet (Scraping aus, niedrige Limits)…',
  pollStarted3D: '🧊 Manuelle 3D-KI-Suche gestartet…',
  pollAlreadyRunning: 'Eine Suche läuft bereits. Bitte warten.',
  pollCooldown: 'Bitte warten Sie, bevor Sie eine weitere manuelle Suche starten.',
  pollFailed: 'Suche fehlgeschlagen. Logs prüfen.',
  rateLimited: 'Zu viele Befehle. Bitte eine Minute warten.',
  statusPaused: 'Status: Pausiert',
  statusRunning: 'Status: Aktiv',
  nextRun: 'Nächste Suche',
  startupPollNowHint: 'Sofortsuche mit /pollnow.',
  unknownCommand: 'Unbekannter Befehl. Siehe',
  unknownCommandHint: '/commands',
  langSwitched: (displayName) => `Menü- und Benachrichtigungssprache auf ${displayName} umgestellt.`,
  langCurrent: (displayName) => `Sprache: ${displayName}`,
  langPickerTitle: '🌍 Sprache wählen — Zusammenfassungen und Benachrichtigungen folgen dieser Sprache:',
  langPickerCloseButton: '✖ Schließen',
  langPickerClosed: 'Sprachmenü geschlossen.',
  langSwitchedTo: (displayName) => `Sprache auf ${displayName} umgestellt`,
  contentLangCurrent: (displayName) => `Sprache: ${displayName}`,
  threeDEnabled: '🧊 3D-KI-Nachrichtenebene aktiviert.',
  threeDDisabled: '🧊 3D-KI-Nachrichtenebene deaktiviert.',
  threeDManualBlocked:
    'Geplante 3D-Suchen sind aus. /3dainewsopen für automatische Läufe verwenden.',
  pollInProgress: 'Suche läuft',
  scheduleHours: 'Zeitplan',
  feedProfile: 'Feed-Profil',
  threeDNews: '3D-Nachrichten',
  lastPollNone: 'Letzte Suche: noch keine',
  lastPoll: 'Letzte Suche',
  duration: 'Dauer',
  phase: 'Phase',
  discovered: 'Gefunden',
  sent: 'Gesendet',
  queued: 'In Warteschlange',
  tokens: 'Tokens',
  openRouterCredit: 'OpenRouter-Guthaben',
  error: 'Fehler',
  budgetLimitReached: ' — Limit erreicht (nur Hinweis; Suchen laufen weiter)',
  budgetNearTarget: ' — nahe am Ziel',
  budgetLine: (month, spent, cap, suffix) =>
    `Monatliche LLM (${month}): ~$${spent} / $${cap}${suffix}`,
  monthlyBudgetAlertTitle: '⚠️ Monatliches Budgetlimit',
  monthlyBudgetAlertBody: (cap, spent) =>
    `Monatliches Limit von $${cap} erreicht (geschätzte Ausgaben ~$${spent}). Zum Vermeiden von Überschreitungen Suchen pausieren: "paused": true in data/control-state.json oder /pause.`,
  scheduleIntervalLine: (minutes) => `Intervall: alle ${minutes} Min.`,
  scheduleModeHoursLine: (hours, timezone) => `Zeitplan (${timezone}): ${hours}`,
  controlStateScheduleHint:
    'Zeitplan: data/control-state.json — scheduleMode "hours"|"interval", pollIntervalMinutes 15|30|60',
  sessionSpendUnavailable: 'Sitzungskosten: nicht verfügbar',
  sessionSpendEmpty: 'Sitzungskosten: ~$0.000 (noch keine LLM-Aufrufe)',
  sessionSpend: (usd, calls, tokens) =>
    `Sitzungskosten: ~$${usd} (${calls} LLM-Aufrufe, ${tokens} Tokens)`,
  pollCompleteColdStart: (mode, footer) =>
    `${mode} abgeschlossen.\nErster Lauf: vorhandene RSS-Einträge erfasst, keine Zusammenfassungen gesendet. Neue Artikel werden bei späteren Suchen gemeldet.${footer}`,
  pollCompleteNoNews: (mode, footer) =>
    `${mode} abgeschlossen.\nKeine neuen Artikel — RSS-Feeds gescannt, nichts Neues.${footer}`,
  pollCompleteSent: (mode, count, footer) =>
    `${mode} abgeschlossen.\n${count} Artikel an Telegram gesendet.${footer}`,
  pollCompleteFiltered: (mode, footer) =>
    `${mode} abgeschlossen.\nVerarbeitet, aber keine Zusammenfassungen (Relevanzschwelle oder Filter).${footer}`,
  pollCompleteEmpty: (mode, footer) =>
    `${mode} abgeschlossen.\nKeine neuen Artikel gefunden.${footer}`,
  pollModeNormal: 'Suche',
  pollModeFast: 'Schnelle Suche',
  pollMode3D: '3D-KI-Suche',
  cooldownMinutes: (min) => ` (${min} Min.)`,
  threeDStatusOn: 'AN',
  threeDStatusOff: 'AUS',
  statusLabel: 'Status',
  threeDEnabledSchedule: (hour, timezone) =>
    `🧊 3D-KI-Nachrichtenebene aktiviert.\nGeplante Suche: ${hour}:00 (${timezone}).`,
  lastPollInProgress: 'läuft',
  modeNormalShort: 'normal',
  modeFastShort: 'schnell',
  profileLabel: 'Profil',
  feedsLabel: 'Quellen',
  llmCallsLabel: 'LLM-Aufrufe',
  creditRemaining: (usd) => `OpenRouter-Guthaben: $${usd} verbleibend`,
  metricDiscovered: 'gefunden',
  metricSent: 'gesendet',
  metricFiltered: 'gefiltert',
  metricQueued: 'Warteschlange',
  metricDuration: 'Dauer',
  upstreamSourceLabel: 'Quellprojekt',
};

const frMessages: BotMessages = {
  unauthorized: "Vous n'êtes pas autorisé à utiliser ce bot.",
  stopped: 'Recherches planifiées arrêtées. Utilisez /pollnow pour une recherche manuelle.',
  started: 'Recherches planifiées reprises.',
  pollStarted: 'Recherche manuelle démarrée…',
  pollStartedFast: 'Recherche manuelle rapide (scraping désactivé, limites basses)…',
  pollStarted3D: '🧊 Recherche manuelle 3D IA démarrée…',
  pollAlreadyRunning: 'Une recherche est déjà en cours. Veuillez patienter.',
  pollCooldown: 'Veuillez patienter avant de lancer une autre recherche manuelle.',
  pollFailed: 'Échec de la recherche. Consultez les logs.',
  rateLimited: 'Trop de commandes. Attendez une minute.',
  statusPaused: 'Statut : En pause',
  statusRunning: 'Statut : Actif',
  nextRun: 'Prochaine recherche',
  startupPollNowHint: 'Recherche immédiate : /pollnow.',
  unknownCommand: 'Commande inconnue. Voir',
  unknownCommandHint: '/commands',
  langSwitched: (displayName) =>
    `Langue du menu et des notifications changée en ${displayName}.`,
  langCurrent: (displayName) => `Langue : ${displayName}`,
  langPickerTitle:
    '🌍 Choisissez une langue — résumés et notifications utiliseront cette langue :',
  langPickerCloseButton: '✖ Fermer',
  langPickerClosed: 'Menu des langues fermé.',
  langSwitchedTo: (displayName) => `Langue changée en ${displayName}`,
  contentLangCurrent: (displayName) => `Langue : ${displayName}`,
  threeDEnabled: '🧊 Couche actualités 3D IA activée.',
  threeDDisabled: '🧊 Couche actualités 3D IA désactivée.',
  threeDManualBlocked:
    'Recherches 3D planifiées désactivées. Utilisez /3dainewsopen pour les activer.',
  pollInProgress: 'Recherche en cours',
  scheduleHours: 'Planning',
  feedProfile: 'Profil de flux',
  threeDNews: 'Actualités 3D',
  lastPollNone: 'Dernière recherche : aucune',
  lastPoll: 'Dernière recherche',
  duration: 'Durée',
  phase: 'Phase',
  discovered: 'Découvertes',
  sent: 'Envoyées',
  queued: 'En file',
  tokens: 'Jetons',
  openRouterCredit: 'Crédit OpenRouter',
  error: 'Erreur',
  budgetLimitReached: ' — limite atteinte (alerte uniquement ; les recherches continuent)',
  budgetNearTarget: ' — proche de l’objectif',
  budgetLine: (month, spent, cap, suffix) =>
    `LLM mensuel (${month}) : ~$${spent} / $${cap}${suffix}`,
  monthlyBudgetAlertTitle: '⚠️ Limite budgétaire mensuelle',
  monthlyBudgetAlertBody: (cap, spent) =>
    `Limite mensuelle de $${cap} atteinte (dépenses estimées ~$${spent}). Pour éviter le dépassement, mettez en pause : "paused": true dans data/control-state.json ou /pause.`,
  scheduleIntervalLine: (minutes) => `Intervalle : toutes les ${minutes} min`,
  scheduleModeHoursLine: (hours, timezone) => `Planning (${timezone}) : ${hours}`,
  controlStateScheduleHint:
    'Planning : data/control-state.json — scheduleMode "hours"|"interval", pollIntervalMinutes 15|30|60',
  sessionSpendUnavailable: 'Dépenses session : indisponible',
  sessionSpendEmpty: 'Dépenses session : ~$0.000 (aucun appel LLM)',
  sessionSpend: (usd, calls, tokens) =>
    `Dépenses session : ~$${usd} (${calls} appels LLM, ${tokens} jetons)`,
  pollCompleteColdStart: (mode, footer) =>
    `${mode} terminée.\nPremier lancement : articles RSS enregistrés, pas de résumés. Les nouveaux articles seront signalés plus tard.${footer}`,
  pollCompleteNoNews: (mode, footer) =>
    `${mode} terminée.\nAucun nouvel article — flux RSS scannés, rien de nouveau.${footer}`,
  pollCompleteSent: (mode, count, footer) =>
    `${mode} terminée.\n${count} article(s) envoyé(s) sur Telegram.${footer}`,
  pollCompleteFiltered: (mode, footer) =>
    `${mode} terminée.\nTraité mais aucun résumé (seuil ou filtres).${footer}`,
  pollCompleteEmpty: (mode, footer) =>
    `${mode} terminée.\nAucun nouvel article trouvé.${footer}`,
  pollModeNormal: 'Recherche',
  pollModeFast: 'Recherche rapide',
  pollMode3D: 'Recherche 3D IA',
  cooldownMinutes: (min) => ` (${min} min)`,
  threeDStatusOn: 'ACTIF',
  threeDStatusOff: 'INACTIF',
  statusLabel: 'Statut',
  threeDEnabledSchedule: (hour, timezone) =>
    `🧊 Couche 3D IA activée.\nRecherche planifiée : ${hour}:00 (${timezone}).`,
  lastPollInProgress: 'en cours',
  modeNormalShort: 'normal',
  modeFastShort: 'rapide',
  profileLabel: 'profil',
  feedsLabel: 'flux',
  llmCallsLabel: 'appels LLM',
  creditRemaining: (usd) => `Crédit OpenRouter : $${usd} restant`,
  metricDiscovered: 'découvertes',
  metricSent: 'envoyées',
  metricFiltered: 'filtrées',
  metricQueued: 'en file',
  metricDuration: 'durée',
  upstreamSourceLabel: 'Projet source',
};

const esMessages: BotMessages = {
  unauthorized: 'No está autorizado para usar este bot.',
  stopped: 'Búsquedas programadas detenidas. Use /pollnow para búsqueda manual.',
  started: 'Búsquedas programadas reanudadas.',
  pollStarted: 'Búsqueda manual iniciada…',
  pollStartedFast: 'Búsqueda manual rápida (scraping desactivado, límites bajos)…',
  pollStarted3D: '🧊 Búsqueda manual 3D IA iniciada…',
  pollAlreadyRunning: 'Ya hay una búsqueda en curso. Espere, por favor.',
  pollCooldown: 'Espere antes de iniciar otra búsqueda manual.',
  pollFailed: 'La búsqueda falló. Revise los registros.',
  rateLimited: 'Demasiados comandos. Espere un minuto.',
  statusPaused: 'Estado: Pausado',
  statusRunning: 'Estado: Activo',
  nextRun: 'Próxima búsqueda',
  startupPollNowHint: 'Búsqueda inmediata: /pollnow.',
  unknownCommand: 'Comando desconocido. Vea',
  unknownCommandHint: '/commands',
  langSwitched: (displayName) =>
    `Idioma del menú y notificaciones cambiado a ${displayName}.`,
  langCurrent: (displayName) => `Idioma: ${displayName}`,
  langPickerTitle:
    '🌍 Elija un idioma — los resúmenes y notificaciones usarán este idioma:',
  langPickerCloseButton: '✖ Cerrar',
  langPickerClosed: 'Menú de idiomas cerrado.',
  langSwitchedTo: (displayName) => `Idioma cambiado a ${displayName}`,
  contentLangCurrent: (displayName) => `Idioma: ${displayName}`,
  threeDEnabled: '🧊 Capa de noticias 3D IA activada.',
  threeDDisabled: '🧊 Capa de noticias 3D IA desactivada.',
  threeDManualBlocked:
    'Búsquedas 3D programadas desactivadas. Use /3dainewsopen para activarlas.',
  pollInProgress: 'Búsqueda en curso',
  scheduleHours: 'Horario',
  feedProfile: 'Perfil de feeds',
  threeDNews: 'Noticias 3D',
  lastPollNone: 'Última búsqueda: ninguna aún',
  lastPoll: 'Última búsqueda',
  duration: 'Duración',
  phase: 'Fase',
  discovered: 'Descubiertas',
  sent: 'Enviadas',
  queued: 'En cola',
  tokens: 'Tokens',
  openRouterCredit: 'Crédito OpenRouter',
  error: 'Error',
  budgetLimitReached: ' — límite alcanzado (solo aviso; las búsquedas continúan)',
  budgetNearTarget: ' — cerca del objetivo',
  budgetLine: (month, spent, cap, suffix) =>
    `LLM mensual (${month}): ~$${spent} / $${cap}${suffix}`,
  monthlyBudgetAlertTitle: '⚠️ Límite de presupuesto mensual',
  monthlyBudgetAlertBody: (cap, spent) =>
    `Límite mensual de $${cap} alcanzado (gasto estimado ~$${spent}). Para evitar excederlo, pause las búsquedas: "paused": true en data/control-state.json o /pause.`,
  scheduleIntervalLine: (minutes) => `Intervalo: cada ${minutes} min`,
  scheduleModeHoursLine: (hours, timezone) => `Horario (${timezone}): ${hours}`,
  controlStateScheduleHint:
    'Horario: data/control-state.json — scheduleMode "hours"|"interval", pollIntervalMinutes 15|30|60',
  sessionSpendUnavailable: 'Gasto de sesión: no disponible',
  sessionSpendEmpty: 'Gasto de sesión: ~$0.000 (sin llamadas LLM)',
  sessionSpend: (usd, calls, tokens) =>
    `Gasto de sesión: ~$${usd} (${calls} llamadas LLM, ${tokens} tokens)`,
  pollCompleteColdStart: (mode, footer) =>
    `${mode} completada.\nPrimera ejecución: artículos RSS registrados, sin resúmenes. Los nuevos se reportarán después.${footer}`,
  pollCompleteNoNews: (mode, footer) =>
    `${mode} completada.\nSin artículos nuevos — feeds RSS escaneados, nada nuevo.${footer}`,
  pollCompleteSent: (mode, count, footer) =>
    `${mode} completada.\n${count} artículo(s) enviado(s) a Telegram.${footer}`,
  pollCompleteFiltered: (mode, footer) =>
    `${mode} completada.\nProcesado pero sin resúmenes (umbral o filtros).${footer}`,
  pollCompleteEmpty: (mode, footer) =>
    `${mode} completada.\nNo se encontraron artículos nuevos.${footer}`,
  pollModeNormal: 'Búsqueda',
  pollModeFast: 'Búsqueda rápida',
  pollMode3D: 'Búsqueda 3D IA',
  cooldownMinutes: (min) => ` (${min} min)`,
  threeDStatusOn: 'ACTIVO',
  threeDStatusOff: 'INACTIVO',
  statusLabel: 'Estado',
  threeDEnabledSchedule: (hour, timezone) =>
    `🧊 Capa 3D IA activada.\nBúsqueda programada: ${hour}:00 (${timezone}).`,
  lastPollInProgress: 'en curso',
  modeNormalShort: 'normal',
  modeFastShort: 'rápida',
  profileLabel: 'perfil',
  feedsLabel: 'fuentes',
  llmCallsLabel: 'llamadas LLM',
  creditRemaining: (usd) => `Crédito OpenRouter: $${usd} restante`,
  metricDiscovered: 'descubiertas',
  metricSent: 'enviadas',
  metricFiltered: 'filtradas',
  metricQueued: 'en cola',
  metricDuration: 'duración',
  upstreamSourceLabel: 'Proyecto original',
};

export const EXTRA_MESSAGES = {
  de: deMessages,
  fr: frMessages,
  es: esMessages,
} as const;

export const EXTRA_MENU_STATIC = {
  de: [
    { command: 'commands', description: 'Alle Befehle auflisten' },
    { command: 'status', description: 'Info' },
    { command: 'pollnow', description: 'Jetzt suchen' },
  ],
  fr: [
    { command: 'commands', description: 'Lister les commandes' },
    { command: 'status', description: 'À propos' },
    { command: 'pollnow', description: 'Rechercher maintenant' },
  ],
  es: [
    { command: 'commands', description: 'Listar comandos' },
    { command: 'status', description: 'Acerca de' },
    { command: 'pollnow', description: 'Buscar ahora' },
  ],
} as const;

export const EXTRA_MENU_SCHEDULE_TOGGLE = {
  de: {
    pause: { command: 'pause', description: 'Geplante Suchen pausieren' },
    resume: { command: 'resume', description: 'Geplante Suchen fortsetzen' },
  },
  fr: {
    pause: { command: 'pause', description: 'Arrêter les recherches planifiées' },
    resume: { command: 'resume', description: 'Reprendre les recherches planifiées' },
  },
  es: {
    pause: { command: 'pause', description: 'Detener búsquedas programadas' },
    resume: { command: 'resume', description: 'Reanudar búsquedas programadas' },
  },
} as const;

export const EXTRA_MENU_THREED_TOGGLE = {
  de: {
    enable: { command: THREED_BOT_COMMANDS.enable, description: '3D-KI-Nachrichten einschalten' },
    disable: { command: THREED_BOT_COMMANDS.disable, description: '3D-KI-Nachrichten ausschalten' },
  },
  fr: {
    enable: { command: THREED_BOT_COMMANDS.enable, description: 'Activer actualités 3D IA' },
    disable: { command: THREED_BOT_COMMANDS.disable, description: 'Désactiver actualités 3D IA' },
  },
  es: {
    enable: { command: THREED_BOT_COMMANDS.enable, description: 'Activar noticias 3D IA' },
    disable: { command: THREED_BOT_COMMANDS.disable, description: 'Desactivar noticias 3D IA' },
  },
} as const;

export const EXTRA_HELP_LINES = {
  de: [
    { cmd: '/status', desc: 'Info' },
    { cmd: '/pollnow', desc: 'Jetzt suchen' },
    { cmd: '/pause', desc: 'Geplante Suchen pausieren' },
    { cmd: '/resume', desc: 'Geplante Suchen fortsetzen' },
    { cmd: '/commands', desc: 'Befehle auflisten' },
    { cmd: `/${BOT_LANGUAGES_COMMAND}`, desc: 'Sprache wählen' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Suchen einschalten' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Suchen ausschalten' },
  ],
  fr: [
    { cmd: '/status', desc: 'À propos' },
    { cmd: '/pollnow', desc: 'Rechercher maintenant' },
    { cmd: '/pause', desc: 'Arrêter les recherches planifiées' },
    { cmd: '/resume', desc: 'Reprendre les recherches planifiées' },
    { cmd: '/commands', desc: 'Lister les commandes' },
    { cmd: `/${BOT_LANGUAGES_COMMAND}`, desc: 'Choisir la langue' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Activer les recherches' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Désactiver les recherches' },
  ],
  es: [
    { cmd: '/status', desc: 'Acerca de' },
    { cmd: '/pollnow', desc: 'Buscar ahora' },
    { cmd: '/pause', desc: 'Detener búsquedas programadas' },
    { cmd: '/resume', desc: 'Reanudar búsquedas programadas' },
    { cmd: '/commands', desc: 'Listar comandos' },
    { cmd: `/${BOT_LANGUAGES_COMMAND}`, desc: 'Elegir idioma' },
    { cmd: `/${THREED_BOT_COMMANDS.enable}`, desc: 'Activar búsquedas' },
    { cmd: `/${THREED_BOT_COMMANDS.disable}`, desc: 'Desactivar búsquedas' },
  ],
} as const;

export const HELP_HEADERS: Record<'de' | 'fr' | 'es' | 'tr' | 'en', string> = {
  tr: '📋 Komutlar:',
  en: '📋 Commands:',
  de: '📋 Befehle:',
  fr: '📋 Commandes :',
  es: '📋 Comandos:',
};

export const LOCALE_BCP47: Record<'tr' | 'en' | 'de' | 'fr' | 'es', string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
};
