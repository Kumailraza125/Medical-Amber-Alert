# Hospital Connect

## Overview
An interactive shared dashboard connecting fictional hospitals that need resources to nearby fictional hospitals that can help. The owner chose a shared demo with requests saved in Piezas. The owner confirmed this scope in chat and asked to see it.

## Non-goals
Real patient data, validated clinical triage, trained clinical AI, real alerts, staff authentication, real transfers, real hospital records and live payment processing are excluded. The hackathon extension adds fictional patient cases, transparent demo priority rules, readiness, synthetic-data checks and submission material. All mutations are saved in Piezas and shared between demo visitors.

## Users and journeys
Hospital staff can simulate any sample hospital. They create a request, switch to a matching hospital to offer availability, then switch back to accept an offer and complete the request. No roles or access enforcement are simulated as real security. Anyone visiting can act as any fictional hospital. Do not enter patient or confidential information.

## Requirements
- R-001: Staff can switch between sample hospitals and view relevant requests. [Stated, chat]
- R-002: Staff can create requests with resource, urgency, and a positive radius defaulting to 100 km. [Stated, chat]
- R-003: Requests match only other hospitals with the required resource inside the radius using sample coordinates. [Stated, original MRI example]
- R-004: Matching hospitals can respond with estimated availability, once per request. [Stated, confirmed summary]
- R-005: The requesting hospital can accept one response and mark that request completed. [Stated, confirmed summary]
- R-006: Staff can browse sample hospital resources and filter requests by search and status. [Assumed, dashboard navigation]
- R-008: Requests and responses persist in Piezas through refresh and are visible to other demo visitors. [Stated, chat]
- R-009: Failed saves remain visible as errors; invalid or stale workflow actions are rejected on the server. [Assumed, shared persistence]
- R-007: The dashboard is usable on a narrow screen, labels fictional data clearly, and provides empty states and safe rendering of user input. [Assumed, demo usability]

## Hackathon extension requirements
- R-010: Create a case from five fixed fictional patient profiles, answer screening questions, save a reasoned demo priority and ranked open facilities. [Stated, AI Hacathon.pdf; assumed transparent rules because no clinical dataset/model supplied]
- R-011: Show and update fictional facility availability and crew readiness, exclude closed facilities from recommendations, and flag long demo shifts. [Stated, rural-dispatch problem narrative; assumed 12-hour fatigue marker]
- R-012: Keep names, contact details and medical background out of network resource requests; generate fake identifiers and reject arbitrary patient identity data. [Stated, launch data-care requirement; shared public demo retained from owner choice]
- R-013: Generate synthetic patient data as CSV, JSON and XLSX, and validate CSV/JSON imports before storing case records in Piezas. [Stated, AI Hacathon.pdf; assumed imports accept only the included synthetic dataset]
- R-014: Flag duplicate demo patient records for human review without labelling a person fraudulent or blocking care coordination; save review decisions. [Stated fraud-check idea, assumed non-punitive duplicate-data rule]
- R-015: Demonstrate worker-payment approval and a provider handoff, clearly distinguishing a simulation from an externally verified payment. Owner explicitly chose the no-charge payment demo. Real payment processing remains out of scope. [Stated payment idea; platform gap]
- R-016: Provide the Build Your Own case answers, a one-page problem summary, assumptions, three-minute pitch, judge demo script and evidence status. Never invent an interview. [Stated, Hackathon Launch.pptx]

## Data
- Hospital: id, name, town, coordinates, resources, sample contact
- Request: id, hospitalId, resource, urgency, radiusKm, note, createdAt, status, acceptedHospitalId
- Response: requestId, hospitalId, availabilityMinutes

## Screens and interface
Dashboard with overview cards, request list, nearby hospital panel, hospital switcher, and request detail drawer. Resource directory with cards. New request modal with inline validation and match preview. Calm teal, light gray, navy, amber urgency accents. Responsive accessible controls with visible focus. Demo banner explains fictional data, public sharing and saved changes. Refresh loads changes made by other visitors. Failed loads offer Retry and failed saves keep the form open.

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

### S-008: Keep a request after refresh and share it with another visitor
covers: R-008
Given a visitor creates a sample MRI request
When they refresh the page and another visitor opens the same demo
Then both see the saved request and a response remains saved after refresh

### S-009: Reject invalid actions and keep failed saves visible
covers: R-009
Given a matching hospital has responded to a request
When a duplicate offer or an invalid transition is sent and a visitor submits an invalid hospital
Then the server rejects those changes, the page displays the save error, and the existing response remains unchanged

### S-010: Create a synthetic case with an explained demo priority
covers: R-010
Given a visitor opens the case workspace
When they select a fictional profile and submit a breathing-concern screening answer
Then the saved case shows Critical demo priority, a rule explanation and open matching facilities after refresh

