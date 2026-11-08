# Hospital Connect

## Overview
A quick interactive dashboard demo connecting fictional hospitals that need resources to nearby fictional hospitals that can help. The owner confirmed this scope in chat and asked to see it.

## Non-goals
Real patient data, clinical triage, real alerts, authentication, real transfers, persistent records and backend wiring are excluded from milestone 0. All mutations are in-memory and reset on refresh.

## Users and journeys
Hospital staff can simulate any sample hospital. They create a request, switch to a matching hospital to offer availability, then switch back to accept an offer and complete the request. No roles or access enforcement are simulated as real security.

## Requirements
- R-001: Staff can switch between sample hospitals and view relevant requests. [Stated, chat]
- R-002: Staff can create requests with resource, urgency, and a positive radius defaulting to 100 km. [Stated, chat]
- R-003: Requests match only other hospitals with the required resource inside the radius using sample coordinates. [Stated, original MRI example]
- R-004: Matching hospitals can respond with estimated availability, once per request. [Stated, confirmed summary]
- R-005: The requesting hospital can accept one response and mark that request completed. [Stated, confirmed summary]
- R-006: Staff can browse sample hospital resources and filter requests by search and status. [Assumed, dashboard navigation]
- R-007: The dashboard is usable on a narrow screen, labels fictional data clearly, and provides empty states and safe rendering of user input. [Assumed, demo usability]

## Data
- Hospital: id, name, town, coordinates, resources, sample contact
- Request: id, hospitalId, resource, urgency, radiusKm, note, createdAt, status, acceptedHospitalId
- Response: requestId, hospitalId, availabilityMinutes

## Screens and interface
Dashboard with overview cards, request list, nearby hospital panel, hospital switcher, and request detail drawer. Resource directory with cards. New request modal with inline validation and match preview. Calm teal, light gray, navy, amber urgency accents. Responsive accessible controls with visible focus. Demo banner explains fictional data and refresh behavior.

## Acceptance Scenarios
### S-001: Switch hospitals to see their requests
covers: R-001
Given the demo opens as Cedar Valley Community Hospital
When staff switch to Maplewood Regional Hospital and choose Incoming requests
Then matching requests from other hospitals appear with an offer action

### S-002: Send a resource request from the dashboard
covers: R-002
Given staff open New request
When they submit an urgent MRI request with the default radius
Then a new awaiting request appears with a 100 km radius

### S-003: Show only hospitals that match the request
covers: R-003
Given staff open New request for MRI
When they change the radius from 100 to 20 km
Then the matching hospital preview shows only facilities inside 20 km, and submitting zero radius is blocked

### S-004: Offer availability once from a matching hospital
covers: R-004
Given Maplewood Regional Hospital views an incoming MRI request
When staff offer availability in 45 minutes
Then their response appears and the offer form is replaced by confirmation

### S-005: Accept a response and finish the request
covers: R-005
Given Cedar Valley views its MRI request with a response from Maplewood
When staff accept that hospital then mark the request completed
Then the request shows Completed and the accepted destination

### S-006: Find hospitals and filter requests
covers: R-006
Given the dashboard contains sample requests
When staff search for an absent resource then open the hospital directory and search MRI
Then the request empty state appears first and the directory shows only hospitals with MRI

### S-007: Use the demo on a phone with safe input
covers: R-007
Given staff use a 390 pixel wide screen
When they create a request containing HTML-like text in its coordination note
Then the note appears as literal text in its details, the page fits the viewport, and the fictional-data banner remains visible

## Edge cases
No matching hospitals produces an honest empty state; offers require a positive availability time; closed requests reject further offers; only the requesting hospital can accept or complete. Invalid resource and radius values are rejected. Notes are displayed as text, never executed as HTML.

## Piezas mapping and architecture
Milestone 0 is static HTML/CSS/JS with fixture modules and in-memory state, no API or database. After approval, Hospital/Request/Response map to Entity Records, stages to Pipeline, hospital accounts to Users/Admin, and alerts to Notifications. Backend service slices and capabilities must be checked before wiring them.

## Implementation phases
Confirmed description → interactive sample-data mock → owner reaction → backend work if requested.

## Assumptions and gaps
Sample geography and straight-line distances illustrate the radius; travel times are not calculated. Offers are manually entered, with no actual capacity guarantees. No external services are needed for the demo.

## Open Conflicts
none
