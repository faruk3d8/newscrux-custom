// src/poll-progress.ts — Log-only poll progress + heartbeat (no Telegram noise)

import { config } from './config.js';
import { createLogger } from './logger.js';
import { setPollPhase } from './poll-state.js';

const log = createLogger('progress');

export class PollProgressReporter {
  private lastHeartbeatAt = 0;
  private lastPhase = '';
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.heartbeat();
    }, config.progressHeartbeatMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  phase(message: string): void {
    this.lastPhase = message;
    setPollPhase(message);
    log.info(message);
  }

  detail(message: string): void {
    log.info(message);
  }

  heartbeat(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastHeartbeatAt < config.progressHeartbeatMs) {
      return;
    }
    this.lastHeartbeatAt = now;
    if (!this.lastPhase) return;
    log.info(`Still running… (${this.lastPhase})`);
  }
}
