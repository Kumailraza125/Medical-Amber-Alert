# Hospital Connect — EMS request and hospital acceptance

## Overview
Owner-confirmed scope: remove the Hackathon Submission and Worker Payment tabs and keep only the core EMS-to-hospital coordination workflow. An EMS agent sends a resource request, a receiving hospital accepts directly, and the EMS agent sees a persistent in-app acceptance notification naming that hospital and the acceptance time.

## Users and journey
The shared demo provides an EMS desk and a Hospital desk, with selectors for the dispatch base and receiving hospital. These are demo contexts, not authenticated staff roles. EMS creates a resource request for a selected hospital or all eligible nearby hospitals. A receiving hospital accepts in one action. No second EMS approval is needed. The EMS page polls while visible and displays the accepting hospital automatically. EMS may mark the notification read and optionally mark the request completed after handoff.

## Non-goals
No real patient data, patient intake or AI screening, data imports/exports, worker payments, hackathon submission screens, real ambulance dispatch, email/SMS/browser-push notifications, live clinical capacity, or real staff authentication. Former saved records are retained in Piezas; removed screens and APIs are not served.

## Requirements
- R-020: EMS can send a resource/priority/radius request from a sample dispatch base to a selected eligible hospital or all eligible hospitals. Recipients and EMS desk identity are saved in Piezas. [Stated, current owner request; targeting choice assumed]
- R-021: A receiving hospital directly accepts a pending request; first acceptance wins. Closed, ineligible, non-recipient and competing acceptances are rejected. EMS never approves an offer as a second step. [Stated, current owner request; concurrency rules assumed]
- R-022: EMS receives an automatic in-app acceptance update naming the hospital and time. The acceptance and read state persist in Piezas and survive refresh. [Stated; in-app polling assumed because no external channel was requested]
- R-023: Navigation and hosted routes contain only the EMS desk, Hospital desk, hospital availability, request details and supporting map/ledgers. Retired screening/data/payment/submission endpoints and downloads are unavailable. [Stated, only keep core features]
- R-024: Hospital availability and BC map remain available to support resource matching, using the existing example locations and saved statuses. [Assumed, support for the core workflow]
- R-025: Invalid input is rejected, shared notes reject common sensitive details, text is rendered safely, failed saves remain visible, and the app fits a phone. [Existing safety/usability requirements retained]
- R-026: EMS can mark an accepted request complete without losing its accepting hospital or acceptance notification history. [Assumed, core request tracking]

### R-027: Consistent incoming counts and visible saved requests
Count incoming requests awaiting this hospital's response, not patients or possible acceptances. Use the same saved recipient/status rules for desk and ledger views. Sending while filtered must reveal the saved request; hospital acceptance must move it to Accepted here. Count/filter controls identify their selected view and take visitors to the relevant list.
### R-028: Explore one hospital without changing working desk
A map hospital link opens a dedicated read-only hospital profile with resources, status, contact, and an explicit separate action to open that hospital's desk. Return links preserve originating EMS/hospital context. Map and ledger refresh in the background without resetting filters, selection or search.
### R-029: Type a resource and focus new requests on urgent care
Replace the resource dropdown with a text field with suggestions for supported resources. Match case-insensitively and reject unsupported entries with a useful message rather than inventing eligible capacity. Remove Routine from new submissions while keeping historic records readable.

### R-030: Clear About Us copy and Lee’s interview
About Us explains the project in plain language and presents William Yeung’s experiences in five short themes. Credit teammate Lee briefly for interviewing William, as clarified by the owner. Remove visible PDF/notes citations and the word “account”; keep internal source documentation only. Preserve reported figures and qualifiers, with no invented quotations, credentials or additional interviewees. Desk navigation keeps its context.
### R-031: Restore the original logo and add useful visuals
Restore the original white-cross-on-teal logo from the archived app on the EMS desk, Hospital desk, map/ledgers, hospital profile and About Us. Add an accessible illustration of the existing EMS request → hospital acceptance → EMS notification workflow on About Us and small decorative icons on desk summary cards and the request form. Local assets load in the hosted build, with legible text and no phone overflow.

