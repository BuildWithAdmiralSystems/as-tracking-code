import { captureEvent } from './dispatcher';
import { parseProperty } from './utils';
import { resolvePropertyValue } from './property-resolver';

let pageviewProperties: Record<string, any> = {};

const handlePageview = () => {
  const body = document.body;
  const eventName = body.getAttribute('data-event');

  if (eventName) {
    const propertyElements = document.querySelectorAll('[data-pageview-property-name]');
    propertyElements.forEach(element => {
      const propertyNameAttr = element.getAttribute('data-pageview-property-name');
      if (propertyNameAttr) {
        const { name, value } = parseProperty(propertyNameAttr);
        const valueAttr = element.getAttribute('data-pageview-property-value');
        const resolvedValue = valueAttr || value;
        pageviewProperties[name] = resolvePropertyValue(resolvedValue, element);
      }
    });

    captureEvent(eventName, pageviewProperties);
  }
};

export const initializePageviewListener = () => {
  document.addEventListener('DOMContentLoaded', handlePageview);
};

export const getPageviewProperties = () => {
  return pageviewProperties;
};
