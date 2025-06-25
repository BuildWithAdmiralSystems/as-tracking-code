declare global {
    interface Window {
        posthog: any;
    }
}
export declare const captureEvent: (eventName: string, properties: object) => void;
export declare const identifyUser: (userProperties: object) => void;
