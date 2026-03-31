# Cookie Consent Banner

This guide walks you through building a GDPR-compliant cookie consent banner in Webflow that integrates with the tracker's consent management system and GA4 Consent Mode v2.

## How It Works

1. You **design the banner visually** in Webflow Designer with full creative control
2. You assign **specific IDs** to the banner elements (buttons, checkboxes)
3. The tracker script **automatically wires up** the click handlers, checkbox states, and consent logic
4. Consent state is persisted in `localStorage('consentMode')` and synced to GA4 via `gtag('consent', 'update', ...)`

When consent is denied, **all events are silently dropped** for both PostHog and GA4 — no data is sent until the user grants consent.

## Prerequisites

- The tracker script must be loaded with `data-ga4-consent-defaults="denied"` to ensure consent starts as denied:

```html
<script
  src=".../webflow-tracker.min.js"
  data-posthog="true"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

## Step 1: Build the Banner in Webflow

Create a new **Div Block** for the banner. Style it however you want — position it fixed at the bottom, use a modal overlay, make it a slide-in panel, etc. The tracker only cares about the **element IDs**, not the styling or structure.

### Required Elements

| Element | Webflow ID | Required? |
|---|---|---|
| Banner wrapper | `as-cookie-banner` | Yes |
| Accept All button | `as-btn-accept-all` | Yes |
| Reject All button | `as-btn-reject-all` | Yes |

### Optional Elements

| Element | Webflow ID | Purpose |
|---|---|---|
| Accept Selection button | `as-btn-accept-some` | Saves only the checked consent types |
| Cookie icon (re-open) | `as-cookie-icon` | Lets users re-open the banner to change preferences |
| Options wrapper | `as-cookie-options` | Container for the granular checkboxes |

## Step 2: Add Consent Checkboxes

For granular consent control, add **Webflow checkboxes** (Form > Checkbox) inside your banner. Each checkbox must have a specific ID corresponding to a GA4 consent type.

| Consent Type | Checkbox ID | What It Controls |
|---|---|---|
| Functionality | `as-consent-functionality` | Essential cookies for site functionality |
| Analytics | `as-consent-analytics` | Analytics tracking (GA4, PostHog) |
| Ad Storage | `as-consent-ad-storage` | Advertising cookies |
| Ad User Data | `as-consent-ad-user-data` | Sending user data for advertising |
| Ad Personalization | `as-consent-ad-personalization` | Personalized advertising |
| Personalization | `as-consent-personalization` | Content personalization cookies |
| Security | `as-consent-security` | Security-related cookies |

### Setting IDs in Webflow

1. Select the **checkbox input** element (not the label or wrapper)
2. Go to **Element Settings** panel (gear icon)
3. Set the **ID** field to the value from the table above (e.g., `as-consent-analytics`)

## Step 3: Assign IDs to Buttons

For each button in your banner:

1. Select the button element
2. Go to **Element Settings**
3. Set the **ID** to the corresponding value from the tables above

## Example HTML Structure

Here's what the final HTML structure looks like (your Webflow classes and styling will differ):

```html
<!-- Banner (hidden by default, shown when no consent is stored) -->
<div id="as-cookie-banner" style="display: none;">
  <div class="cookie-content">
    <h3>Cookie Settings</h3>
    <p>We use cookies to provide you with the best possible experience.</p>

    <!-- Granular checkboxes (optional) -->
    <div id="as-cookie-options">
      <label>
        <input type="checkbox" id="as-consent-functionality" checked disabled />
        Functionality (always on)
      </label>
      <label>
        <input type="checkbox" id="as-consent-analytics" />
        Analytics
      </label>
      <label>
        <input type="checkbox" id="as-consent-ad-storage" />
        Ad Storage
      </label>
      <label>
        <input type="checkbox" id="as-consent-ad-user-data" />
        Ad User Data
      </label>
      <label>
        <input type="checkbox" id="as-consent-ad-personalization" />
        Ad Personalization
      </label>
      <label>
        <input type="checkbox" id="as-consent-personalization" />
        Personalization
      </label>
      <label>
        <input type="checkbox" id="as-consent-security" />
        Security
      </label>
    </div>

    <!-- Buttons -->
    <button id="as-btn-reject-all">Reject All</button>
    <button id="as-btn-accept-some">Accept Selection</button>
    <button id="as-btn-accept-all">Accept All</button>
  </div>
</div>

<!-- Cookie icon to re-open banner (optional, place anywhere on the page) -->
<div id="as-cookie-icon" style="cursor: pointer;">🍪</div>
```

## Behavior Reference

### On Page Load

- If `localStorage('consentMode')` has **no saved state**: the banner is shown automatically
- If consent **was previously saved**: the saved state is restored and the banner stays hidden

### Accept All

Sets all 7 consent types to `'granted'`, saves to `localStorage`, calls `gtag('consent', 'update', ...)`, and hides the banner.

### Reject All

Sets all consent types to `'denied'` **except** `functionality_storage` (which stays `'granted'` since it's required for the site to work). Saves, updates GA4, and hides the banner.

### Accept Selection

Reads the checked/unchecked state of each checkbox, maps them to the consent types, and saves. `functionality_storage` is always forced to `'granted'` regardless of checkbox state.

### Cookie Icon Click

Re-opens the banner and populates the checkboxes with the currently saved consent state, so users can review and change their preferences.

## Consent Gating

The tracker checks consent **before every event**:

| Action | Required Consent |
|---|---|
| `captureEvent` (pageview, click, form) | `analytics_storage` must be `'granted'` |
| `identifyUser` (form identify fields) | `analytics_storage` must be `'granted'` |
| `identifyGA4User` (GA4 user properties) | `ad_user_data` must also be `'granted'` |

If consent is denied, events are **silently dropped** — no errors, no queuing. Events that occur before the user grants consent are lost, which is the GDPR-compliant behavior.

## Webflow Custom Checkbox Compatibility

Webflow renders checkboxes with a custom visual `<div>` sibling. The tracker handles this by toggling the `w--redirected-checked` class on the preceding sibling element when populating checkbox states (e.g., when the cookie icon re-opens the banner). This ensures the visual state matches the actual checked state.

## Programmatic Consent

You can also update consent via JavaScript if needed:

```javascript
// Grant all
webflowTracker.updateConsent({
  functionality_storage: 'granted',
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  personalization_storage: 'granted',
  security_storage: 'granted',
});

// Check current state
const state = webflowTracker.getConsentState();
console.log(state.analytics_storage); // 'granted' or 'denied'
```

## Testing

1. Set `dev-mode` on the script tag to see console logs
2. Open the browser console and look for `[Tracker DEV]` messages
3. Check `localStorage.getItem('consentMode')` to see the stored consent state
4. Clear localStorage and reload to re-trigger the banner:
   ```javascript
   localStorage.removeItem('consentMode');
   location.reload();
   ```
