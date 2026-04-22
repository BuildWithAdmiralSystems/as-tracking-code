export declare function resolveConversionSendTo(raw: string | null): string | null;
export declare function captureEvent(eventName: string, properties: Record<string, any>, conversionSendTo?: string | null): void;
export declare function identifyUser(userProperties: Record<string, any>): void;
export declare function captureEcommerceEvent(ecommerceEventName: string, eventParams: Record<string, any>, items: Record<string, any>[], conversionSendTo?: string | null): void;
