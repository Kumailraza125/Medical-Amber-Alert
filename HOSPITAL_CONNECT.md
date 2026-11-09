# Hospital Connect: core EMS workflow

## EMS sends a request

Choose an EMS dispatch base, required resource, human-set priority, search radius and recipient hospital. Select all eligible nearby hospitals when seeking the first available acceptance. The server saves an EMS desk identity and an immutable recipient list in Piezas. Notes are limited to resource/timing coordination; no patient information should be entered.

## Hospital accepts directly

Switch to the Hospital desk and select the receiving sample hospital. Open an incoming request and choose **Accept request — notify EMS**. The server checks eligibility, saved recipients, current availability and request status. The first valid hospital acceptance records that hospital as the destination; a competing acceptance gets a conflict rather than overwriting it. There is no second EMS approval step.

## EMS is notified

A visible EMS desk checks saved updates about every four seconds and when returning to the page. Its acceptance panel names the hospital and shows the acceptance timestamp. The notice remains available after refresh; marking it read saves a timestamp on the same Piezas request. EMS can optionally mark the handoff completed while retaining the accepting hospital and notification history.

## Supporting map and availability

The BC map retains its existing geographic outline, optional street tiles, hospital markers and resource/status/radius filters. Hospital availability is edited in the Hospital desk. The hospitals and availability remain examples, not verified clinical capacity. See `docs/MAP_SOURCES.md` for attribution.

## Retired scope

The owner asked to keep only the core EMS → hospital acceptance → EMS notification workflow. Patient-case screening, dataset imports/exports, worker payments and hackathon submission screens/APIs/downloads are no longer served. The former `/workspace.html` link redirects to the core app. Existing Piezas records are not deleted; historical source and checks are archived under `docs/archive`.

## Operational limits

No real patient data or actual dispatch is supported. Desk selectors demonstrate contexts rather than authenticated staff roles. Server-only Piezas credentials protect the app connection, but this is not a production healthcare system. In-app notification polling is not an emergency alert channel. Mutations are serialized in the app's single hosting process; multi-replica operation would require durable concurrency safeguards.
