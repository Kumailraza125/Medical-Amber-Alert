# Hospital Connect — sample staff coordination

## Overview
The owner requested staff sign-in, role permissions, employee-number registration, recorded review responsibilities, resource reconfirmation, clearer stages, preferences, escalation and storage/deletion rules. They explicitly chose SAMPLE email addresses and staff accounts and to keep REAL PATIENT DATA BLOCKED. This is an authenticated prototype for invented examples, not verified professional access or a clinical service. No real staff email, employee number or patient data should be entered.

## Users and permissions
Piezas users service owns credentials and signed sessions. Cookies are HttpOnly and SameSite=Strict (Secure on hosting). Demo administrator, EMS and hospital accounts are explicitly shared examples; anyone using their published sample credentials can try those roles. This does not establish real employment or production security. Employee-number requests must use DEMO identifiers and .example.test addresses; they remain pending until the sample administrator records a verification decision and assigns a role/facility. Browser-provided role/facility/user IDs are never authorization. EMS sees requests from its assigned base; a hospital sees only requests addressed to or accepted by its assigned hospital; administrator manages example staff, settings and deletion. No AI medical screening or real clinical decisions.

## Requirements
- R-042: Real Piezas-managed sign-in/sign-out and MFA-challenge handling; verified service sessions determine server-side permissions. Samples are labelled as public example identities, not verified healthcare workers. Invalid, anonymous and disabled users cannot access coordination records.
- R-043: Sample access registration collects a display name, DEMO employee number, sample email and requested role/facility. The administrator must review and approve or reject it. Request fields never grant privileges. No actual employee verification integration or email to real people is provided.
- R-044: Requests show Submitted, Under review, Awaiting response, Accepted and Completed stages. The EMS coordinator and reviewing hospital member are identified from their sessions. Another approved member of the same hospital can take over a pending review only with a recorded reason; the previous reviewer then loses authority to make its review decision. Required resource/priority/radius fields are validated; medical decisions stay with qualified staff in a future real deployment. Notes remain non-clinical examples.
- R-045: Hospital availability shows update time and updating staff. One direct acceptance action records review ownership, explicit resource confirmation and a required team-confirmed receiving time (now, 15, 30 or 60 minutes). An unpublished Open/Limited availability is published with a valid acceptance; stale, paused or Closed availability is rejected. Saving newer availability invalidates old confirmation. EMS must confirm transfer arrangements against the current availability before completion; the app does not independently confirm arrival or direct an ambulance.
- R-046: Facility preferences and general written coordination are removed from the active UI and new submissions. Historical values remain in Piezas. Staff can resolve outstanding historical coordination by an explicit direct-contact acknowledgment before accepting or reconfirming.
- R-047: Configurable SAMPLE workflow response targets and backup contact are shown. Unanswered requests can be escalated with a reason and recorded timestamp. Escalation does not send email, SMS or emergency dispatch. A service failure tells staff to use their established offline process. No 24/7 staffing or clinically safe waiting time is claimed.
- R-048: Requests remain in Piezas until a sample administrator explicitly deletes them using their reference and reason. Deletion does not recreate seed records. Minimal deletion/audit metadata remains for the project lifetime. No automatic purging, provider backup erasure or production-compliant retention is claimed. Real retention/legal/privacy approval remains required before any real-patient use.
- R-049: BC map stays standalone and has NO About Us link. It uses authenticated availability. Public About Us retains Lee’s interview credit, the interview-paper wording, William Yeung’s name and the reported 12-hour, 3–6-hour, 16-hour and 1–2-hour details without invented quotes; the original logo and diagram remain; operational data routes require approved sample staff access. Responsive interface fits a phone.
- R-050: Acceptance notifications retain accepting hospital, time and read state. First valid accepting hospital wins. All workflow actions and reasons have server-derived staff identity/time, with least-privilege checks on every read/write.

- R-051: One shared sign-in form serves all staff; verified assignments determine the workspace. Built-in sample accounts retain fixed roles and facilities, with approved sample misassignments repaired and recorded; suspended or rejected access remains blocked. Custom staff assignment controls remain available. Hospital receiving activation persists in Piezas, blocks new routing while paused, and shows incoming EMS requests automatically. The nine listed resource types replace Emergency beds for new requests; old records remain readable.

