# Connecting Customer.io

This guide covers how to set up Customer.io with the tracker in a Webflow project. The tracker uses Customer.io's **Data Pipelines** JavaScript source (the global `window.cioanalytics` object, an analytics.js-style client).

## Step 1: Create a Data Pipelines JavaScript Source

1. Sign in at [customer.io](https://customer.io)
2. In **Data Pipelines**, create a **JavaScript** source
3. Copy its **Write Key**

## Step 2: Add the cioanalytics Snippet

> **Do NOT copy a snippet from here verbatim.** Get the current snippet from your own source in **Data Pipelines > Sources > (your JS source) > Settings**. See the [Customer.io JS source docs](https://docs.customer.io/integrations/data-in/connections/javascript/js-source/).

Paste the snippet in Webflow under **Project Settings > Custom Code > Head Code**. It loads `cioanalytics`, calls `.load()` with your write key, and ends with a `.page()` call:

```html
<script type="text/javascript">
  // ...minified cioanalytics loader from your dashboard...
  cioanalytics.load("YOUR_WRITE_KEY");
  cioanalytics.page();
</script>
```

**The cioanalytics snippet must load BEFORE the tracker script.** If `window.cioanalytics` isn't present when the tracker fires, you'll see `Customer.io (cioanalytics) is not available.` in the console — the tracker warns, it does not throw.

## Step 3: Add the Tracker Script

In **Project Settings > Custom Code > Footer Code**, add the tracker with Customer.io enabled:

```html
<script
  src="https://cdn.jsdelivr.net/gh/BuildWithAdmiralSystems/as-tracking-code@0.1.0/dist/webflow-tracker.min.js"
  data-customerio-site-id="YOUR_SITE_ID"
  data-customerio-user-id-field="email"
></script>
```

Any non-empty `data-customerio-site-id` enables the adapter. The value is informational — the snippet's write key is what actually routes data.

## What Gets Sent to Customer.io

### Events (`cioanalytics.track`)

Click and form events declared with `data-event` are sent via `cioanalytics.track(eventName, properties)`.

### User Identification (`cioanalytics.identify`)

When a form is submitted with fields marked `data-identify="true"` (or `data-both-identify-and-track="true"`), the tracker calls:

```js
cioanalytics.identify(userId, traits);
```

`userId` is positional (first arg). It's taken from the field named by `data-customerio-user-id-field` (default `email`). All identify fields are passed as `traits`. If that field has no value, the identify call is **skipped** with a console warning — Customer.io Journeys ignores anonymous `identify` calls.

### Pageviews (`cioanalytics.page`) — read this carefully

The cioanalytics snippet **automatically sends a `page()` call on load** (it's the last line of the snippet). To avoid double-counting:

- **Leave `data-customerio-auto-pageview` off (default).** The tracker sends nothing to Customer.io on pageview — the snippet's own `page()` owns pageviews.
- **Only set `data-customerio-auto-pageview="true"`** if you remove the `cioanalytics.page()` line from the snippet. Then the tracker drives `cioanalytics.page(eventName, properties)` itself, using the `<body data-event>` name and pageview properties.

**Never enable both** — pick the snippet's auto `page()` OR the tracker's, not both.

## Customer.io + PostHog + GA4 Together

All three adapters can run simultaneously and receive the same click/form events:

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
  data-customerio-site-id="YOUR_SITE_ID"
  data-customerio-user-id-field="email"
></script>
```

## Consent

If you're using the [consent banner](consent-banner.md), Customer.io calls are gated by `analytics_storage` (the same gate as PostHog). When the user hasn't granted analytics consent, all `cioanalytics` calls are silently dropped — Customer.io receives no data until consent is given.

## Debugging

Add `dev-mode` to the tracker script to log events to the console without sending them:

```
[Tracker DEV] captureEvent { eventName: "CTA Clicked", properties: { ... } }
[Tracker DEV] identifyUser { userProperties: { email: "user@example.com" } }
```
