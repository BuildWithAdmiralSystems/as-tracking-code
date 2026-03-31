import { getConfig } from './config';
import { isAnalyticsGranted, isAdUserDataGranted } from './consent';
import { capturePostHogEvent, identifyPostHogUser } from './posthog-adapter';
import { captureGA4Event, captureGA4EcommerceEvent, identifyGA4User } from './ga4-adapter';

export function captureEvent(eventName: string, properties: Record<string, any>): void {
  const config = getConfig();

  if (config.devMode) {
    console.log('[Tracker DEV] captureEvent', { eventName, properties });
    return;
  }

  if (!isAnalyticsGranted()) return;

  if (config.posthogEnabled) {
    capturePostHogEvent(eventName, properties);
  }

  if (config.ga4Ids.length > 0) {
    captureGA4Event(eventName, properties);
  }
}

export function identifyUser(userProperties: Record<string, any>): void {
  const config = getConfig();

  if (config.devMode) {
    console.log('[Tracker DEV] identifyUser', { userProperties });
    return;
  }

  if (!isAnalyticsGranted()) return;

  if (config.posthogEnabled) {
    identifyPostHogUser(userProperties);
  }

  if (config.ga4Ids.length > 0 && isAdUserDataGranted()) {
    identifyGA4User(userProperties);
  }
}

export function captureEcommerceEvent(
  ecommerceEventName: string,
  eventParams: Record<string, any>,
  items: Record<string, any>[]
): void {
  const config = getConfig();

  if (config.devMode) {
    console.log('[Tracker DEV] captureEcommerceEvent', { ecommerceEventName, eventParams, items });
    return;
  }

  if (!isAnalyticsGranted()) return;

  if (config.ga4Ids.length > 0) {
    captureGA4EcommerceEvent(ecommerceEventName, eventParams, items);
  }
}
