# Hospital Connect shared demo

A dashboard for exploring coordination between fictional hospitals. Anyone visiting can switch to any sample hospital. Requests, responses and completion changes save in Piezas and are shared by all visitors. Do not enter patient or confidential information. No real alerts are sent.

## Run

Use Node 22+ and npm. Run `npm ci`, configure server-only `.env` values `PIEZAS_API_KEY`, `PIEZAS_TEST_API_KEY` and `PIEZAS_API_URL=https://api.piezas.ai`, then `npm run build` and `npm run dev`. Open http://localhost:3100.

`npm run build` bundles the Node server and the published SDK into `runtime/`, with browser assets in `runtime/public/`. No secrets are bundled. Publish `runtime/` as a server app.

## Try the workflow

Create an MRI request as Cedar Valley, switch to Maplewood and open Incoming, offer availability, then switch back to Cedar Valley to accept and complete it. Refresh loads changes made by another visitor.

## Checks

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PIEZAS_TEST_PORT=3101 npx piezas test` runs real Piezas calls using the separate test key. Each browser test has its own fixture tag in the test app; none seed the live app. A fresh key is never exposed to browser code. Run the quality scan and then the checks last before publishing.

## Limits

Hospital resources and coordinates are fictional; radius matching uses straight-line distance. There is no patient handling, staff authentication, clinical suitability check, or real capacity guarantee. Anyone with the link may change the shared fictional requests. Hosting runs one app process; horizontal scaling requires a durable concurrency design first.

## Hackathon extension

Open `/workspace.html` for synthetic case intake, explained demo screening, facility and crew readiness, duplicate-data review, CSV/JSON/XLSX dataset exports, validated CSV/JSON import and no-charge worker-payment approval. The Submission tab includes the third-option case answers and downloadable summary, pitch script and slides. `python docs/generate-submission.py` regenerates the handoff files; it requires ReportLab and python-pptx. The normal build copies the checked-in deliverable assets and needs no Python.

The owner confirmed no interview has happened yet. That judging requirement remains outstanding. Screening is deterministic illustrative logic, not trained clinical AI. Payments are a no-charge demonstration, as chosen by the owner. No real clinical dataset, live payment gateway or real staff accounts are used.

## BC map and request overview

Open `/network.html` for the interactive map or use the dashboard's nearby panel. The BC geography is real; the hospital network and capacity remain fictional. Each dashboard card opens a dedicated active/incoming/nearby/completed view. Request details now distinguish saved recipient snapshots from current matches and show saved response, acceptance and completion events. See `docs/MAP_SOURCES.md` for licences, fallback behaviour and data semantics.
