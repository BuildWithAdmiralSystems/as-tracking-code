import { captureEvent, identifyUser, resolveConversionSendTo } from './dispatcher';
import { findClosestAncestor } from './utils';

const handleFormSubmit = (event: SubmitEvent) => {
    // Use the form that was submitted. event.submitter can be null (for example
    // on programmatic submits), and the tracker must never block or replay the
    // submission: Webflow and custom form scripts own it.
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const form = findClosestAncestor(target, 'form') as HTMLFormElement | null;
    if (!form) return;

    const eventName = form.getAttribute('data-event');
    if (!eventName) return;

    const trackProperties: Record<string, any> = {};
    const identifyProperties: Record<string, any> = {};

    const formElements = form.elements;

    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i] as HTMLInputElement;

        if (element.name) {
            const track = element.getAttribute('data-track') === 'true';
            const identify = element.getAttribute('data-identify') === 'true';
            const both = element.getAttribute('data-both-identify-and-track') === 'true';
            const parseIntAttr = element.getAttribute('data-parse-int') === 'true';
            const parseFloatAttr = element.getAttribute('data-parse-float') === 'true';

            let value: any = element.value;

            if (parseIntAttr) {
                value = parseInt(value, 10);
            } else if (parseFloatAttr) {
                value = parseFloat(value);
            }

            if (track || both) {
                trackProperties[element.name] = value;
            }

            if (identify || both) {
                identifyProperties[element.name] = value;
            }
        }
    }

    const conversionSendTo = resolveConversionSendTo(form.getAttribute('data-ga4-conversion'));

    // Always send the form event, even when no field is marked data-track.
    captureEvent(eventName, trackProperties, conversionSendTo);

    if (Object.keys(identifyProperties).length > 0) {
        identifyUser(identifyProperties);
    }
};


export const initializeFormListener = () => {
    document.addEventListener('submit', handleFormSubmit);
};