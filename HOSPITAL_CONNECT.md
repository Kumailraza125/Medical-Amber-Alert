# Hospital Connect demo

An interactive hospital resource coordination dashboard built for TeamM8s_App.

## Run locally

Requires Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3100. To use another port, run `npm run dev -- --port 3200`.

## Try the workflow

1. Start as Cedar Valley Community Hospital and create an MRI request.
2. Switch to Maplewood Regional Hospital and choose Incoming.
3. Open the request and offer an availability time.
4. Switch back to Cedar Valley, accept the response, then mark the request completed.

The hospital directory lists sample resources. Resource and radius matching uses fictional facility coordinates and straight-line distances.

## Files

- `dist/index.html`, `dist/styles.css`: page structure and styling.
- `dist/app.js`: dashboard and in-memory request workflow.
- `dist/seed.js`: fictional hospitals and requests.
- `scripts/serve.mjs`: local static server.
- `SPEC.md`: agreed demo scope and acceptance criteria.
- `tests/scenarios/`: seven Playwright workflow checks.

The HTML, CSS, and JavaScript in `dist/` are the editable source; no bundler is required. `npm run build` checks JavaScript syntax. A static web host can serve `dist/` directly.

## Check the app

```sh
npm run build
npx playwright install chromium
npx playwright test
```

The browser configuration uses Playwright's installed Chromium by default. On Linux with a system browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.

## Demo limitations

All hospitals and requests are fictional. Changes reset on refresh and are not shared between visitors. No patient data, real notifications, authentication, or live backend is included. The included Piezas packages support future backend work; this demo makes no Piezas API calls and needs no API key.

The hosting account settings, credentials, and generated local state are intentionally excluded. The existing privately hosted demo remains separate from this GitHub repository.
