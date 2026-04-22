import { getConfig } from './config';
import { initializeConsent, updateConsent, getConsentState } from './consent';
import { initializePageviewListener } from './pageview';
import { initializeClickListener } from './clicks';
import { initializeFormListener } from './forms';

const config = getConfig();

initializeConsent();

// Auto-configure Google Ads tag if data-google-ads-id is set.
// ensureGtag() in initializeConsent has already guaranteed window.gtag exists.
if (config.googleAdsId && typeof window.gtag === 'function') {
  window.gtag('config', config.googleAdsId);
}

initializePageviewListener();
initializeClickListener();
initializeFormListener();

export { updateConsent, getConsentState };