### R-032: Keep the BC map separate from request tracking
The BC map is a standalone page without Active, Incoming or Completed request tabs. A legacy view query on /network.html must still show the map. Keep geographic filters, hospital details, profiles, logo, About Us and a context-preserving return to the correct desk. Map loading and refreshing read only hospital availability, not request records. Older /requests.html bookmarks remain compatible but are not linked from the map. Lee’s visible credit uses the owner’s wording that he contacted William Yeung for an interview and these are his remarks.

## Data
- Hospital: static example identity, coordinates, resources and contact; readiness status/update time stored in the existing Piezas facility records.
- Request: existing Piezas request entity with base hospitalId for geographic routing, resource, priority, radius, note and status.
- Delivery: existing optional JSON-string field stores requester {type: ems, agentId, baseHospitalId, name}, immutable recipient IDs, routing events, acceptanceMode, acceptedAt and notificationReadAt.
- Acceptance notification: derived server-side from accepted request metadata; the read timestamp is stored on that Piezas request. No local business database, credential storage or simulated external delivery.

## Acceptance Scenarios
### S-024: EMS sends a request to a selected hospital
covers: R-020
Given an EMS agent uses the Cedar Valley base
When they send an MRI request specifically to Maplewood
Then it is saved with Maplewood as its only recipient and appears in Maplewood hospital requests

### S-025: Hospital accepts and EMS sees an automatic notification
covers: R-021, R-022
Given EMS has sent an MRI request and a separate hospital browser is open
When Maplewood accepts the request directly
Then the waiting EMS browser automatically shows Accepted, Maplewood Regional Hospital and an acceptance time without a second approval

### S-026: Reject competing and invalid hospital acceptances
covers: R-021
Given a request has been sent to nearby hospitals
When an ineligible or closed hospital accepts, or two hospitals compete
Then invalid acceptances are rejected and only one accepting hospital remains saved

### S-027: Persist acceptance notifications and their read state
covers: R-022
Given a hospital has accepted an EMS request
When EMS refreshes, marks the notification read and refreshes again
Then the same accepting hospital and time remain visible and its read state remains saved

### S-028: Keep only core navigation and disable retired features
covers: R-023
Given a visitor opens the app and its former workspace link
When they inspect navigation and request retired payment, submission, screening and data endpoints
Then only core EMS/hospital/map navigation is available and retired endpoints or downloads return not found

### S-029: Use hospital availability and the BC map in the core workflow
covers: R-024, R-020
Given Maplewood is marked Closed in its Hospital desk
When EMS starts an MRI request and opens the local BC map with Closed filtering
Then Maplewood is excluded from new request recipients but its closed map marker is selectable

### S-030: Protect shared notes and fit a phone screen
covers: R-025
Given EMS uses a narrow screen
When they enter sensitive identifiers or safe HTML-like note text
Then sensitive input is rejected with a lasting error, allowed text is rendered literally and the page stays within the viewport

### S-031: Complete a request while retaining its acceptance history
covers: R-026
Given a hospital directly accepted an EMS request
When EMS marks the handoff completed
Then the request stays linked to that hospital and its acceptance notification remains available after refresh

### S-032: Keep older acceptance notifications accessible
covers: R-022
Given more than eight hospital requests have been accepted for one EMS desk
When EMS opens the oldest acceptance and marks it read
Then its hospital and time remain accessible and its read state is saved

### S-033: Keep connection-failure errors visible and allow a safe retry
covers: R-025
Given EMS and hospital pages are loaded
When their browser loses connection during sending or acceptance
Then an uncertainty/error message remains visible, no successful change is claimed, and retrying after reconnect works

### S-034: Keep hospital counts and incoming request lists consistent
covers: R-027
Given EMS and separate hospital pages share the same saved scope
When EMS sends to selected or nearby hospitals and a recipient accepts
Then pending counts equal visible incoming rows, the recipient sees the request automatically, and Accepted here shows only that hospital's accepted requests

