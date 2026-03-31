# Configuration Reference

All tracker configuration is done via attributes on the `<script>` tag that loads the tracker bundle.

## Script Tag

```html
<script
  src="https://cdn.jsdelivr.net/gh/your-org/as-tracking-code@latest/dist/webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-lowercase="false"
  data-ga4-user-id-field="email"
  data-ga4-consent-defaults="denied"
  dev-mode
></script>
```

## Attributes

### `data-posthog`

Enable or disable the PostHog adapter.

| Value | Behavior |
|---|---|
| `"true"` | Events are sent to PostHog via `window.posthog.capture()` |
| Omitted or any other value | PostHog adapter is disabled |

Requires the PostHog snippet to be loaded **before** the tracker script. See [Connecting PostHog](connecting-posthog.md).

---

### `data-ga4-id`

Enable the GA4 adapter and specify one or more Measurement IDs.

| Value | Behavior |
|---|---|
| `"G-XXXXXXX"` | Single GA4 property |
| `"G-XXXXXXX,G-YYYYYYY"` | Multiple properties (comma-separated) |
| Omitted | GA4 adapter is disabled |

The tracker auto-detects `window.gtag`. If GA4 is loaded on the page, the tracker will use it. See [Connecting GA4](connecting-ga4.md).

---

### `data-ga4-lowercase`

Control whether GA4 event names are forced to lowercase.

| Value | Behavior |
|---|---|
| `"true"` | `"Product Viewed"` becomes `"product_viewed"` |
| `"false"` or omitted | `"Product Viewed"` becomes `"Product_Viewed"` (spaces replaced with underscores, original casing preserved) |

Spaces are **always** converted to underscores for GA4, regardless of this setting.

---

### `data-ga4-user-id-field`

Which form field name to use as the GA4 `user_id` when a form with `data-identify` fields is submitted.

| Value | Behavior |
|---|---|
| `"email"` (default) | The form field with `name="email"` becomes `user_id` |
| Any field name | That field becomes `user_id`; all other identify fields become GA4 user properties |

---

### `data-ga4-consent-defaults`

Set GA4 consent defaults as a safety net. This calls `gtag('consent', 'default', ...)` immediately when the script loads.

| Value | Behavior |
|---|---|
| `"denied"` | All 7 consent types default to `'denied'` |
| Omitted | No default consent call is made (relies on existing consent setup or the consent banner) |

This is useful when you want the tracker to set consent defaults even if no other consent script runs before it. See [Consent Banner](consent-banner.md) for full details.

---

### `dev-mode`

Enable development mode. This is a **boolean attribute** — its mere presence enables it.

| Value | Behavior |
|---|---|
| Present (e.g., `dev-mode`) | All events are logged to the browser console with `[Tracker DEV]` prefix instead of being sent to any analytics platform |
| Omitted | Events are sent normally to enabled adapters |

Dev mode applies to **both** PostHog and GA4 adapters. Console output includes:

```
[Tracker DEV] captureEvent { eventName: "CTA Clicked", properties: { button_label: "Click Me" } }
[Tracker DEV] identifyUser { userProperties: { email: "user@example.com", first_name: "Jane" } }
[Tracker DEV] captureEcommerceEvent { ecommerceEventName: "add_to_cart", eventParams: {...}, items: [...] }
```

---

## Minimal Configurations

**PostHog only:**

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
></script>
```

**GA4 only:**

```html
<script
  src=".../webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

**Both adapters:**

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

**Testing (dev mode):**

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  dev-mode
></script>
```

---

## Programmatic API

The tracker exposes two functions on the `webflowTracker` global for consent management:

### `webflowTracker.updateConsent(state)`

Update consent state programmatically. Accepts a partial `ConsentState` object.

```javascript
webflowTracker.updateConsent({
  analytics_storage: 'granted',
  ad_storage: 'granted',
});
```

### `webflowTracker.getConsentState()`

Returns a copy of the current consent state.

```javascript
const consent = webflowTracker.getConsentState();
console.log(consent.analytics_storage); // 'granted' or 'denied'
```
