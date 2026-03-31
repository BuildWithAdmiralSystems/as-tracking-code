import { getConfig } from './config';
import { initializeConsent, updateConsent, getConsentState } from './consent';
import { initializePageviewListener } from './pageview';
import { initializeClickListener } from './clicks';
import { initializeFormListener } from './forms';

getConfig();

initializeConsent();

initializePageviewListener();
initializeClickListener();
initializeFormListener();

export { updateConsent, getConsentState };
