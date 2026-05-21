import { getConfig } from './config';

declare global {
  interface Window {
    _cio: any;
  }
}

function isCustomerioAvailable(): boolean {
  return (
    window._cio &&
    typeof window._cio.track === 'function' &&
    typeof window._cio.identify === 'function' &&
    typeof window._cio.page === 'function'
  );
}

export function captureCustomerioEvent(eventName: string, properties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (_cio) is not available.');
    return;
  }
  window._cio.track(eventName, properties);
}

export function identifyCustomerioUser(userProperties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (_cio) is not available.');
    return;
  }

  const userIdField = getConfig().customerioUserIdField;
  const id = userProperties[userIdField];

  if (id === undefined || id === null || String(id).length === 0) {
    console.warn(
      `Customer.io: no value for the configured id field "${userIdField}" in identify properties. Identify skipped (Customer.io requires an id).`
    );
    return;
  }

  window._cio.identify({ id: String(id), ...userProperties });
}

export function pageCustomerio(pageName: string, properties: Record<string, any>): void {
  if (!isCustomerioAvailable()) {
    console.error('Customer.io (_cio) is not available.');
    return;
  }
  window._cio.page(pageName, properties);
}
