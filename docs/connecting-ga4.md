# Connecting Google Analytics 4

This guide covers how to set up GA4 with the tracker, including event naming rules, parameter limits, and user identification.

There are **two ways** to load GA4 on your site: directly via gtag.js, or through Google Tag Manager (GTM). The tracker works with both. Choose whichever your team already uses.

---

## Step 1: Create a GA4 Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **Admin > Create Property**
3. Follow the setup wizard
4. Under **Data Streams > Web**, create a stream for your site
5. Copy the **Measurement ID** (starts with `G-`)

---

## Step 2: Load GA4 on Your Site

Choose **Option A** (direct gtag.js) or **Option B** (Google Tag Manager). You only need one.

### Option A: GA4 via Direct gtag.js

> **Do NOT copy the snippet below.** It may be outdated. Always get the latest snippet from your own Google Analytics dashboard:
>
> 1. Go to **Google Analytics > Admin > Data Streams**
> 2. Click your web stream
> 3. Under **View tag instructions**, select **Install manually**
> 4. Copy the snippet Google provides — it will have your Measurement ID pre-filled

The snippet will look roughly like this (but always use Google's version):

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

Paste it in Webflow under **Project Settings > Custom Code > Head Code**.

### Option B: GA4 via Google Tag Manager

If you're using Google Tag Manager to manage GA4 (and potentially other tags like Google Ads, Meta Pixel, etc.), the tracker works with this setup too. GTM creates the `dataLayer` and `gtag` function that our tracker uses.

> **Do NOT copy the snippet below.** Always get the latest GTM container snippet from your own GTM dashboard:
>
> 1. Go to [tagmanager.google.com](https://tagmanager.google.com)
> 2. Select your container
> 3. Click the **Container ID** (e.g., `GTM-XXXXXXX`) at the top
> 4. Copy both the `<head>` and `<body>` snippets Google provides

The snippets will look roughly like this (but always use Google's version):

**Head Code** (paste in Webflow **Project Settings > Custom Code > Head Code**):
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

**Body Code** (paste in Webflow **Project Settings > Custom Code > Start of Body**, or right after the opening `<body>` tag):
```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

Then, **inside GTM**, make sure you have a **GA4 Configuration tag** that fires on All Pages. This creates the `gtag` function and connects your Measurement ID.

#### GTM Consent Mode

If you're using GTM with our [consent banner](consent-banner.md), you should also enable Consent Overview in GTM:

1. Go to **Admin > Container Settings**
2. Tick **Enable Consent Overview**
3. In **Workspace > Tags**, click the shield icon to configure consent requirements per tag

Our tracker automatically calls `gtag('consent', 'default', ...)` and `gtag('consent', 'update', ...)`, which GTM reads to decide whether to fire consent-dependent tags.

---

## Step 3: Add the Tracker Script

In **Project Settings > Custom Code > Footer Code** (must come **after** the GA4/GTM snippet):

```html
<script
  src="https://cdn.jsdelivr.net/gh/your-org/as-tracking-code@latest/dist/webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX"
  data-ga4-consent-defaults="denied"
></script>
```

Replace `G-XXXXXXX` with your actual Measurement ID (the one starting with `G-`, not the GTM container ID).

### Multiple GA4 Properties

To send events to multiple GA4 properties, separate the IDs with commas:

```html
<script
  src=".../webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX,G-YYYYYYY"
  data-ga4-consent-defaults="denied"
></script>
```

## Event Name Handling

GA4 has strict rules for event names. The tracker handles this automatically:

### Automatic Conversion

| Your `data-event` value | What GA4 receives | Rule |
|---|---|---|
| `Product Viewed` | `Product_Viewed` | Spaces become underscores |
| `CTA Clicked` | `CTA_Clicked` | Casing preserved by default |

### Optional Lowercase

Add `data-ga4-lowercase="true"` to force lowercase:

| Your `data-event` value | What GA4 receives |
|---|---|
| `Product Viewed` | `product_viewed` |
| `CTA Clicked` | `cta_clicked` |

### Validation Rules

The tracker validates every event name before sending. Events that fail validation are **blocked** and an error is logged:

| Rule | Limit | Behavior |
|---|---|---|
| Max length | 40 characters | Event blocked, error logged |
| Must start with a letter | `[a-zA-Z]` | Event blocked, error logged |
| Allowed characters | Letters, numbers, underscores only | Event blocked, error logged |
| Reserved names | See list below | Event blocked, error logged |
| Reserved prefixes | `query_id` | Event blocked, error logged |

### Reserved Event Names

These event names are reserved by GA4 and will be blocked:

`ad_impression`, `app_remove`, `app_store_refund`, `app_store_subscription_cancel`, `app_store_subscription_renew`, `click`, `error`, `file_download`, `first_open`, `first_visit`, `form_start`, `form_submit`, `in_app_purchase`, `page_view`, `scroll`, `session_start`, `user_engagement`, `view_complete`, `video_progress`, `video_start`, `view_search_results`

> **Note on Pageviews**: If you set `data-event` on the `<body>` tag, it is treated as a **custom event**, not as GA4's built-in `page_view`. GA4 already tracks `page_view` automatically, so this avoids duplication.

## Event Parameter Limits

GA4 enforces strict limits on event parameters. The tracker handles this with warnings and truncation:

| Limit | Value | Behavior |
|---|---|---|
| Max parameters per event | 25 | Extra parameters are dropped with a console warning |
| Max parameter name length | 40 characters | Parameter is skipped with a console warning |
| Max parameter value length | 100 characters | Value is truncated with a console warning |
| Reserved parameter names | See below | Parameter is skipped with a console warning |
| Reserved parameter prefixes | `_`, `firebase_`, `ga_`, `google_`, `gtag.` | Parameter is skipped with a console warning |

### Reserved Parameter Names

`cid`, `customer_id`, `customerid`, `dclid`, `gclid`, `session_id`, `sessionid`, `sfmc_id`, `sid`, `srsltid`, `uid`, `user_id`, `userid`

> Note: `currency` is **not** reserved — it is a prescribed parameter for ecommerce events and `generate_lead`, so it is forwarded to GA4 normally.

## Recommended Event Prescribed Parameters

GA4 recommends specific events with prescribed parameters to power reports and future features. The tracker warns in the console when a recognized recommended event is missing its prescribed parameters. The event is still sent — the warning is just a hint to fix the configuration.

| Event | Prescribed Parameters |
|---|---|
| `generate_lead` | `currency`, `value` |
| `login` | `method` |
| `sign_up` | `method` |
| `search` | `search_term` |
| `select_content` | `content_type`, `item_id` |
| `share` | `method`, `content_type`, `item_id` |

Example warning:

```
GA4: Recommended event "generate_lead" is missing prescribed parameters: currency, value. See https://support.google.com/analytics/answer/9267735
```

To avoid the warning, include the prescribed parameters via `data-property-name{i}`:

```html
<form data-event="generate_lead"
      data-property-name1="currency:USD"
      data-property-name2="value:50">
  ...
</form>
```

For the full list of recommended events, see [GA4 Recommended Events](https://support.google.com/analytics/answer/9267735).

## User Identification

When a form is submitted with `data-identify` fields, the tracker sets GA4 user identity:

### `user_id`

By default, the form field named `email` is used as the GA4 `user_id`. You can change this with `data-ga4-user-id-field`:

```html
<script
  src=".../webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX"
  data-ga4-user-id-field="customer_id"
></script>
```

The tracker calls `gtag('set', { user_id: value })` with the specified field.

### User Properties

All other `data-identify` fields are sent as GA4 user properties via `gtag('set', { user_properties: {...} })`.

User properties have their own limits:

| Limit | Value |
|---|---|
| Max user properties | 25 |
| Max name length | 24 characters |
| Max value length | 36 characters |

### Reserved User Property Names

`cid`, `customer_id`, `customerid`, `first_open_after_install`, `first_open_time`, `first_visit_time`, `google_allow_ad_personalization_signals`, `last_advertising_id_reset`, `last_deep_link_referrer`, `last_gclid`, `lifetime_user_engagement`, `non_personalized_ads`, `session_id`, `session_number`, `sessionid`, `sfmc_id`, `sid`, `uid`, `user_id`, `userid`

### Consent for Identification

GA4 user identification requires **both** `analytics_storage` and `ad_user_data` to be `'granted'`. If either is denied, the `identifyGA4User` call is skipped (PostHog identification still works if `analytics_storage` is granted).

## Google Ads Conversions

To fire a Google Ads conversion alongside any tracked event, add `data-ga4-conversion="AW-XXX/label"` to the element. See [Google Ads Conversions](google-ads-conversions.md) for the full guide.

## Debugging

Add `dev-mode` to log all events to the console:

```html
<script
  src=".../webflow-tracker.min.js"
  data-ga4-id="G-XXXXXXX"
  dev-mode
></script>
```

You can also use **Google Tag Assistant** ([tagassistant.google.com](https://tagassistant.google.com)) to verify events are being received by GA4 in real-time.
