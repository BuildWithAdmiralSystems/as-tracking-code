declare global {
  interface Window {
    posthog: any;
  }
}

const isDevMode = (): boolean => {
    const script = document.currentScript;
    return script ? script.hasAttribute('dev-mode') : false;
}

const isPostHogAvailable = (): boolean => {
  return window.posthog && typeof window.posthog.capture === 'function' && typeof window.posthog.identify === 'function';
};

export const captureEvent = (eventName: string, properties: object): void => {
    if (isDevMode()) {
        console.log('DEV MODE: Capture Event', { eventName, properties });
        return;
    }
    if (isPostHogAvailable()) {
        window.posthog.capture(eventName, properties);
    } else {
        console.error('PostHog is not available.');
    }
};

export const identifyUser = (userProperties: object): void => {
    if (isDevMode()) {
        console.log('DEV MODE: Identify User', { userProperties });
        return;
    }
    if (isPostHogAvailable()) {
        window.posthog.identify(userProperties);
    } else {
        console.error('PostHog is not available.');
    }
};