# Hospital Connect

A Piezas-backed hackathon demo for coordinating resources between fictional hospitals in British Columbia.

- [Live app](https://hospital-connect-2179.apps.piezas.ai)
- [Dispatch workspace](https://hospital-connect-2179.apps.piezas.ai/workspace.html)
- [Hackathon submission](https://hospital-connect-2179.apps.piezas.ai/workspace.html?view=submission)

The demo includes synthetic patient intake, explained screening rules, facility and crew readiness, resource requests and responses, duplicate-data review, CSV/JSON imports, CSV/JSON/Excel exports, and no-charge worker-payment approval. The submission screen provides a one-page problem summary, a three-minute pitch, slides, assumptions and requirement mapping.

All identities and hospital information are fictional. Screening is illustrative rule logic, not trained clinical AI. Payments are simulations. The team has not conducted the required user interview yet. This shared public demo must not hold real patient information.

## Development

Requires Node.js 22+ and npm. Install with `npm ci`, configure server-only settings using `.env.example`, then run `npm run build` and `npm run dev`. The local app listens on port 3100. Keep `.env` private; use a separate Piezas test app for `PIEZAS_TEST_API_KEY`.

`npm run build` creates the deployable server and public assets in `runtime/`. Generated build output, dependencies and local Piezas account state are excluded from Git.

## Validation

Run the browser checks against the separate test app:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PIEZAS_TEST_PORT=3101 npx piezas test
```

If using Playwright's downloaded Chromium, omit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Install it with `npx playwright install chromium` if needed. The current feature set has 19 checked journeys.

See [HOSPITAL_CONNECT.md](HOSPITAL_CONNECT.md) for the workflow and limitations, [SPEC.md](SPEC.md) for acceptance cases, and [docs/HACKATHON_REQUIREMENTS.md](docs/HACKATHON_REQUIREMENTS.md) for the third-option requirement mapping.

The checked-in submission downloads can be regenerated with `python docs/generate-submission.py` when ReportLab and python-pptx are installed. Regeneration uses Liberation Sans from `/usr/share/fonts/truetype/liberation/`.
