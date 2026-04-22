import { getConfig } from './config';
import { isAnalyticsGranted, isAdUserDataGranted } from './consent';
import { capturePostHogEvent, identifyPostHogUser } from './posthog-adapter';
import {
  captureGA4Event,
  captureGA4EcommerceEvent,
  captureGA4Conversion,
  identifyGA4User,
} from './ga4-adapter';

export function resolveConversionSendTo(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // Already a full send_to (contains "/" or starts with AW-/DC-)
  if (trimmed.includes('/') || trimmed.startsWith('AW-') || trimmed.startsWith('DC-')) {
    return trimmed;
  }

  // Bare label — prepend configured Google Ads ID
  const config = getConfig();
  if (!config.googleAdsId) {
    console.warn(
      `Tracker: data-ga4-conversion="${trimmed}" is a bare label but no data-google-ads-id is configured on the script tag. Conversion skipped.`
    );
    return null;
  }
  return `${config.googleAdsId}/${trimmed}`;
}

export function captureEvent(
  eventName: string,
  properties: Record<string, any>,
  conversionSendTo?: string | null
): void {
  const config = getConfig();

  if (config.devMode) {
    console.log('[Tracker DEV] captureEvent', { eventName, properties, conversionSendTo });
    return;
  }

  if (!isAnalyticsGranted()) return;

  if (config.posthogEnabled) {
    capturePostHogEvent(eventName, properties);
  }

  if (config.ga4Ids.length > 0) {
    captureGA4Event(eventName, properties);
  }

  if (conversionSendTo) {
    captureGA4Conversion(conversionSendTo, properties);
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
  items: Record<string, any>[],
  conversionSendTo?: string | null
): void {
  const config = getConfig();

  if (config.devMode) {
    console.log('[Tracker DEV] captureEcommerceEvent', {
      ecommerceEventName,
      eventParams,
      items,
      conversionSendTo,
    });
    return;
  }

  if (!isAnalyticsGranted()) return;

  if (config.ga4Ids.length > 0) {
    captureGA4EcommerceEvent(ecommerceEventName, eventParams, items);
  }

  if (conversionSendTo) {
    captureGA4Conversion(conversionSendTo, eventParams);
  }
}
