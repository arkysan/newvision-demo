# Latest Status

Generated: `2026-06-05 03:46 Asia/Shanghai`

Project:
- New Vision vehicle website

Source of truth:
- `C:\Users\ARKAI\Desktop\newvision-demo`

Current branch:
- `master`

Status:
- `PASS LOCAL`: Customer main page map is now directly below the vehicle inventory results and before the post-inventory category band.
- `PASS LOCAL`: Customer map embed uses `worldmap.html?embed=1`, hides map chrome, hides world-events/back-room panels, and renders 36 Leaflet tiles.
- `PASS LOCAL`: Customer-facing page no longer exposes `World Intelligence` or `Active Shipping Alerts`; those remain for `role=sales` and `role=admin` back-room map views.
- `PASS LOCAL`: Owner portal opens `worldmap.html?role=admin`; Andy/Eissa sales portal already opens `worldmap.html?role=sales`.
- `PASS LOCAL`: 3D globe now uses the copied local World Monitor `lib/globe.gl.min.js` bundle plus copied World Monitor texture assets and renders a real canvas on desktop and `390x844` phone.
- `PASS LOCAL`: No-hash home load now starts at the customer shipping map position; rendered proof placed `#global-shipping-map` at `74px` under the sticky nav.
- `PASS LOCAL`: Explicit deep links are respected; `#inventory` stayed at inventory instead of being hijacked by the map-start behavior.
- `LOCAL ONLY`: These latest customer/back-room map changes are not committed, pushed, or deployed yet.
- `PASS`: Current scope is GitHub Pages main gate only: `https://arkysan.github.io/newvision-demo/`.
- `PASS`: Local source now includes world-map entry wiring and `index.html` passes the static emoji guard.
- `PASS`: `npm test` passed locally with `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- `PASS`: `node --check api/worldmap.js`, `node --check api/worldmap-watch.js`, and `node --check scripts/newvision-static-check.js` passed.
- `PASS`: live GitHub Pages returned `200` for `/`, `/worldmap.html`, `/track.html`, and `/vehicle.html?id=NV-2026-0001`.
- `PASS`: rendered browser proof on GitHub Pages desktop found 35 vehicle cards, the ship tracker, world-map links, map tiles, route overlays, event/port panels, and no horizontal overflow.
- `PASS`: rendered browser proof on `390x844` phone found 35 vehicle cards, mobile nav, world map rendered at viewport width, loaded tiles, search input, port panel, and no horizontal overflow.
- `LOCAL CLEANUP PENDING COMMIT`: static-guard cleanup in `index.html` and PCMaster status/proof updates are local until owner asks to commit.
- `OUT OF SCOPE THIS PASS`: Vercel, Cloudflare Pages, jsDelivr mirror, exact `newvision.pages.dev`, and `arksystem.ai`.
- `PASS`: Export Deal Desk buyer path is implemented locally.
- `PASS`: Inventory cards now expose public stock ID, public lane, quote preview path, `View full deal`, Specs, and quote actions.
- `PASS`: `vehicle.html?id=<stockId>` works as a static public detail page for GitHub Pages and Vercel.
- `PASS`: Quote preview estimates FOB, freight, proof/docs options, and CIF, labeled as an estimate until sales confirms.
- `PASS`: Quote submit captures through `/api/lead`, carries extended quote fields, displays returned `NVQ`, and opens the WhatsApp handoff.
- `PASS`: Sales and owner portals surface quote estimate, freight estimate, proof/docs choice, and public vehicle page URL while preserving owner/sales role separation.
- `PASS`: Tracking page copy now separates public stock IDs, quote IDs, and shipment IDs.
- `PASS`: Local desktop and phone rendered proof passed.
- `PASS`: Live GitHub Pages and Vercel public surfaces now pass the deploy drift gate and rendered browser proof.
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
- `git push origin master`: PASS, pushed commit `64f2e55` to GitHub.
- `npx vercel --prod --yes`: PASS, production deployment `dpl_GyWdg8je62DGLGWwyhD6ta6snzCc`.
- `npm run check:deploy-drift`: PASS, GitHub Pages and Vercel both returned `mapped` with normalized hash `c8e1c3fc1b074c11`.
- Live rendered proof against both public URLs: PASS, desktop inventory/deal links, vehicle detail page, phone `390x844` no-overflow detail page, and mocked `NVQ-LIVE-MOCK` quote dispatch/tracking link.

Next gate:
- Configure `NEWVISION_ADMIN_TOKEN` and Vercel Blob storage before enabling CMS live editor publish.