- R-052: The urgent request view shows resource, priority, current state and one primary next action. Facility preference and the generic reason/reply box are absent. Exceptions (escalation and reasoned review takeover), recipients, backup and history are secondary disclosures. A receiving time is an operational estimate, not a triage recommendation, safe waiting period or appointment booking. Hospital pending queues sort Critical before Urgent, then oldest first. Responsive screens keep labels, focus and large touch targets clear.

## Architecture
Use the published Piezas SDK: users service for credentials/sessions, entity records for staff approvals, policy, audit, readiness and requests. No local business database, hand-written authentication provider or passwords in entity records. The SDK derives users-service routing from the existing required PIEZAS_API_URL. Existing example requests are retained; no automatic mass deletion or seed recreation. App process serializes mutations; multiple replicas would need durable concurrency controls.

## Acceptance Scenarios
### S-042: Sign in as sample staff and reject role spoofing
covers: R-042, R-049
Given a visitor is not signed in
When they sign in with invalid or valid sample credentials and change URL context
Then invalid credentials fail, valid staff get their assigned desk, changing role/base parameters grants no privileges, and sign-out removes access

### S-043: Approve employee-number access requests before granting a role
covers: R-043, R-042
Given a person registers with a sample email and DEMO employee number
When the sample administrator records verification and approves a facility role
Then the pending user gains only that role; self-assigned admin fields and non-sample identifiers are rejected

### S-044: Restrict operational records by assigned role and hospital
covers: R-042, R-050
Given EMS and hospital staff have different assignments
When they read or change requests belonging to another base or unrelated hospital
Then unauthorized reads return not found and unauthorized writes fail without changing records

### S-047: Escalate unanswered requests using the configured backup process
covers: R-047
Given a sample response target and backup contact are configured
When staff escalate an unanswered request or lose connection during saving
Then reasons and actors are recorded, the backup path is clear, and no external notification or successful offline save is claimed

### S-048: Apply the storage policy and delete only with administrator approval
covers: R-048, R-042
Given sample requests are stored in Piezas
When a non-admin tries deletion or an administrator confirms a reference and reason
Then only the authorized deletion succeeds, the request stays deleted after reload, and minimal deletion metadata remains

### S-049: Keep the authenticated BC map separate and remove About Us there
covers: R-049
Given approved sample staff opens BC map or a public About Us page
When they inspect navigation and select a hospital on a phone
Then the map has neither request tabs nor About Us, the logo and map work, About Us remains available elsewhere, and no horizontal overflow occurs

### S-051: Accept once and notify the requesting EMS desk
covers: R-050, R-045
Given an EMS request has multiple eligible hospital recipients
When hospitals compete to accept after review and confirmation
Then one hospital wins, the other is rejected, and EMS sees the persistent accepting hospital/time and can mark the update read

### S-052: Revoke staff access immediately
covers: R-042, R-043
Given an approved sample employee has an active session
When an administrator suspends their app assignment
Then the existing session no longer permits operational reads or writes

### S-053: Complete managed second-factor sign-in and retry an incorrect code
covers: R-042
Given an approved sample employee enrolled an authenticator through Piezas
When they sign in, enter an incorrect code and then a correct code
Then no session is granted for the incorrect code and the correct code opens their assigned desk

### S-054: Manage approvals, backup settings and suspension through the interface
covers: R-043, R-047, R-044, R-042
Given a new sample employee requested hospital access
When the administrator verifies their invented number, sets a backup policy and approves the role on screen, and the employee takes over a review with a reason
Then the assigned employee can review that hospital’s request, the saved target and backup apply, and suspending them on screen removes their access

### S-056: Find a simple, visual staff sign-in page
covers: R-042, R-043
Given a visitor opens staff sign-in on desktop or phone
When they explore the page and expand sample desks or request access
Then email and password are the primary form, sample details and registration start collapsed, the branded coordination illustration is visible, and all access paths remain available without horizontal scrolling