### S-035: Reveal a newly saved request despite a previous filter
covers: R-027
Given EMS has filtered to completed requests
When EMS sends a new request
Then it appears in the request list with its saved recipients and the selected list filter is clear

### S-036: Explore one hospital and return to the same desk context
covers: R-028
Given an EMS visitor selects Maplewood on the BC map
When they open the hospital profile and return to the map
Then the profile contains only Maplewood's details, preserves the EMS base on return, and switching to Maplewood's working desk is a separate explicit action

### S-037: Type supported resources and reject unsupported or Routine requests
covers: R-029
Given EMS types a supported resource using different letter case
When they send an urgent request
Then matching uses the supported resource and the request is saved; unsupported resource text and new Routine requests are rejected without creating a record

### S-038: Keep map and ledger views current without losing filters
covers: R-028
Given a hospital ledger is open with a search and a BC map is open with a selection and resource filter
When another desk sends a request or updates hospital availability
Then the ledger updates automatically and the map shows the changed availability while search, resource filter and selected hospital stay intact, even when the hospital falls outside the current availability filter (marked clearly and excluded from the match count)

### S-039: Read About Us and Lee’s interview with William Yeung
covers: R-030
Given a visitor opens the EMS or Hospital desk
When they navigate to About Us on desktop or phone
Then they can read the mission, William Yeung’s five experience themes and Lee’s interview credit without notes citations, invented quotes or the word “account”, and return to the same desk context without horizontal overflow; network and hospital-profile pages also link to About Us

### S-040: See the original logo and clear workflow visuals across the app
covers: R-031
Given a visitor opens the desks, BC map, hospital profile and About Us
When each screen renders on desktop or phone
Then the original logo loads on every screen, the About Us workflow illustration is available with meaningful alternative text, and desk summary icons render without changing request actions or causing horizontal overflow

### S-041: Use the BC map without old request tabs
covers: R-032
Given EMS or hospital staff opens the BC map, including an old map link with a request-view query
When they filter hospitals, open a profile or return to their desk
Then only the map is shown, there are no Active/Incoming/Completed request tabs or links, the map does not fetch request records, and desk context and hospital interactions still work on desktop and phone

## Architecture and operational limits
Piezas owns request, readiness and notification metadata records. The app owns validation, UI, matching and notification polling. Existing entity names and stored records remain compatible; no data is deleted. The app serializes mutations in one process so first acceptance wins; multi-replica deployments would need durable concurrency controls. Active EMS pages poll approximately every 4 seconds and on returning to the page. Poll failures show that updates are unavailable; the app never claims an external message was sent.

Shared demo selectors are not authentication. Use sample data only. Actual staff access control and production privacy/clinical review remain outside scope. BC geography is real; hospital locations and capacity remain invented. Road travel times and external emergency dispatch are not provided.

## Scope history
Previous scenario IDs S-001–S-023 and the preceding specification were archived under docs/archive because the owner explicitly replaced that workflow and removed non-core features. Current tests have new IDs rather than silently reinterpreting earlier passed checks.

## Owner-approved interface refinement — 2026-11-09
Simplify the existing core desks and map without changing their workflow. Keep one prominent disclaimer per page covering example data, public role switching, no patient information and no real dispatch. Remove repeated demo/fictional/sample wording from controls and details. Use a clearer visual hierarchy, compact status summary, prominent request form, concise notifications and consistent responsive navigation. Existing S-024–S-033 cover retained behaviour; this is a presentation refinement of those requirements.

## Current workflow corrections — owner request 2026-11-09
Keep the simplified EMS/hospital/map structure; do not restore retired dashboard duplication or patient-transfer counts that the app does not track.

Real patient information and supervisor-only completion depend on the owner's pending choice between the shared prototype and private staff access. Do not represent context selectors as authentication or relax shared-note protections while this is unresolved.

Owner clarification: defer the decision on real patient information and supervisor-only access. This release retains shared-note protections and the existing EMS completion action, with a clear acceptance-versus-handoff explanation. It does not claim supervisor authentication, confirmed patient arrival, patient counts, clinical triage or external dispatch.
