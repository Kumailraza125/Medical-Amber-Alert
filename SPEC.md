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

## Architecture and operational limits
Piezas owns request, readiness and notification metadata records. The app owns validation, UI, matching and notification polling. Existing entity names and stored records remain compatible; no data is deleted. The app serializes mutations in one process so first acceptance wins; multi-replica deployments would need durable concurrency controls. Active EMS pages poll approximately every 4 seconds and on returning to the page. Poll failures show that updates are unavailable; the app never claims an external message was sent.

Shared demo selectors are not authentication. Use sample data only. Actual staff access control and production privacy/clinical review remain outside scope. BC geography is real; hospital locations and capacity remain invented. Road travel times and external emergency dispatch are not provided.

## Scope history
Previous scenario IDs S-001–S-023 and the preceding specification were archived under docs/archive because the owner explicitly replaced that workflow and removed non-core features. Current tests have new IDs rather than silently reinterpreting earlier passed checks.
