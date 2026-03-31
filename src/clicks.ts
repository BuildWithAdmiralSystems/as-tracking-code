import { captureEvent } from './dispatcher';
import { findClosestAncestor, parseProperty } from './utils';
import { resolvePropertyValue } from './property-resolver';
import { getPageviewProperties } from './pageview';
import { handleEcommerceClick } from './ga4-ecommerce';

const handleCmsClick = (element: HTMLElement, eventName: string) => {
  const wrapper = findClosestAncestor(element, '[data-wrapper="true"]');
  if (!wrapper) return;

  const properties: Record<string, any> = {};
  const propertyElements = wrapper.querySelectorAll('[data-property-name]');

  propertyElements.forEach(propElement => {
    const propertyNameAttr = propElement.getAttribute('data-property-name');
    if (propertyNameAttr) {
      const { name, value } = parseProperty(propertyNameAttr);
      const valueAttr = propElement.getAttribute('data-property-value');
      const resolvedValue = valueAttr || value;
      properties[name] = resolvePropertyValue(resolvedValue, propElement);
    }
  });

  if (handleEcommerceClick(element, eventName, properties)) return;

  captureEvent(eventName, properties);
};

const handleStaticClick = (element: HTMLElement, eventName: string) => {
  const properties: Record<string, any> = {};
  const pageviewProperties = getPageviewProperties();

  for (let i = 1; i <= 100; i++) {
    const nameAttr = element.getAttribute(`data-property-name${i}`);
    const valueAttr = element.getAttribute(`data-property-value${i}`);

    if (nameAttr) {
      const { name, value } = parseProperty(nameAttr);
      const resolvedValue = valueAttr || value;

      if (resolvedValue === 'grabPageview') {
        if (pageviewProperties[name]) {
          properties[name] = pageviewProperties[name];
        }
      } else {
        properties[name] = resolvePropertyValue(resolvedValue, element);
      }
    } else {
      break;
    }
  }

  if (handleEcommerceClick(element, eventName, properties)) return;

  captureEvent(eventName, properties);
};

const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const eventElement = findClosestAncestor(target, '[data-event]');

  if (eventElement) {
    const eventName = eventElement.getAttribute('data-event');
    if (eventName) {
      const isCms = eventElement.getAttribute('data-cms') === 'true';
      if (isCms) {
        handleCmsClick(eventElement, eventName);
      } else {
        handleStaticClick(eventElement, eventName);
      }
    }
  }
};

export const initializeClickListener = () => {
  document.addEventListener('click', handleGlobalClick);
};
