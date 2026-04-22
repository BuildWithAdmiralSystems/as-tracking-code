export interface TrackerConfig {
  posthogEnabled: boolean;
  ga4Ids: string[];
  ga4Lowercase: boolean;
  ga4UserIdField: string;
  ga4ConsentDefaults: 'denied' | null;
  googleAdsId: string | null;
  devMode: boolean;
}

let cachedConfig: TrackerConfig | null = null;

const scriptElement = document.currentScript as HTMLScriptElement | null;

function parseConfig(): TrackerConfig {
  const attr = (name: string): string | null =>
    scriptElement ? scriptElement.getAttribute(name) : null;

  const posthogEnabled = attr('data-posthog') === 'true';

  const ga4IdRaw = attr('data-ga4-id') || '';
  const ga4Ids = ga4IdRaw
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  const ga4Lowercase = attr('data-ga4-lowercase') === 'true';
  const ga4UserIdField = attr('data-ga4-user-id-field') || 'email';

  const consentDefaultsRaw = attr('data-ga4-consent-defaults');
  const ga4ConsentDefaults = consentDefaultsRaw === 'denied' ? 'denied' : null;

  const googleAdsIdRaw = attr('data-google-ads-id');
  const googleAdsId = googleAdsIdRaw && googleAdsIdRaw.trim().length > 0
    ? googleAdsIdRaw.trim()
    : null;

  const devMode = scriptElement ? scriptElement.hasAttribute('dev-mode') : false;

  return {
    posthogEnabled,
    ga4Ids,
    ga4Lowercase,
    ga4UserIdField,
    ga4ConsentDefaults,
    googleAdsId,
    devMode,
  };
}

export function getConfig(): TrackerConfig {
  if (!cachedConfig) {
    cachedConfig = parseConfig();
  }
  return cachedConfig;
}
