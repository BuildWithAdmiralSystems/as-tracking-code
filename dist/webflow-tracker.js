(function () {
    'use strict';

    const isDevMode = () => {
        const script = document.currentScript;
        return script ? script.hasAttribute('dev-mode') : false;
    };
    const isPostHogAvailable = () => {
        return window.posthog && typeof window.posthog.capture === 'function' && typeof window.posthog.identify === 'function';
    };
    const captureEvent = (eventName, properties) => {
        if (isDevMode()) {
            console.log('DEV MODE: Capture Event', { eventName, properties });
            return;
        }
        if (isPostHogAvailable()) {
            window.posthog.capture(eventName, properties);
        }
        else {
            console.error('PostHog is not available.');
        }
    };
    const identifyUser = (userProperties) => {
        if (isDevMode()) {
            console.log('DEV MODE: Identify User', { userProperties });
            return;
        }
        if (isPostHogAvailable()) {
            window.posthog.identify(userProperties);
        }
        else {
            console.error('PostHog is not available.');
        }
    };

    /**
     * Parses a property string and returns a structured object.
     * @param propertyString - The string to parse, e.g., "propertyName:propertyValue".
     * @returns An object with name and value.
     */
    const parseProperty = (propertyString) => {
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
    const findClosestAncestor = (element, selector) => {
        let current = element;
        while (current) {
            if (current.matches(selector)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    };

    let pageviewProperties = {};
    const handlePageview = () => {
        const body = document.body;
        const eventName = body.getAttribute('data-event');
        if (eventName) {
            const propertyElements = document.querySelectorAll('[data-pageview-property-name]');
            propertyElements.forEach(element => {
                const propertyNameAttr = element.getAttribute('data-pageview-property-name');
                if (propertyNameAttr) {
                    const { name, value } = parseProperty(propertyNameAttr);
                    let propertyValue;
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
                            propertyValue = element.innerText;
                            break;
                        case 'innerText-parseInt':
                            propertyValue = parseInt(element.innerText, 10);
                            break;
                        case 'innerText-parseFloat':
                            propertyValue = parseFloat(element.innerText);
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
    const initializePageviewListener = () => {
        document.addEventListener('DOMContentLoaded', handlePageview);
    };
    const getPageviewProperties = () => {
        return pageviewProperties;
    };

    const handleCmsClick = (element, eventName) => {
        const wrapper = findClosestAncestor(element, '[data-wrapper="true"]');
        if (!wrapper)
            return;
        const properties = {};
        const propertyElements = wrapper.querySelectorAll('[data-property-name]');
        propertyElements.forEach(propElement => {
            const propertyNameAttr = propElement.getAttribute('data-property-name');
            if (propertyNameAttr) {
                const { name, value } = parseProperty(propertyNameAttr);
                let propertyValue;
                const valueAttr = propElement.getAttribute('data-property-value');
                const resolvedValue = valueAttr || value;
                switch (resolvedValue) {
                    case 'innerHTML':
                        propertyValue = propElement.innerHTML;
                        break;
                    case 'innerHTML-parseInt':
                        propertyValue = parseInt(propElement.innerHTML, 10);
                        break;
                    case 'innerHTML-parseFloat':
                        propertyValue = parseFloat(propElement.innerHTML);
                        break;
                    case 'innerText':
                        propertyValue = propElement.innerText;
                        break;
                    case 'innerText-parseInt':
                        propertyValue = parseInt(propElement.innerText, 10);
                        break;
                    case 'innerText-parseFloat':
                        propertyValue = parseFloat(propElement.innerText);
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
                properties[name] = propertyValue;
            }
        });
        captureEvent(eventName, properties);
    };
    const handleStaticClick = (element, eventName) => {
        const properties = {};
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
                }
                else {
                    let propertyValue;
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
                            propertyValue = element.innerText;
                            break;
                        case 'innerText-parseInt':
                            propertyValue = parseInt(element.innerText, 10);
                            break;
                        case 'innerText-parseFloat':
                            propertyValue = parseFloat(element.innerText);
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
                    properties[name] = propertyValue;
                }
            }
            else {
                break;
            }
        }
        captureEvent(eventName, properties);
    };
    const handleGlobalClick = (event) => {
        const target = event.target;
        const eventElement = findClosestAncestor(target, '[data-event]');
        if (eventElement) {
            const eventName = eventElement.getAttribute('data-event');
            if (eventName) {
                const isCms = eventElement.getAttribute('data-cms') === 'true';
                if (isCms) {
                    handleCmsClick(eventElement, eventName);
                }
                else {
                    handleStaticClick(eventElement, eventName);
                }
            }
        }
    };
    const initializeClickListener = () => {
        document.addEventListener('click', handleGlobalClick);
    };

    const handleFormSubmit = (event) => {
        const submitButton = event.submitter;
        if (!submitButton)
            return;
        const form = findClosestAncestor(submitButton, 'form');
        if (!form)
            return;
        const eventName = form.getAttribute('data-event');
        if (!eventName)
            return;
        event.preventDefault();
        const trackProperties = {};
        const identifyProperties = {};
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                const track = element.getAttribute('data-track') === 'true';
                const identify = element.getAttribute('data-identify') === 'true';
                const both = element.getAttribute('data-both-identify-and-track') === 'true';
                const parseIntAttr = element.getAttribute('data-parse-int') === 'true';
                const parseFloatAttr = element.getAttribute('data-parse-float') === 'true';
                let value = element.value;
                if (parseIntAttr) {
                    value = parseInt(value, 10);
                }
                else if (parseFloatAttr) {
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
    const initializeFormListener = () => {
        document.addEventListener('submit', handleFormSubmit);
    };

    // Initialize all event listeners
    initializePageviewListener();
    initializeClickListener();
    initializeFormListener();

})();