### S-011: Exclude closed facilities and show tired crews
covers: R-011
Given the readiness screen lists sample hospitals and crews
When a visitor closes Maplewood and opens an MRI case
Then Maplewood is excluded from its recommendations and a crew with a 13-hour shift has a fatigue warning

### S-012: Share a resource request without patient identity
covers: R-012
Given a synthetic case has a suggested resource
When a visitor sends its request and another tries to submit a real-looking health identifier
Then the network request contains only the case reference and resource, and the identity submission is rejected

### S-013: Export synthetic data and validate an import
covers: R-013
Given the data workspace offers a generated fictional dataset
When a visitor downloads CSV, JSON and XLSX and imports the JSON twice
Then all formats include the five required patient fields, cases are saved in Piezas, and the repeated import does not duplicate them

### S-014: Review duplicate data without denying coordination
covers: R-014
Given a visitor creates two cases for the same fictional profile
When they open data checks and mark the duplicate reviewed
Then a recorded review appears and the case can still create a resource request

### S-015: Review a demo worker payment without charging anyone
covers: R-015
Given a fictional worker has a demo service record
When a visitor creates a payment draft and approves its demo handoff
Then its saved history shows the approval and clearly states that no payment was processed

### S-016: Show the third-option case and honest submission evidence
covers: R-016
Given a judge opens the submission workspace
When they view the case answers, assumptions and pitch
Then all Build Your Own prompts are covered, the three-minute script is available and missing interview evidence is explicitly labelled

### S-017: Follow a case through the completed hospital workflow
covers: R-010, R-008
Given a synthetic MRI case sends a resource request
When Maplewood offers availability and Cedar Valley accepts and completes the request
Then the linked case shows Completed after refresh

### S-018: Reject common patient details in shared request notes
covers: R-012
Given a visitor opens a resource request
When they enter a personal name, health number or contact detail in the public note
Then the server rejects the save, the error remains visible, and no request is created

### S-019: Import the generated CSV and reject altered details
covers: R-013
Given a visitor downloads the generated CSV dataset
When they import that CSV then submit a version with an altered health identifier
Then five synthetic cases are saved and the altered file is rejected without adding cases

## Edge cases
No matching hospitals produces an honest empty state; offers require a positive availability time; closed requests reject further offers; only the requesting hospital can accept or complete. Invalid resource and radius values are rejected. Notes are displayed as text, never executed as HTML.

## Piezas mapping and architecture
The owner chose the shared fictional demo backed by Piezas. A small Node server uses the published @piezas/sdk with a server-only API key. Requests and nested responses are Entity Records of type hospital_connect_shared_demo_request (hospital_connect_test_demo_request in the test app); record status tracks Awaiting responses, Accepted and Completed. A fixed app tag isolates this demo from other records. The fixed fictional hospital directory stays in a fixture module. There are no accounts, real notifications or local business database. Only validated workflow actions are exposed; there is no general records proxy. A Report a problem button uses the Piezas SDK route. Tests use the separate test app and per-browser fixture tags; live visitors all share the same demo tag. The shared hosting app uses one process and serializes read-modify-write actions; horizontal scaling would need durable concurrency support before enabling multiple replicas.

## Implementation phases
Confirmed description → interactive sample-data mock → owner chose shared demo with Piezas persistence → backend wiring and publishing.

## Assumptions and gaps
The uploaded PDF mixes brainstorming, proposed features and GitHub instructions. Its GitHub commands are reference content, not an instruction to publish source or create a repository. The launch deck requires fake data, a live app, a one-page summary, a three-minute pitch, explicit assumptions and a real interview. The owner confirmed no one has been interviewed yet. Their starting belief is that BC, especially rural communities, has a medical staff shortage. The interview evidence requirement remains open until a real interview is conducted. News links are secondary sources and do not substitute for the interview.
The shared public demo cannot claim real staff access control or healthcare compliance. Only generated fake identities are accepted by the new intake/import endpoints. Older public request notes use conservative checks for common identifiers, proper-name patterns, contact details and clinical labels. These checks are accident prevention, not a guarantee: a shared free-text field must still never contain real patient data. HTTPS hosting and server-only credentials protect transport and keys; a private production version needs authenticated roles, access logging, retention, security review and clinical governance. Screening is deterministic demo workflow logic, not an AI model or a clinically validated triage system. Payment processing is not available in Piezas; a simulated approval flow or owner-supplied provider test checkout is required.

Sample geography and straight-line distances illustrate the radius; travel times are not calculated. Offers are manually entered, with no actual capacity guarantees. No external services are needed for the demo.

## Open Conflicts
none
