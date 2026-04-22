import { getConfig } from './config';
import {
  normalizeEventName,
  validateEventName,
  validateAndTruncateParams,
  validateAndTruncateUserProperties,
  warnMissingRecommendedParams,
} from './ga4-validator';

function isGtagAvailable(): boolean {
  return typeof window.gtag === 'function';
}

export function captureGA4Event(eventName: string, properties: Record<string, any>): void {
  if (!isGtagAvailable()) {
    console.error('GA4: window.gtag is not available.');
    return;
  }

  const normalized = normalizeEventName(eventName);
  const validation = validateEventName(normalized);
  if (!validation.valid) {
    console.error(validation.error);
    return;
  }

  const truncated = validateAndTruncateParams(properties);
  warnMissingRecommendedParams(normalized, truncated);
  window.gtag('event', normalized, truncated);
}

export function captureGA4EcommerceEvent(
  ecommerceEventName: string,
  eventParams: Record<string, any>,
  items: Record<string, any>[]
): void {
  if (!isGtagAvailable()) {
    console.error('GA4: window.gtag is not available.');
    return;
  }

  const validation = validateEventName(ecommerceEventName);
  if (!validation.valid) {
    console.error(validation.error);
    return;
  }

  const truncated = validateAndTruncateParams(eventParams);
  window.gtag('event', ecommerceEventName, { ...truncated, items });
}

export function captureGA4Conversion(
  sendTo: string,
  properties: Record<string, any>
): void {
  if (!isGtagAvailable()) {
    console.error('GA4: window.gtag is not available.');
    return;
  }

  const truncated = validateAndTruncateParams(properties);
  window.gtag('event', 'conversion', { send_to: sendTo, ...truncated });
}

export function identifyGA4User(userProperties: Record<string, any>): void {
  if (!isGtagAvailable()) {
    console.error('GA4: window.gtag is not available.');
    return;
  }

  const config = getConfig();
  const userIdField = config.ga4UserIdField;

  if (userProperties[userIdField]) {
    const userId = String(userProperties[userIdField]);
    window.gtag('set', { user_id: userId });
  }

  const propsWithoutId: Record<string, any> = {};
  for (const key of Object.keys(userProperties)) {
    if (key !== userIdField) {
      propsWithoutId[key] = userProperties[key];
    }
  }

  if (Object.keys(propsWithoutId).length > 0) {
    const truncated = validateAndTruncateUserProperties(propsWithoutId);
    window.gtag('set', { user_properties: truncated });
  }
}
