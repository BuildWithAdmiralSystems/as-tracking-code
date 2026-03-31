declare global {
  interface Window {
    posthog: any;
  }
}

function isPostHogAvailable(): boolean {
  return (
    window.posthog &&
    typeof window.posthog.capture === 'function' &&
    typeof window.posthog.identify === 'function'
  );
}

export function capturePostHogEvent(eventName: string, properties: Record<string, any>): void {
  if (!isPostHogAvailable()) {
    console.error('PostHog is not available.');
    return;
  }
  window.posthog.capture(eventName, properties);
}

export function identifyPostHogUser(userProperties: Record<string, any>): void {
  if (!isPostHogAvailable()) {
    console.error('PostHog is not available.');
    return;
  }
  window.posthog.identify(userProperties);
}
