import { getConfig } from './config';

declare global {
  interface Window {
    cioanalytics: any;
  }
}

function isCustomerioAvailable(): boolean {
  return (
    window.cioanalytics &&
    typeof window.cioanalytics.track === 'function' &&
    typeof window.cioanalytics.identify === 'function' &&
    typeof window.cioanalytics.page === 'function'
  );
}

export function captureCustomerioEvent(eventName: string, properties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (cioanalytics) is not available.');
    return;
  }
  window.cioanalytics.track(eventName, properties);
}

export function identifyCustomerioUser(userProperties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (cioanalytics) is not available.');
    return;
  }

  const userIdField = getConfig().customerioUserIdField;
  const id = userProperties[userIdField];

  if (id === undefined || id === null || String(id).length === 0) {
    console.warn(
      `Customer.io: no value for the configured id field "${userIdField}" in identify properties. Identify skipped (Journeys ignores anonymous identify calls).`
    );
    return;
  }

  // cioanalytics.identify(userId, traits) — userId is positional, traits is the dict.
  window.cioanalytics.identify(String(id), userProperties);
}

export function pageCustomerio(pageName: string, properties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (cioanalytics) is not available.');
    return;
  }
  // cioanalytics.page([category], [name], [properties], ...) — (name, properties) overload.
  window.cioanalytics.page(pageName, properties);
}