### S-058: Request the expanded resource choices
covers: R-044, R-050, R-051
Given EMS creates a request
When they choose Ultrasound, CT scan, MRI, X-ray, Advanced Trauma Team, Blood & Lab Work, Cast/Stitches Support, Ventilator or ICU beds
Then each resource has matching sample hospital capabilities and can be delivered; Emergency beds is removed from new choices and rejected for new requests while historical records are retained

### S-059: Activate hospital receiving and see EMS requests arrive
covers: R-045, R-050, R-051
Given hospital staff can activate or pause receiving new EMS requests
When EMS sends a matching request after activation
Then it appears automatically with an incoming notice, hospital acceptance notifies the requesting EMS desk, pausing blocks new routing and acceptance without hiding existing requests, and another hospital or EMS cannot change the switch

### S-061: Keep older pending requests visible after receiving is paused
covers: R-049, R-051
Given a historical pending request has no saved recipient list
When its hospital pauses receiving or closes availability
Then the older request remains visible with its routing and can still be reviewed, while new delivery and acceptance stay blocked until receiving is active and availability allows it

### S-062: Use one sign-in page and open the correct sample workspace
covers: R-042, R-043, R-051
Given everyone uses one email-and-password sign-in form without role-selection boxes
When each sample account signs in
Then Dispatcher opens EMS, each hospital sample opens its own hospital inbox, Administrator opens staff management, forged browser roles cannot change access, approved built-in misassignments are repaired with an audit entry, fixed sample roles cannot be reassigned, and suspension is preserved

### S-063: Accept with one clear action and a receiving time
covers: R-044, R-045, R-050, R-052
Given a hospital opens a new EMS request on desktop or phone
When staff confirm capacity, choose a receiving time and accept
Then one primary action records review ownership and acceptance, publishes previously unconfirmed open availability, notifies EMS with hospital and receiving time, and displays neither facility preference nor a generic reply box

### S-064: Confirm current transfer arrangements before completing a handoff
covers: R-045, R-050, R-052
Given a request was accepted with a receiving time
When availability changes after transfer confirmation
Then completion is blocked until the hospital reconfirms current availability and EMS confirms arrangements again; completion retains receiving hospital, times and staff history

### S-065: Reset a checked confirmation when availability changes
covers: R-045, R-052
Given hospital staff checked capacity in an open request
When another session changes availability
Then stale confirmation cannot accept the newer version, the current availability is shown, the checkbox resets, and staff must explicitly reconfirm before acceptance

### S-066: Validate direct acceptance and keep one accepting hospital
covers: R-042, R-045, R-050, R-052
Given a request has multiple recipient hospitals
When staff omit or forge the receiving time, use an unauthorized desk, or accept concurrently
Then invalid changes fail without acceptance, one valid hospital wins, its selected receiving time persists, and EMS can read the persistent notification

### S-067: Resolve historical coordination directly and retain safe records
covers: R-046, R-048, R-052
Given a saved request has an outstanding written coordination question or alternative review
When the accepting hospital confirms direct coordination with EMS
Then pending acceptance or reconfirmation succeeds only with that acknowledgment, prior records remain, history identifies the acting staff, removed fields cannot be submitted on new requests, notes are safely rendered, and sensitive information is rejected

## Scope history
The owner replaced the public role-switching prototype with authenticated SAMPLE staff workflows. The former SPEC and S-024–S-041 browser checks are preserved under docs/archive/public-staff-predecessor; they depended on anonymous writes and unrestricted role/base switching that are intentionally removed. New checks replace that contract with explicit authentication and authorization checks; old checks are not loosened or silently skipped. Real patient access remains out of scope by the owner's explicit choice.

The owner subsequently removed role-selection boxes in favor of the shared sign-in form. The unchanged former S-057 specification and test are archived under docs/archive/role-choice-signin; S-062 verifies the replacement workflow and all sample accounts.

The owner subsequently replaced the detailed request dialog with direct, timed acceptance. The unchanged former S-045, S-046, S-050, S-055 and S-060 are archived under docs/archive/detailed-request-workflow; S-063–S-067 cover the replacement.
