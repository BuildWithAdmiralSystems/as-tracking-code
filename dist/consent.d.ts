declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}
export type ConsentStatus = 'granted' | 'denied';
export interface ConsentState {
    functionality_storage: ConsentStatus;
    analytics_storage: ConsentStatus;
    ad_storage: ConsentStatus;
    ad_user_data: ConsentStatus;
    ad_personalization: ConsentStatus;
    personalization_storage: ConsentStatus;
    security_storage: ConsentStatus;
}
export declare function isAnalyticsGranted(): boolean;
export declare function isAdUserDataGranted(): boolean;
export declare function getConsentState(): ConsentState;
export declare function updateConsent(state: Partial<ConsentState>): void;
export declare function initializeConsent(): void;
