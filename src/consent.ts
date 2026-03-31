import { getConfig } from './config';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export type ConsentStatus = 'granted' | 'denied';

export interface ConsentState {
  functionality_storage: ConsentStatus;
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
  personalization_storage: ConsentStatus;
  security_storage: ConsentStatus;
}

type ConsentKey = keyof ConsentState;

const STORAGE_KEY = 'consentMode';

const ALL_CONSENT_KEYS: ConsentKey[] = [
  'functionality_storage',
  'analytics_storage',
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'personalization_storage',
  'security_storage',
];

const CHECKBOX_ID_MAP: Record<ConsentKey, string> = {
  functionality_storage: 'as-consent-functionality',
  analytics_storage: 'as-consent-analytics',
  ad_storage: 'as-consent-ad-storage',
  ad_user_data: 'as-consent-ad-user-data',
  ad_personalization: 'as-consent-ad-personalization',
  personalization_storage: 'as-consent-personalization',
  security_storage: 'as-consent-security',
};

function allDenied(): ConsentState {
  return {
    functionality_storage: 'denied',
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    personalization_storage: 'denied',
    security_storage: 'denied',
  };
}

function allGranted(): ConsentState {
  return {
    functionality_storage: 'granted',
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted',
  };
}

function rejectAllState(): ConsentState {
  return {
    ...allDenied(),
    functionality_storage: 'granted',
  };
}

function ensureGtag(): void {
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
}

function readStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const state = allDenied();
    for (const key of ALL_CONSENT_KEYS) {
      if (parsed[key] === 'granted') {
        state[key] = 'granted';
      }
    }
    return state;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pushConsentUpdate(state: ConsentState): void {
  ensureGtag();
  window.gtag('consent', 'update', { ...state });
}

let currentConsent: ConsentState = allDenied();

export function isAnalyticsGranted(): boolean {
  return currentConsent.analytics_storage === 'granted';
}

export function isAdUserDataGranted(): boolean {
  return currentConsent.ad_user_data === 'granted';
}

export function getConsentState(): ConsentState {
  return { ...currentConsent };
}

export function updateConsent(state: Partial<ConsentState>): void {
  for (const key of ALL_CONSENT_KEYS) {
    if (state[key] === 'granted' || state[key] === 'denied') {
      currentConsent[key] = state[key]!;
    }
  }
  saveConsent(currentConsent);
  pushConsentUpdate(currentConsent);
}

function populateCheckboxes(): void {
  for (const key of ALL_CONSENT_KEYS) {
    const checkbox = document.getElementById(CHECKBOX_ID_MAP[key]) as HTMLInputElement | null;
    if (!checkbox) continue;
    const isGranted = currentConsent[key] === 'granted';
    checkbox.checked = isGranted;

    const customDiv = checkbox.previousElementSibling;
    if (customDiv) {
      customDiv.classList.toggle('w--redirected-checked', isGranted);
    }
  }
}

function readCheckboxStates(): ConsentState {
  const state = allDenied();
  for (const key of ALL_CONSENT_KEYS) {
    const checkbox = document.getElementById(CHECKBOX_ID_MAP[key]) as HTMLInputElement | null;
    if (checkbox && checkbox.checked) {
      state[key] = 'granted';
    }
  }
  state.functionality_storage = 'granted';
  return state;
}

function hideBanner(): void {
  const banner = document.getElementById('as-cookie-banner');
  if (banner) banner.style.display = 'none';
}

function showBanner(): void {
  const banner = document.getElementById('as-cookie-banner');
  if (banner) banner.style.display = 'block';
}

function hideOptions(): void {
  const options = document.getElementById('as-cookie-options');
  if (options) options.style.height = '0px';
}

function applyConsent(state: ConsentState): void {
  currentConsent = state;
  saveConsent(state);
  pushConsentUpdate(state);
  hideBanner();
}

function wireBanner(): void {
  const banner = document.getElementById('as-cookie-banner');
  if (!banner) return;

  const acceptAll = document.getElementById('as-btn-accept-all');
  if (acceptAll) {
    acceptAll.addEventListener('click', () => applyConsent(allGranted()));
  }

  const rejectAll = document.getElementById('as-btn-reject-all');
  if (rejectAll) {
    rejectAll.addEventListener('click', () => applyConsent(rejectAllState()));
  }

  const acceptSome = document.getElementById('as-btn-accept-some');
  if (acceptSome) {
    acceptSome.addEventListener('click', () => applyConsent(readCheckboxStates()));
  }

  const cookieIcon = document.getElementById('as-cookie-icon');
  if (cookieIcon) {
    cookieIcon.addEventListener('click', () => {
      populateCheckboxes();
      hideOptions();
      showBanner();
    });
  }
}

export function initializeConsent(): void {
  const config = getConfig();

  ensureGtag();

  if (config.ga4ConsentDefaults === 'denied') {
    window.gtag('consent', 'default', { ...allDenied() });
  }

  const stored = readStoredConsent();
  if (stored) {
    currentConsent = stored;
    pushConsentUpdate(stored);
  } else {
    currentConsent = allDenied();
  }

  const wireOnReady = () => {
    wireBanner();
    if (!stored) {
      showBanner();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnReady);
  } else {
    wireOnReady();
  }
}
