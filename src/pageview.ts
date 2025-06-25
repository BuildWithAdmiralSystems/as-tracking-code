import { captureEvent } from './posthog-adapter';
import { parseProperty } from './utils';

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
        let propertyValue: any;

        const valueAttr = element.getAttribute('data-pageview-property-value');
        const resolvedValue = valueAttr || value;

        switch (resolvedValue) {
          case 'innerHTML':
            propertyValue = element.innerHTML;
            break;
          case 'innerHTML-parseInt':
            propertyValue = parseInt(element.innerHTML, 10);
            break;
          case 'innerHTML-parseFloat':
            propertyValue = parseFloat(element.innerHTML);
            break;
          case 'innerText':
            propertyValue = (element as HTMLElement).innerText;
            break;
          case 'innerText-parseInt':
            propertyValue = parseInt((element as HTMLElement).innerText, 10);
            break;
          case 'innerText-parseFloat':
            propertyValue = parseFloat((element as HTMLElement).innerText);
            break;
          case 'boolean:true':
            propertyValue = true;
            break;
          case 'boolean:false':
            propertyValue = false;
            break;
          default:
            propertyValue = resolvedValue;
        }
        pageviewProperties[name] = propertyValue;
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