# Hospital Connect

A Piezas-backed EMS-to-hospital coordination demo.

1. An EMS agent sends a resource request to a hospital or all matching nearby hospitals.
2. A receiving hospital accepts directly. The first valid acceptance wins.
3. EMS sees an automatic in-app notification naming the accepting hospital and acceptance time.

[Live app](https://hospital-connect-2179.apps.piezas.ai) · [BC map](https://hospital-connect-2179.apps.piezas.ai/network.html)

The app now keeps only the EMS desk, Hospital desk, hospital availability, request tracking, acceptance notifications, and supporting map/ledgers. Screening, patient-data tools, worker payments and hackathon submission screens are retired. Historical source and checks remain in `docs/archive`; saved Piezas records are retained.

## Run locally

Requires Node.js 22+ and npm. Run `npm ci`, configure server-only settings using `.env.example`, then run `npm run build` and `npm run dev`. The local app listens on port 3100. Keep `.env` private and use a separate Piezas test app for `PIEZAS_TEST_API_KEY`.

Open the EMS desk in one browser and `/?role=hospital&hospital=maple` in another. Send an MRI request from the Cedar Valley base and accept it at Maplewood. The visible EMS page checks for saved updates approximately every four seconds and when focus returns. Notifications and read state are stored in Piezas; no external email, SMS or browser-push message is sent.

## Checks and deployment

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PIEZAS_TEST_PORT=3130 npx piezas test
```

If using Playwright's downloaded Chromium, omit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The current acceptance contract is in `SPEC.md`; S-024–S-033 cover the simplified core workflow. The owner explicitly replaced the prior workflow, so earlier feature checks are archived rather than silently redefined.

`npm run build` creates a clean `runtime/` containing only core server and public assets. Dependencies, generated builds, local credentials and Piezas account state are excluded from Git. Run the quality scan and then the acceptance checks before publishing.

## Limits

This is a shared public demo. Desk selectors are not authentication; do not enter real patient data. Hospital identities, locations, resources and capacity are examples. BC geography is real. Notifications are in-app and depend on the app being open or reopened. No live clinical capacity, road routing, real emergency dispatch, payments or clinical screening is provided.

See [HOSPITAL_CONNECT.md](HOSPITAL_CONNECT.md), [SPEC.md](SPEC.md) and [map source notes](docs/MAP_SOURCES.md).
