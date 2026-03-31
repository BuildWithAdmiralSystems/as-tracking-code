import { captureEvent, identifyUser } from './dispatcher';
import { findClosestAncestor } from './utils';

const handleFormSubmit = (event: SubmitEvent) => {
    const submitButton = event.submitter as HTMLElement;
    if (!submitButton) return;

    const form = findClosestAncestor(submitButton, 'form') as HTMLFormElement | null;
    if (!form) return;

    const eventName = form.getAttribute('data-event');
    if (!eventName) return;

    event.preventDefault();

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

    if (Object.keys(trackProperties).length > 0) {
        captureEvent(eventName, trackProperties);
    }

    if (Object.keys(identifyProperties).length > 0) {
        identifyUser(identifyProperties);
    }

    // Allow a small delay for tracking to complete before submitting
    setTimeout(() => {
        form.submit();
    }, 300);
};


export const initializeFormListener = () => {
    document.addEventListener('submit', handleFormSubmit);
};