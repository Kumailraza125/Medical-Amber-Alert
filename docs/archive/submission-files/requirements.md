# Hackathon requirement mapping

Sources: AI Hacathon.pdf (team brainstorm and proposed features), Hackathon Launch.pptx (official cases and judging prompts). User selected option 3, Build Your Own, and retained the shared fictional demo.

| Requirement | Implementation / evidence | Limit |
|---|---|---|
| Connect unequipped hospitals to nearby resources | Existing request → offer → accept → complete workflow, 100 km default | Fictional facilities; straight-line distance |
| Classify emergency and assign risk | New case questionnaire with saved, explained demo priority | Rule-based, not trained AI or clinical triage |
| Patient data CSV/JSON/XLSX | Generated fictional profiles, exports, validated CSV/JSON import into Piezas | No real identities or health numbers |
| Payment for workers | Demo draft/review/handoff record, owner chose no-charge demo | Piezas does not process payments |
| Security and data care | Server-only keys, HTTPS hosting, minimised network payload, synthetic-only intake | Public demo; no real staff authentication or compliance claim |
| Fraud idea | Duplicate-data warning and human review, independent of coordination | No fraud accusation or automatic care denial |
| Rural closures and exhaustion | Facility readiness, shift-hours warning, open-facility matching | Invented statuses and 12-hour marker |
| Name organization/user and root cause | Submission problem summary | Problem framing to validate with a real user |
| Costs and stakes | Time, uncertain capacity, staff workload and safety | No invented measured impact |
| Reluctant user | Busy dispatcher; existing phone workflow retained as fallback | Assumed until interview |
| Core workflow and 3–4 must-haves | Intake → explain priority → request matching open resource → offer/accept/complete | See judge demo script |
| One real person interviewed | Owner confirmed no interview has occurred | Cannot be fulfilled with fabricated evidence |
| Live app, one-page summary, 3-minute pitch | Publish after checks; submission downloads | Interview status remains honest |

## Secondary references supplied by the team

These are contextual links from the uploaded brainstorm, not interview evidence and not independently verified findings for this submission.

- CBC: https://www.cbc.ca/news/canada/british-columbia/bc-ambulance-paramedics-under-pressure-9.6985466
- CTV Vancouver: https://www.ctvnews.ca/vancouver/article/fewer-paramedics-on-shift-as-bcambulance-millions-over-budget/

## Browser-check mapping

S-001 through S-009 cover the existing coordination workflow, phone layout, persistence and invalid actions. S-010 covers explained screening; S-011 facility closure and shift marker; S-012 patient-data minimisation; S-013 exports and import validation; S-014 duplicate review without denial; S-015 no-charge payment approval; S-016 the third-option submission and honest interview status; S-017 follows a linked case through request completion; S-018 checks rejection of common patient details in public notes; S-019 validates CSV import and rejects altered data. The release checks run against a separate Piezas test app. They verify software behaviour, not clinical validity or payment-provider settlement.

## Outstanding required evidence

The owner confirmed that the team has not spoken to anyone yet. The official third option asks for at least one real person with this problem. An interview is still required; secondary news and team assumptions do not satisfy it.

## BC map and dashboard follow-up

The nearby-hospital panel and each dashboard summary card are now navigation links. The full BC map supports hospital selection, availability/resource/radius filters, and a local-geography fallback when optional street tiles are unavailable. Existing hospital locations and capacity remain invented; no real dispatch is sent. Active/incoming/completed ledgers show sender, routing information, offers and accepted destination. New requests save their recipient list and action history; older requests explicitly distinguish current eligible matches from missing historical routing. Checks S-020 through S-023 cover this follow-up. See MAP_SOURCES.md for map licences and implementation details.
