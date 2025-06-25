/**
 * Parses a property string and returns a structured object.
 * @param propertyString - The string to parse, e.g., "propertyName:propertyValue".
 * @returns An object with name and value.
 */
export declare const parseProperty: (propertyString: string) => {
    name: string;
    value: string;
};
/**
 * Finds the closest ancestor of an element that matches a selector.
 * @param element - The starting element.
 * @param selector - The selector to match.
 * @returns The matching ancestor element or null if not found.
 */
export declare const findClosestAncestor: (element: HTMLElement, selector: string) => HTMLElement | null;
