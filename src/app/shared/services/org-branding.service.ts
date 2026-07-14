import { Injectable, signal } from '@angular/core';

export interface OrgBranding {
  appName: string;
  brandColor: string;
  logoDataUrl: string | null;
}

const STORAGE_KEY = 'caltos_org_branding';

const DEFAULT_BRANDING: OrgBranding = {
  appName: 'Caltos',
  brandColor: '#0053a6',
  logoDataUrl: null,
};

function loadFromStorage(): OrgBranding {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_BRANDING;
}

/**
 * Single source of truth for the org's app name / brand color / logo, read by
 * Organization Settings (writer), the product-creation wizards' brand preview,
 * and the public /apply portal header — all separate component trees that can
 * only share this via persisted storage, not in-memory state.
 */
@Injectable({ providedIn: 'root' })
export class OrgBrandingService {
  private readonly _branding = signal<OrgBranding>(loadFromStorage());
  readonly branding = this._branding.asReadonly();

  set(partial: Partial<OrgBranding>) {
    this._branding.update((current) => {
      const next = { ...current, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
}
