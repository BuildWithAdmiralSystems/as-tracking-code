# Google Ads Conversions

Fire a Google Ads conversion (`gtag('event', 'conversion', { send_to: '...' })`) alongside any tracked event by adding a single attribute. Works on clicks, forms, pageviews, and ecommerce events.

## Why Not Just Use GA4 Key Events?

Two different things are often called "conversions":

- **GA4 Key Events** (formerly "Conversions") — marked in the GA4 Admin UI. No code is required; you just tag an existing event as a Key Event in GA4. This tracker does not need any attribute for that.
- **Google Ads Conversions** — a *separate* `gtag('event', 'conversion', { send_to: 'AW-XXX/label' })` call that powers Google Ads bidding, reporting, and optimization. These are code-triggered.

This guide is about the second kind — Google Ads conversions.

## Quick Start

### Step 1: Create a Conversion in Google Ads

1. Go to [Google Ads](https://ads.google.com) → **Tools & Settings > Measurement > Conversions**
2. Click **+ New conversion action** → **Website**
3. Configure the conversion (category, value, count, attribution window)
4. Under **Tag setup**, choose **Use Google Tag Manager** or **Install the tag yourself**
5. Note down the **conversion ID** (`AW-12345678`) and **conversion label** (`AbC-DeFgH`)

### Step 2: Configure the Tracker

Add `data-google-ads-id` to the tracker script tag:

```html
<script
  src="https://cdn.jsdelivr.net/gh/BuildWithAdmiralSystems/as-tracking-code@latest/dist/webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX"
  data-google-ads-id="AW-12345678"
  data-ga4-consent-defaults="denied"
></script>
```

The tracker will call `gtag('config', 'AW-12345678')` on init so you only need the GA4 gtag snippet — the Google Ads side is configured automatically.

### Step 3: Tag the Event

Add `data-ga4-conversion` to any element that already has `data-event`:

```html
<form data-event="Form Submitted" data-ga4-conversion="AbC-DeFgH">
  <input type="email" name="email" data-identify="true" />
  <input type="submit" />
</form>
```

When the form is submitted, the tracker fires **two** calls:

1. The normal `Form Submitted` event to GA4 and PostHog (existing behavior)
2. A Google Ads conversion call: `gtag('event', 'conversion', { send_to: 'AW-12345678/AbC-DeFgH', ...properties })`

## Attribute Value Formats

The value of `data-ga4-conversion` can be either:

| Format | Example | Behavior |
|---|---|---|
| Full `send_to` | `AW-12345678/AbC-DeFgH` | Used as-is |
| Bare label | `AbC-DeFgH` | Prefixed with `data-google-ads-id` from the script tag |

If you pass a bare label and `data-google-ads-id` is not configured, the conversion is skipped with a console warning.

## Where It Works

`data-ga4-conversion` can be placed on:

| Element | Event type |
|---|---|
| Any element with `data-event` | Static or CMS click events |
| `<form data-event="...">` | Form submission events |
| `<body data-event="...">` | Pageview events (e.g., thank-you page conversions) |
| Any element with `data-ga4-ecommerce="..."` | Ecommerce events (especially `purchase`) |

## Conversion Parameters

The tracker reuses the element's `data-property-name{i}` / `data-property-value{i}` values for the conversion call. Google Ads specifically uses:

| Parameter | Purpose |
|---|---|
| `value` | Monetary value of the conversion |
| `currency` | ISO 4217 currency code (e.g., `USD`) |
| `transaction_id` | Unique order ID — required for deduplication across Google Ads and GA4 |

Google Ads ignores unknown parameters, so you can leave all your existing properties in place.

## Examples

### Lead Form Conversion

```html
<form
  data-event="Contact Form Submitted"
  data-ga4-conversion="AbC-DeFgH"
  data-property-name1="value:50"
  data-property-name2="currency:USD"
>
  <input type="email" name="email" data-identify="true" />
  <input type="submit" />
</form>
```

Fires:
```js
gtag('event', 'Contact_Form_Submitted', { value: 50, currency: 'USD' });
gtag('event', 'conversion', { send_to: 'AW-12345678/AbC-DeFgH', value: 50, currency: 'USD' });
```

### Signup Click Conversion

```html
<button
  data-event="Signup Clicked"
  data-ga4-conversion="XyZ-PqRsT"
>
  Start Free Trial
</button>
```

### Thank-You Page Pageview Conversion

```html
<body
  data-event="Thank You Page Viewed"
  data-ga4-conversion="AbC-DeFgH"
  data-property-name1="value:99.99"
  data-property-name2="currency:USD"
>
  <!-- page content -->
</body>
```

### Ecommerce Purchase + Conversion

```html
<div data-wrapper="true">
  <div data-ga4-item-wrapper="true">
    <span data-ga4-item-id="item_id">SKU_001</span>
    <span data-ga4-item-name="item_name">Widget Pro</span>
    <span data-ga4-item-price="price" data-property-value="innerHTML-parseFloat">99.99</span>
  </div>

  <button
    data-event="Order Completed"
    data-ga4-ecommerce="purchase"
    data-ga4-conversion="AbC-DeFgH"
    data-cms="true"
    data-property-name1="transaction_id:TXN_98765"
    data-property-name2="currency:USD"
    data-property-name3="value:99.99"
  >
    Confirm Purchase
  </button>
</div>
```

Fires:
```js
// GA4 ecommerce
gtag('event', 'purchase', {
  transaction_id: 'TXN_98765',
  currency: 'USD',
  value: '99.99',
  items: [{ item_id: 'SKU_001', item_name: 'Widget Pro', price: 99.99 }]
});

// Google Ads conversion (items[] not forwarded — Google Ads uses scalar params)
gtag('event', 'conversion', {
  send_to: 'AW-12345678/AbC-DeFgH',
  transaction_id: 'TXN_98765',
  currency: 'USD',
  value: '99.99'
});
```

The shared `transaction_id` lets Google Ads deduplicate the conversion if you also have server-side tracking.

## Consent & Consent Mode v2

Conversions are gated on the same `analytics_storage` consent as the parent event. When analytics consent is granted but ad consent is denied, the conversion still fires — gtag's Consent Mode v2 internally modifies the payload (using modeled conversions) based on `ad_storage`, `ad_user_data`, and `ad_personalization`.

If `analytics_storage` is denied entirely, the conversion does not fire. For full conversion attribution, the user must grant ad consent. See [Consent Banner](consent-banner.md).

## Debugging

Use `dev-mode` on the script tag to log conversion payloads without sending them:

```
[Tracker DEV] captureEvent {
  eventName: "Form Submitted",
  properties: { value: 50, currency: "USD" },
  conversionSendTo: "AW-12345678/AbC-DeFgH"
}
```

In production, verify conversions are landing using **Google Ads > Tools & Settings > Conversions > (your conversion) > Diagnostics**. It can take up to 24 hours for conversions to appear.

You can also use the [Google Tag Assistant](https://tagassistant.google.com) browser extension to inspect the conversion call in real time.

## FAQ

**Do I need to install the Google Ads global site tag separately?**
No. If you have the GA4 gtag.js snippet installed and set `data-google-ads-id` on the tracker script, the tracker configures Google Ads automatically via `gtag('config', 'AW-XXXXXXX')`.

**Can I use this with Google Tag Manager?**
Yes. If GTM is your gtag source, add a Google Ads Conversion Linker tag and ensure GTM exposes `window.gtag`. The tracker's `gtag('event', 'conversion', ...)` call will be picked up the same way.

**Does this send conversions to PostHog?**
No. `data-ga4-conversion` is GA4/Google Ads only. The parent `data-event` is still sent to PostHog as normal.

**What if I have multiple Google Ads accounts?**
Use the full `send_to` format on each element: `data-ga4-conversion="AW-11111111/label1"` for account 1, `data-ga4-conversion="AW-22222222/label2"` for account 2. The `data-google-ads-id` script attribute is just shorthand for the most common account — full IDs always override it.

**Can I fire a conversion with no associated event?**
No. `data-ga4-conversion` must be paired with `data-event` (or `data-ga4-ecommerce`) on the same element. If you need conversion-only tracking, call `gtag('event', 'conversion', ...)` directly in custom code.
