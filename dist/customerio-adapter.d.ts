declare global {
    interface Window {
        cioanalytics: any;
    }
}
export declare function captureCustomerioEvent(eventName: string, properties: Record<string, any>): void;
export declare function identifyCustomerioUser(userProperties: Record<string, any>): void;
export declare function pageCustomerio(pageName: string, properties: Record<string, any>): void;
