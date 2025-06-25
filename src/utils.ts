/**
 * Parses a property string and returns a structured object.
 * @param propertyString - The string to parse, e.g., "propertyName:propertyValue".
 * @returns An object with name and value.
 */
export const parseProperty = (propertyString: string): { name: string; value: string } => {
  const parts = propertyString.split(':');
  const name = parts[0];
  const value = parts.length > 1 ? parts.slice(1).join(':') : 'innerHTML';
  return { name, value };
};

/**
 * Finds the closest ancestor of an element that matches a selector.
 * @param element - The starting element.
 * @param selector - The selector to match.
 * @returns The matching ancestor element or null if not found.
 */
export const findClosestAncestor = (element: HTMLElement, selector: string): HTMLElement | null => {
  let current: HTMLElement | null = element;
  while (current) {
    if (current.matches(selector)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};