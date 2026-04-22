import { getConfig } from './config';

const GA4_MAX_PARAMS = 25;
const GA4_MAX_PARAM_NAME_LENGTH = 40;
const GA4_MAX_PARAM_VALUE_LENGTH = 100;
const GA4_MAX_EVENT_NAME_LENGTH = 40;
const GA4_MAX_USER_PROPERTY_NAME_LENGTH = 24;
const GA4_MAX_USER_PROPERTY_VALUE_LENGTH = 36;
const GA4_MAX_USER_PROPERTIES = 25;

const RESERVED_EVENT_NAMES = new Set([
  'ad_impression', 'app_remove', 'app_store_refund',
  'app_store_subscription_cancel', 'app_store_subscription_renew',
  'click', 'error', 'file_download', 'first_open', 'first_visit',
  'form_start', 'form_submit', 'in_app_purchase', 'page_view',
  'scroll', 'session_start', 'user_engagement', 'view_complete',
  'video_progress', 'video_start', 'view_search_results',
]);

const RESERVED_PARAM_NAMES = new Set([
  'cid', 'customer_id', 'customerid', 'dclid', 'gclid',
  'session_id', 'sessionid', 'sfmc_id', 'sid', 'srsltid', 'uid',
  'user_id', 'userid',
]);

const RESERVED_PARAM_PREFIXES = ['_', 'firebase_', 'ga_', 'google_', 'gtag.'];
const RESERVED_EVENT_PREFIXES = ['query_id'];

const GA4_RECOMMENDED_EVENT_PARAMS: Record<string, string[]> = {
  generate_lead: ['currency', 'value'],
  login: ['method'],
  sign_up: ['method'],
  search: ['search_term'],
  select_content: ['content_type', 'item_id'],
  share: ['method', 'content_type', 'item_id'],
};

const RESERVED_USER_PROPERTY_NAMES = new Set([
  'cid', 'customer_id', 'customerid', 'first_open_after_install',
  'first_open_time', 'first_visit_time',
  'google_allow_ad_personalization_signals', 'last_advertising_id_reset',
  'last_deep_link_referrer', 'last_gclid', 'lifetime_user_engagement',
  'non_personalized_ads', 'session_id', 'session_number', 'sessionid',
  'sfmc_id', 'sid', 'uid', 'user_id', 'userid',
]);

function hasReservedPrefix(name: string): boolean {
  return RESERVED_PARAM_PREFIXES.some(prefix => name.startsWith(prefix));
}

function hasReservedEventPrefix(name: string): boolean {
  return RESERVED_EVENT_PREFIXES.some(prefix => name.startsWith(prefix));
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function normalizeEventName(eventName: string): string {
  const config = getConfig();
  let normalized = eventName.replace(/\s+/g, '_');
  if (config.ga4Lowercase) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

export function validateEventName(eventName: string): ValidationResult {
  if (eventName.length > GA4_MAX_EVENT_NAME_LENGTH) {
    return { valid: false, error: `GA4: Event name "${eventName}" exceeds ${GA4_MAX_EVENT_NAME_LENGTH} characters` };
  }

  if (!/^[a-zA-Z]/.test(eventName)) {
    return { valid: false, error: `GA4: Event name "${eventName}" must start with a letter` };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(eventName)) {
    return { valid: false, error: `GA4: Event name "${eventName}" contains invalid characters (only letters, numbers, underscores allowed)` };
  }

  if (RESERVED_EVENT_NAMES.has(eventName)) {
    return { valid: false, error: `GA4: Event name "${eventName}" is reserved by Google Analytics` };
  }

  if (hasReservedEventPrefix(eventName)) {
    return { valid: false, error: `GA4: Event name "${eventName}" uses a reserved prefix` };
  }

  return { valid: true };
}

export function validateAndTruncateParams(
  properties: Record<string, any>
): Record<string, any> {
  const keys = Object.keys(properties);
  const result: Record<string, any> = {};
  let count = 0;

  for (const key of keys) {
    if (count >= GA4_MAX_PARAMS) {
      console.warn(`GA4: Dropping parameter "${key}" -- exceeds ${GA4_MAX_PARAMS} parameter limit`);
      continue;
    }

    if (key.length > GA4_MAX_PARAM_NAME_LENGTH) {
      console.warn(`GA4: Parameter name "${key}" exceeds ${GA4_MAX_PARAM_NAME_LENGTH} characters, skipping`);
      continue;
    }

    if (RESERVED_PARAM_NAMES.has(key)) {
      console.warn(`GA4: Parameter name "${key}" is reserved, skipping`);
      continue;
    }

    if (hasReservedPrefix(key)) {
      console.warn(`GA4: Parameter name "${key}" uses a reserved prefix, skipping`);
      continue;
    }

    let value = properties[key];
    if (typeof value === 'string' && value.length > GA4_MAX_PARAM_VALUE_LENGTH) {
      console.warn(`GA4: Parameter "${key}" value truncated to ${GA4_MAX_PARAM_VALUE_LENGTH} characters`);
      value = value.substring(0, GA4_MAX_PARAM_VALUE_LENGTH);
    }

    result[key] = value;
    count++;
  }

  return result;
}

export function validateAndTruncateUserProperties(
  properties: Record<string, any>
): Record<string, any> {
  const keys = Object.keys(properties);
  const result: Record<string, any> = {};
  let count = 0;

  for (const key of keys) {
    if (count >= GA4_MAX_USER_PROPERTIES) {
      console.warn(`GA4: Dropping user property "${key}" -- exceeds ${GA4_MAX_USER_PROPERTIES} property limit`);
      continue;
    }

    if (key.length > GA4_MAX_USER_PROPERTY_NAME_LENGTH) {
      console.warn(`GA4: User property name "${key}" exceeds ${GA4_MAX_USER_PROPERTY_NAME_LENGTH} characters, skipping`);
      continue;
    }

    if (RESERVED_USER_PROPERTY_NAMES.has(key)) {
      console.warn(`GA4: User property name "${key}" is reserved, skipping`);
      continue;
    }

    if (hasReservedPrefix(key)) {
      console.warn(`GA4: User property name "${key}" uses a reserved prefix, skipping`);
      continue;
    }

    let value = properties[key];
    if (typeof value === 'string' && value.length > GA4_MAX_USER_PROPERTY_VALUE_LENGTH) {
      console.warn(`GA4: User property "${key}" value truncated to ${GA4_MAX_USER_PROPERTY_VALUE_LENGTH} characters`);
      value = value.substring(0, GA4_MAX_USER_PROPERTY_VALUE_LENGTH);
    }

    result[key] = value;
    count++;
  }

  return result;
}

export function warnMissingRecommendedParams(
  eventName: string,
  properties: Record<string, any>
): void {
  const prescribed = GA4_RECOMMENDED_EVENT_PARAMS[eventName];
  if (!prescribed) return;

  const missing = prescribed.filter(
    p => !(p in properties) || properties[p] === undefined || properties[p] === null || properties[p] === ''
  );

  if (missing.length > 0) {
    console.warn(
      `GA4: Recommended event "${eventName}" is missing prescribed parameters: ${missing.join(', ')}. See https://support.google.com/analytics/answer/9267735`
    );
  }
}
