# Pitchside — automatic Google Maps configuration

Visitors are not asked for an API key. The website reads the configured key on
startup; Use my location only asks for browser location permission. An early
click waits for Maps initialization to finish.

## Configure your existing key once

In the folder containing package.json, copy .env.example to .env if you do not
already have a .env file. Keep your actual key in:

    GOOGLE_MAPS_BROWSER_KEY=your_existing_key
    GOOGLE_MAPS_KEY_MODE=demo
    GOOGLE_MAPS_MAP_ID=

Use standard instead of demo for a standard billed Google Cloud key.
Existing GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and
VITE_GOOGLE_MAPS_API_KEY variable names are also supported. The canonical
GOOGLE_MAPS_BROWSER_KEY wins if several names are populated.

The app loads .env and .env.local into its local development Worker. Restart
npm run dev after edits. Setting a value only in .env.example does not configure
the application. A key entered into the old popup was stored only in that page's
memory; it was never saved to the server or a file.

For the hosted website, set the same canonical variables in its hosting
environment. Local .env files are not uploaded by deployment.

## Run

Install Node.js 22.13 or newer. In this folder:

    npm ci
    npm run dev

Open http://localhost:5173. For a production build, use npm run build.
npm start serves the Worker build locally.

## Behavior

A single shared initialization promise loads Maps. Location clicks made before
that completes wait for it, without opening a setup dialog. If configuration
is missing or Google rejects the key, visitors see an availability error,
never a credential form. Sample venues remain clearly labelled.

The browser key is intentionally used by the Google Maps JavaScript SDK.
Restrict it to your website domains and the required APIs in Google Cloud.
The app never puts it in an archive, Git, logs, or browser storage. Its
/api/maps-config endpoint returns only the explicitly selected browser key,
map ID and key-mode flags.

Open now does not confirm a booking slot. Contact venues to check slots,
facilities and rates. Live verification requires a working key and Google
project configuration.

## Main files changed in this fix

- lib/maps-config.ts: environment names, precedence, and local Worker bindings.
- lib/maps-session.ts: automatic initialization shared by page load and actions.
- lib/device-location.ts: browser permission and position handling.
- components/pitchside.tsx: visitor key dialog removed; actions wait for Maps.
- app/api/maps-config/route.ts: configured browser-key response.
- vite.config.ts: .env/.env.local loading for the local development Worker.

See GOOGLE_MAPS_SETUP.md for free testing and standard-key instructions.
