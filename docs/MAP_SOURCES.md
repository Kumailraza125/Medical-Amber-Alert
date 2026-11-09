# BC map and request navigation

The large map at `/network.html` uses Leaflet, a local British Columbia boundary and optional OpenStreetMap street tiles. Source attribution and licences are included in `dist/map-attribution.txt` and linked visibly on the map. The outline was extracted from a pinned geoBoundaries gbOpen release sourced from Statistics Canada, simplified for display, and bundled with the app. `?tiles=off` opens the local-outline mode.

Existing invented hospitals retain their original coordinates and resource fixtures. Map availability comes from the Piezas-backed readiness screen; it is an example manually entered status, not real clinical capacity. Resource/status/radius filters affect both markers and the accessible hospital list. The selected hospital pane contains coordinates, resources, last update, sample contact and a crew briefing preview. No dispatch is sent.

Each dashboard card is a link: `/requests.html?view=active`, `/requests.html?view=incoming`, `/network.html`, or `/requests.html?view=completed`. The current hospital is preserved in the URL. Ledger rows name senders, recipients, respondents and accepted destinations and link to the existing request detail dialog.

New requests store a recipient snapshot and coordination events in an optional `delivery` field on their Piezas record. An additive schema update introduces that optional string field without changing existing values. Older records without a snapshot are labelled as current matches rather than historical delivery. Reopening a facility does not add it retroactively to a saved recipient list. Closed facilities cannot offer or have an old offer accepted.

Checks S-020–S-023 reproduce the dead map/card links and verify navigation, marker selection, availability filtering, offline geometry, and saved recipients.
