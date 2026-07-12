import { Injectable } from '@angular/core';

/**
 * Outbound delivery channels to a borrower — distinct from NotificationService,
 * which is the lender's in-app notification bell. This is "did the message
 * actually reach the customer," with a configurable fallback chain per event.
 */
export type DeliveryChannel = 'sms' | 'email' | 'push';

export interface DeliveryTarget {
  phone?: string;
  email?: string;
}

export interface DeliveryAttempt {
  channel: DeliveryChannel;
  success: boolean;
  reason?: string;
}

export interface DeliveryResult {
  delivered: boolean;
  channel: DeliveryChannel | null;
  attempts: DeliveryAttempt[];
}

const PHONE_PATTERN = /^0\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({ providedIn: 'root' })
export class NotificationDeliveryService {
  /** Per-event channel priority, tried in order until one succeeds. */
  private readonly channelPriority: Record<string, DeliveryChannel[]> = {
    'loan-status-update': ['sms', 'email', 'push'],
    default: ['sms', 'email', 'push'],
  };

  /**
   * Attempts delivery down the configured channel list for this event, stopping at the
   * first success. 'push' (the in-app/dashboard fallback) always succeeds, so a message
   * only ever fails outright if every configured channel for the event lacks it.
   */
  send(event: string, target: DeliveryTarget, message: string): DeliveryResult {
    const channels = this.channelPriority[event] ?? this.channelPriority['default'];
    const attempts: DeliveryAttempt[] = [];
    for (const channel of channels) {
      const attempt = this.attemptChannel(channel, target, message);
      attempts.push(attempt);
      if (attempt.success) return { delivered: true, channel, attempts };
    }
    return { delivered: false, channel: null, attempts };
  }

  private attemptChannel(channel: DeliveryChannel, target: DeliveryTarget, _message: string): DeliveryAttempt {
    if (channel === 'sms') {
      const valid = !!target.phone && PHONE_PATTERN.test(target.phone);
      return { channel, success: valid, reason: valid ? undefined : 'Invalid or missing phone number' };
    }
    if (channel === 'email') {
      const valid = !!target.email && EMAIL_PATTERN.test(target.email);
      return { channel, success: valid, reason: valid ? undefined : 'Invalid or missing email address' };
    }
    // 'push' has no external address to fail against — it's the always-available last resort.
    return { channel: 'push', success: true };
  }
}
