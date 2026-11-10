# Hospital Connect

A Piezas-backed prototype for sample staff to coordinate EMS resource requests and hospital responses.

[Live app](https://hospital-connect-2179.apps.piezas.ai)

Sign in with one of the clearly labelled example accounts on the sign-in page. The sample administrator reviews invented employee numbers and assigns an EMS or hospital role. These shared credentials are for trying the workflow, not verifying real healthcare employment. Real patient data, real staff emails and real employee numbers must not be entered.

EMS sends a resource request. Hospital staff confirm current capacity, choose a receiving time (now, 15, 30 or 60 minutes) and accept with one action. Review ownership and confirmation are recorded automatically. EMS sees the accepting hospital and receiving time, confirms transfer arrangements, then records the completed handoff.

Facility preferences and general written replies are removed. Backup escalation, reasoned review takeover, routing and history sit behind secondary disclosures. Historical coordination can be resolved by an explicit acknowledgment of direct contact with EMS. Receiving times are team-confirmed estimates, not appointments, triage recommendations or safe waiting periods. No external alerts or emergency dispatch are sent.

The BC map is separate from request tracking and has no About Us link. The public About Us page credits teammate Lee’s interview with BC paramedic William Yeung and refers to the interview paper.

## Access and storage

Piezas manages credentials and signed sessions. The server checks the approved role and facility on every operational read/write; query parameters do not grant access. Requests, staff assignments, readiness, policy and audit records stay in Piezas. There is no local business database or patient intake.

Example requests remain until an administrator explicitly deletes them by reference and reason. Deletion leaves minimal administrative metadata for the project lifetime and does not recreate seed requests. Provider backup deletion and production retention have not been configured. See the app’s Data care page for current rules.

Before any real patient use, replace shared sample accounts with verified staff onboarding, agree on a real administrator and legally reviewed retention, review provider security and backups, and establish clinical governance. HTTPS and sign-in alone do not establish healthcare compliance.

## Run locally

Requires Node.js 22+ and npm. Run `npm ci`, configure server-only settings using `.env.example`, then `npm run build` and `npm run dev`. Use a separate Piezas test app for `PIEZAS_TEST_API_KEY`; never commit `.env`. The SDK resolves the managed users service from the configured API gateway.

```sh
NODE_USE_ENV_PROXY=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PIEZAS_TEST_PORT=3202 npx piezas test
```

The active scenarios in `SPEC.md` cover the authenticated sample workflow and simplified timed acceptance. The previous public role-switching specification and tests are preserved in `docs/archive/public-staff-predecessor`, because anonymous writes and unrestricted desk switching were intentionally removed at the owner’s request. Existing Piezas request records are retained.

`npm run build` creates a clean `runtime/` with only hosted app files. Run the quality scan and final acceptance checks before publishing.

Everyone uses one sign-in page. Sample account choices fill credentials; their fixed assignments open Dispatcher (EMS), Maplewood/Riverside (hospital inbox), or Administrator. Built-in sample roles and facilities cannot be reassigned; custom staff assignments remain configurable. Suspended access stays blocked.
