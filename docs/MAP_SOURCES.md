# BC map supporting the core EMS workflow

The map at `/network.html` uses Leaflet, a local British Columbia boundary and optional OpenStreetMap street tiles. Attribution is linked in `dist/map-attribution.txt`. The outline was extracted from a pinned geoBoundaries gbOpen release sourced from Statistics Canada and simplified for display. `?tiles=off` selects local-outline mode.

Hospital names, coordinates, resource inventories and capacity remain example fixtures. Saved facility statuses come from `/api/readiness`, and the Hospital desk can update its own selected sample facility. Closing a facility excludes it from new EMS request recipients and prevents it accepting pending requests. Existing recipient snapshots are retained.

The map preserves the EMS/Hospital context in links. Selecting a hospital shows its location, resources and availability; its desk link opens the Hospital acceptance screen. The optional request ledger shows direct acceptance and the accepting hospital, not an offer awaiting a second EMS approval. All clinical and dispatch decisions remain outside this shared demo.

Current acceptance check S-029 covers availability filtering and map selection. Earlier map/navigation checks remain archived with the superseded workflow.
