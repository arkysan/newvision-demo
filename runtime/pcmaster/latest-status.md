# Latest Status

Generated: `2026-06-03 16:11 Asia/Shanghai`

Project:
- New Vision vehicle website

Source of truth:
- `C:\Users\ARKAI\Desktop\newvision-demo`

Current branch:
- `codex/newvision-wow-upgrade`

Status:
- `PASS`: Export Deal Desk buyer path is implemented locally.
- `PASS`: Inventory cards now expose public stock ID, public lane, quote preview path, `View full deal`, Specs, and quote actions.
- `PASS`: `vehicle.html?id=<stockId>` works as a static public detail page for GitHub Pages and Vercel.
- `PASS`: Quote preview estimates FOB, freight, proof/docs options, and CIF, labeled as an estimate until sales confirms.
- `PASS`: Quote submit captures through `/api/lead`, carries extended quote fields, displays returned `NVQ`, and opens the WhatsApp handoff.
- `PASS`: Sales and owner portals surface quote estimate, freight estimate, proof/docs choice, and public vehicle page URL while preserving owner/sales role separation.
- `PASS`: Tracking page copy now separates public stock IDs, quote IDs, and shipment IDs.
- `PASS`: Local desktop and phone rendered proof passed.
- `BLOCKED`: Live GitHub/Vercel sync proof still fails until the same committed source is published to both public surfaces.
- `BLOCKED`: CMS live editor publish remains disabled until `NEWVISION_ADMIN_TOKEN` and Vercel Blob storage are configured.

Verification:
- `node -c api\lead.js; node -c api\portal.js; node -c scripts\newvision-static-check.js`: PASS.
- `npm test`: PASS, `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- `npm run check:pcmaster`: PASS, `ok: true`, `requiredFiles: 10`.
- Rendered desktop proof: PASS, 35 vehicle cards, 35 full-deal links, quote preview panel, and UAE/Saudi/Nigeria quote buttons.
- Rendered phone proof at `390x844`: PASS, vehicle detail page rendered with no horizontal overflow.
- Mocked buyer submit proof: PASS, `/api/lead` payload included `stockId`, `quoteEstimate`, `freightEstimate`, `inspectionOption`, `docsOption`, `vehiclePageUrl`; response `NVQ-TEST-WOW` rendered a tracking link.
- Failure probes: PASS, bad stock state, API-unavailable inventory fallback, and empty quote required-field validation.
- Role proof: PASS, sales dashboard `200`, sales owner-dashboard access `403`, master dashboard `200` with finance.
- `npm run check:deploy-drift`: FAIL as expected before deploy; Vercel and GitHub currently serve different public hashes.

Next gate:
- Commit, publish the same source to GitHub Pages and Vercel, then rerun `npm run check:deploy-drift` plus live desktop/phone smoke proof on both URLs.
