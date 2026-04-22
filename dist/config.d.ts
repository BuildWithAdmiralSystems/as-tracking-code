export interface TrackerConfig {
    posthogEnabled: boolean;
    ga4Ids: string[];
    ga4Lowercase: boolean;
    ga4UserIdField: string;
    ga4ConsentDefaults: 'denied' | null;
    googleAdsId: string | null;
    devMode: boolean;
}
export declare function getConfig(): TrackerConfig;
