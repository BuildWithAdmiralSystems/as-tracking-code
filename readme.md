# Admiral Systems Tracking Code

A lightweight, attribute-driven analytics tracker for **Webflow** sites. Track pageviews, clicks, form submissions, and ecommerce events by adding HTML `data-`* attributes — no custom JavaScript required.

Supports **PostHog** and **Google Analytics 4** simultaneously, with built-in cookie consent management (GA4 Consent Mode v2).

## Features

- **Zero custom code** — configure everything with HTML attributes in Webflow Designer
- **Dual analytics** — send events to PostHog, GA4, or both at the same time
- **Cookie consent banner** — GDPR-compliant consent management with all 7 GA4 consent types
- **GA4 ecommerce** — map CMS collection items to GA4's `items[]` array for purchase, add_to_cart, etc.
- **GA4 validation** — automatic event name normalization, reserved name blocking, parameter truncation, and warnings for GA4 recommended events missing prescribed parameters (`generate_lead`, `login`, `sign_up`, `search`, `select_content`, `share`)
- **Google Ads conversions** — mark any event as a Google Ads conversion trigger with a single `data-ga4-conversion` attribute
- **Dev mode** — log events to the console instead of sending them, for testing
- **CMS-aware** — pull dynamic property values from CMS items via `data-wrapper` + `data-property-name` patterns

## Quick Start

### 1. Load Your Analytics Provider(s)

> **Do NOT copy analytics snippets from this README.** They go out of date. Always get the latest installation snippet directly from your analytics provider's dashboard. The guides below tell you exactly where to find them.

Add your analytics provider scripts in the Webflow **Project Settings > Custom Code > Head Code**. You have three options depending on your setup:


| Setup                          | What to add in Head Code                         | Guide                                                                        |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| **PostHog**                    | PostHog JS snippet from your PostHog dashboard   | [Connecting PostHog](docs/connecting-posthog.md)                             |
| **GA4 (direct gtag.js)**       | GA4 snippet from your Google Analytics dashboard | [Connecting GA4](docs/connecting-ga4.md)                                     |
| **GA4 via Google Tag Manager** | GTM container snippet from your GTM dashboard    | [Connecting GA4](docs/connecting-ga4.md#option-b-ga4-via-google-tag-manager) |


You can use **any combination** of the above — PostHog only, GA4 only, both together, GTM + PostHog, etc.

### 2. Add the Tracker Script

Add this to **Project Settings > Custom Code > Footer Code** (or before `</body>`).

**The tracker script must come AFTER your analytics provider scripts.**

```html
<script
  src="https://cdn.jsdelivr.net/gh/BuildWithAdmiralSystems/as-tracking-code@0.0.1/dist/webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

Adjust the attributes based on which providers you're using:

- Remove `data-posthog="true"` if you're not using PostHog
- Remove `data-ga4-id="G-XXXXXXX"` if you're not using GA4 (replace `G-XXXXXXX` with your actual Measurement ID)
- Keep `data-ga4-consent-defaults="denied"` if you want GDPR-compliant consent (recommended)

### 3. Add Events via Attributes

**Pageview event** — add to the `<body>` tag:

```html
<body data-event="Product Viewed">
```

**Click event** — add to any clickable element:

```html
<button data-event="CTA Clicked" data-property-name1="button_label:Click Me">
  Click Me
</button>
```

**Form event** — add to a `<form>` tag:

```html
<form data-event="Contact Form Submitted">
  <input name="email" data-identify="true" />
  <input name="company" data-track="true" />
  <input type="submit" data-submit-button="true" />
</form>
```

## Script Attributes Reference


| Attribute                            | Description                                   | Default   |
| ------------------------------------ | --------------------------------------------- | --------- |
| `data-posthog="true"`                | Enable PostHog adapter                        | `false`   |
| `data-ga4-id="G-XXX"`                | Enable GA4 (comma-separated for multiple IDs) | —         |
| `data-ga4-lowercase="true"`          | Force lowercase GA4 event names               | `false`   |
| `data-ga4-user-id-field="email"`     | Form field to use as GA4 `user_id`            | `"email"` |
| `data-ga4-consent-defaults="denied"` | Set all GA4 consent types to denied on load   | —         |
| `data-google-ads-id="AW-XXXXXXX"`    | Google Ads ID for conversion tracking         | —         |
| `dev-mode`                           | Log events to console instead of sending      | `false`   |


See [Configuration Reference](docs/configuration-reference.md) for full details.

## Documentation


| Guide                                                      | Description                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [How to Track Events](HOW-TO-TRACK.md)                     | Complete attribute reference for pageviews, clicks, forms, and CMS items  |
| [Configuration Reference](docs/configuration-reference.md) | All script tag attributes and their behavior                              |
| [Connecting PostHog](docs/connecting-posthog.md)           | PostHog setup and integration guide                                       |
| [Connecting GA4](docs/connecting-ga4.md)                   | GA4 setup (direct gtag.js or via GTM), naming rules, and parameter limits |
| [GA4 Ecommerce](docs/ga4-ecommerce.md)                     | Track purchases, add-to-cart, and other ecommerce events                  |
| [Google Ads Conversions](docs/google-ads-conversions.md)   | Fire Google Ads conversion events via `data-ga4-conversion`               |
| [Consent Banner](docs/consent-banner.md)                   | Build a GDPR-compliant cookie consent banner in Webflow                   |


## Development

```bash
pnpm install
pnpm run build
```

Output files:

- `dist/webflow-tracker.js` — unminified IIFE bundle
- `dist/webflow-tracker.min.js` — minified production bundle

### Local Testing

Open `test/index.html` via a local server to test with mocked analytics:

```bash
npx serve -l 3000 .
# then open http://localhost:3000/test/index.html
```

## Architecture

```
src/
├── index.ts              # Entry point — init orchestration
├── config.ts             # Parse script tag attributes into TrackerConfig
├── consent.ts            # Consent state, banner wiring, localStorage, gtag consent calls
├── dispatcher.ts         # Central event router — dev mode, consent check, fan-out to adapters
├── posthog-adapter.ts    # PostHog-specific: capture + identify
├── ga4-adapter.ts        # GA4-specific: gtag events, user_id, user properties
├── ga4-validator.ts      # Event name normalization, reserved checks, truncation
├── ga4-ecommerce.ts      # GA4 ecommerce event detection and items[] assembly
├── pageview.ts           # Pageview event handler (body data-event)
├── clicks.ts             # Click event handler (static + CMS + ecommerce)
├── forms.ts              # Form submission handler (track + identify)
├── property-resolver.ts  # Resolve property values (innerHTML, parseFloat, etc.)
└── utils.ts              # Shared utilities (parseProperty, findClosestAncestor)
```

## License

ISC