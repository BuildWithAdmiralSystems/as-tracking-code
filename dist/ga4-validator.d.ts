export interface ValidationResult {
    valid: boolean;
    error?: string;
}
export declare function normalizeEventName(eventName: string): string;
export declare function validateEventName(eventName: string): ValidationResult;
export declare function validateAndTruncateParams(properties: Record<string, any>): Record<string, any>;
export declare function validateAndTruncateUserProperties(properties: Record<string, any>): Record<string, any>;
