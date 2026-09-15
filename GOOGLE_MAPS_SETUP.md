# Google Maps setup for Pitchside

Checked against Google's official documentation on 14 September 2026.

## Option A — free key for testing, no billing details

Open https://developers.google.com/maps/documentation/javascript/demo-key
and click **Get a Demo Key**. Sign in to Google, accept Google's terms and
copy the key into .env as GOOGLE_MAPS_BROWSER_KEY. Set
GOOGLE_MAPS_KEY_MODE=demo and restart npm run dev. The app loads it automatically.

Google limits this key to prototyping and imposes daily quotas. Reaching a
limit pauses usage until the next day without charges. User-submitted photos
and reviews are unavailable. This download omits photo and rating fields in
that mode. For production, use a standard key.

Do not enable billing merely to try this option.

## Option B — standard production key, free monthly allowances

1. Open https://console.cloud.google.com/ and create a project named Pitchside.
2. Link a billing account. Google may require payment details.
3. In APIs & Services > Library, enable **Maps JavaScript API** and
   **Places API (New)**.
4. In APIs & Services > Credentials, select **Create credentials > API key**.
5. Edit the key. Under Application restrictions, choose **Websites**.
6. For this local download allow:
   - http://localhost:5173/*
   - http://127.0.0.1:5173/*
7. If you also use the existing hosted site, allow:
   - https://pitchside-cricket.rajesh-warna-us.chatgpt.site/*
8. Under API restrictions select **Restrict key**, allowing just
   **Maps JavaScript API** and **Places API (New)**.
9. Save the key as GOOGLE_MAPS_BROWSER_KEY in .env, set
   GOOGLE_MAPS_KEY_MODE=standard, restart npm run dev and refresh the page.

Official setup:
https://developers.google.com/maps/documentation/javascript/get-api-key

No Routes API or Geolocation API is needed by this app. Device location comes
from the browser; directions open on Google Maps.

## What is free with a standard key?

These are monthly billable-event allowances per SKU, not website visitor limits.

| Service used by the full app | Global allowance | Eligible India allowance |
| --- | ---: | ---: |
| Dynamic Maps | 10,000 | 70,000 |
| Text Search Pro (basic location lookup) | 5,000 | 35,000 |
| Text Search Enterprise (venue searches with ratings) | 1,000 | 7,000 |
| Place Details Enterprise (hours/contact information) | 1,000 | 7,000 |
| Place Details Photos | 1,000 | 7,000 |

Usage above each allowance is chargeable. India prices depend on Google's
eligibility rules, not simply your current browser location.

Official price lists:
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/pricing-india

## Control usage before sharing the production app

Open Google Maps Platform > Quotas in the Cloud console and inspect the
available limits for both enabled APIs. Lower editable limits for testing.
Also create budget alerts under Billing > Budgets & alerts.

Budget alerts notify you; they do not enforce a spending cap. Quotas apply at
API/method level and may not map directly to monthly SKU allowances, so do not
assume a quota guarantees a zero bill.

One All grounds search makes three text-search requests, and full mode may
request a photo for each returned venue. Location resolution and opening venue
details add requests. Monitor actual usage, including other projects sharing
the billing account. For no billing risk while prototyping, use Option A.

Budget alert documentation:
https://docs.cloud.google.com/billing/docs/how-to/budgets

India eligibility:
https://developers.google.com/maps/billing-and-pricing/india

Official usage documentation:
https://developers.google.com/maps/documentation/javascript/usage-and-billing

## Troubleshooting

- **Invalid key / authorization error:** Check that you copied the whole key.
- **RefererNotAllowedMapError:** Add the exact website origin and port to the
  key's allowed website list, save and retry after propagation.
- **ApiNotActivatedMapError:** Enable the two APIs listed above.
- **BillingNotEnabledMapError with a standard key:** Link its project's billing
  account. If you want no-billing testing, obtain the dedicated Demo Key instead.
- **Quota error:** Wait for reset or reduce usage. Raising quotas on a standard
  key can allow extra charges.
- **Different key rejected:** Restart the server and refresh the page after changing the configured key.
- **Location denied:** Type a neighborhood and city into the search field.
- **No photos or ratings in free demo-key mode:** Expected; those requests are
  deliberately omitted. Missing live images are not replaced with fake venues.

Browser Maps keys are visible to visitors by design. Use website and API
restrictions, and keep .env out of Git.
