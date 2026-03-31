# Connecting PostHog

This guide covers how to set up PostHog with the tracker in a Webflow project.

## Step 1: Create a PostHog Account

1. Sign up at [posthog.com](https://posthog.com)
2. Create a new project
3. Copy your **Project API Key** from **Project Settings > Project API Key**

## Step 2: Add the PostHog Snippet

> **Do NOT copy the snippet below.** PostHog updates their snippet periodically and the version shown here may be outdated. Always get the latest snippet from your own PostHog dashboard:
>
> 1. Go to **PostHog > Settings > Project > Web snippet** (or the onboarding wizard)
> 2. Copy the snippet PostHog provides — it will have your API key and correct API host pre-filled
> 3. Paste it in Webflow under **Project Settings > Custom Code > Head Code**

The snippet will look roughly like this (but always use PostHog's version):

```html
<script>
  !function(t,e){/* ...minified PostHog loader... */}(document,window.posthog||[]);
  posthog.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://us.i.posthog.com',
  });
</script>
```

The key parts are:
- `YOUR_PROJECT_API_KEY` — your actual PostHog project API key
- `api_host` — use `https://us.i.posthog.com` for US region, `https://eu.i.posthog.com` for EU region (PostHog's snippet will pre-fill this for you)

## Step 3: Add the Tracker Script

In **Project Settings > Custom Code > Footer Code**, add the tracker with PostHog enabled:

```html
<script
  src="https://cdn.jsdelivr.net/gh/your-org/as-tracking-code@latest/dist/webflow-tracker.min.js"
  data-posthog="true"
></script>
```

The tracker will verify that `window.posthog` is available before sending events. If PostHog isn't loaded, you'll see `PostHog is not available.` in the console.

## What Gets Sent to PostHog

### Events (`posthog.capture`)

All events declared with `data-event` attributes are sent to PostHog via `posthog.capture(eventName, properties)`:

- Pageview events (from `<body data-event="...">`)
- Click events (from any element with `data-event`)
- Form submission events (fields marked with `data-track` or `data-both-identify-and-track`)

Event names are sent **as-is** to PostHog — no name transformation is applied (unlike GA4, which converts spaces to underscores).

### User Identification (`posthog.identify`)

When a form is submitted with fields marked `data-identify="true"` or `data-both-identify-and-track="true"`, the tracker calls `posthog.identify(userProperties)` with those field values.

## PostHog + GA4 Together

You can run PostHog and GA4 simultaneously:

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

Both adapters receive the same events. GA4 gets its own name normalization (spaces to underscores) applied automatically.

## Consent

If you're using the [consent banner](consent-banner.md), PostHog events are gated by `analytics_storage`. When the user hasn't granted consent, events are silently dropped — PostHog won't receive any data until consent is given.

## Debugging

Add `dev-mode` to the script tag to log events to the console without sending them:

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  dev-mode
></script>
```

You'll see output like:

```
[Tracker DEV] captureEvent { eventName: "CTA Clicked", properties: { ... } }
[Tracker DEV] identifyUser { userProperties: { email: "user@example.com" } }
```
