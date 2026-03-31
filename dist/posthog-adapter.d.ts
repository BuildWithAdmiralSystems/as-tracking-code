declare global {
    interface Window {
        posthog: any;
    }
}
export declare function capturePostHogEvent(eventName: string, properties: Record<string, any>): void;
export declare function identifyPostHogUser(userProperties: Record<string, any>): void;
