# Connecting Customer.io

This guide covers how to set up Customer.io with the tracker in a Webflow project. The tracker uses Customer.io's legacy in-app JavaScript snippet (the global `window._cio` object).

## Step 1: Create a Customer.io Workspace

1. Sign in at [customer.io](https://customer.io)
2. Open **Settings > Workspace Settings > API Credentials**
3. Copy your **Site ID** (used by the `_cio` snippet below)

## Step 2: Add the Customer.io Snippet

> **Do NOT copy the snippet below verbatim.** Customer.io updates their snippet periodically. Always use the current snippet from the [Customer.io legacy JS docs](https://docs.customer.io/integrations/data-in/connections/javascript/legacy-js/getting-started/) with your own Site ID.

Paste the snippet in Webflow under **Project Settings > Custom Code > Head Code**. It looks roughly like this:

```html
<script type="text/javascript">
  var _cio = _cio || [];
  (function() {
    var a,b,c;a=function(f){return function(){_cio.push([f].
    concat(Array.prototype.slice.call(arguments,0)))}};b=["load","identify",
    "sidentify","track","page","on","off"];for(c=0;c<b.length;c++){_cio[b[c]]=a(b[c])};
    var t = document.createElement('script'),
        s = document.getElementsByTagName('script')[0];
    t.async = true;
    t.id    = 'cio-tracker';
    t.setAttribute('data-site-id', 'YOUR_SITE_ID');
    t.setAttribute('data-use-array-params', 'true');
    t.src = 'https://assets.customer.io/assets/track.js';
    s.parentNode.insertBefore(t, s);
  })();
</script>
```

**The Customer.io snippet must load BEFORE the tracker script.** If `window._cio` isn't present when the tracker fires, you'll see `Customer.io (_cio) is not available.` in the console — the tracker warns, it does not throw.

## Step 3: Add the Tracker Script

In **Project Settings > Custom Code > Footer Code**, add the tracker with Customer.io enabled:

```html
<script
  src="https://cdn.jsdelivr.net/gh/BuildWithAdmiralSystems/as-tracking-code@0.1.0/dist/webflow-tracker.min.js"
  data-customerio-site-id="YOUR_SITE_ID"
  data-customerio-user-id-field="email"
></script>
```

Any non-empty `data-customerio-site-id` enables the adapter. The value is informational — the real Site ID is the one in the `_cio` snippet above.

## What Gets Sent to Customer.io

### Events (`_cio.track`)

Click and form events declared with `data-event` are sent via `_cio.track(eventName, properties)`.

### User Identification (`_cio.identify`)

When a form is submitted with fields marked `data-identify="true"` (or `data-both-identify-and-track="true"`), the tracker calls:

```js
_cio.identify({ id: "<id>", ...traits });
```

The `id` is taken from the field named by `data-customerio-user-id-field` (default `email`). All identify fields — including the id field — are passed as traits. If that field has no value, the identify call is **skipped** with a console warning (Customer.io requires an `id`).

### Pageviews (`_cio.page`) — read this carefully

The Customer.io snippet has its own `data-auto-track-page` setting that, **when `true` (the default), already sends a `page` event on every load.** To avoid double-counting:

- **Leave `data-customerio-auto-pageview` off (default).** The tracker sends nothing to Customer.io on pageview — the snippet's native auto-tracking owns pageviews.
- **Only set `data-customerio-auto-pageview="true"`** if you have set the C.io snippet's `data-auto-track-page="false"`. Then the tracker drives `_cio.page(eventName, properties)` itself, using the `<body data-event>` name and pageview properties.

**Never enable both** — pick the snippet's auto-tracking OR the tracker's, not both.

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

If you're using the [consent banner](consent-banner.md), Customer.io calls are gated by `analytics_storage` (the same gate as PostHog). When the user hasn't granted analytics consent, all `_cio` calls are silently dropped — Customer.io receives no data until consent is given.

## Debugging

Add `dev-mode` to the tracker script to log events to the console without sending them:

```
[Tracker DEV] captureEvent { eventName: "CTA Clicked", properties: { ... } }
[Tracker DEV] identifyUser { userProperties: { email: "user@example.com" } }
```
