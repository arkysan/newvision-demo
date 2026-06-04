# Proof

Status: PASS

GitHub Pages main-gate repair proof:
- Time: `2026-06-05 02:45 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Branch: `master`.
- Scope: GitHub Pages main gate only; Vercel, Cloudflare Pages, mirror repo, jsDelivr, exact `newvision.pages.dev`, and `arksystem.ai` are intentionally out of scope until owner asks.
- Live pre-check: `https://arkysan.github.io/newvision-demo/` returned `200` with New Vision signals.
- Live pre-check: `https://arkysan.github.io/newvision-demo/worldmap.html` returned `404`, confirming the main gate is missing the world-map page.
- Local source fix: `index.html` emoji-style UI characters were replaced with ASCII labels so the existing static guard stays strict.
- Local syntax proof: `node --check api/worldmap.js`, `node --check api/worldmap-watch.js`, and `node --check scripts/newvision-static-check.js` passed.
- Local static proof: `npm test` passed with `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- Live GitHub Pages proof after source commit `05d7bfe`: `/`, `/worldmap.html`, `/track.html`, and `/vehicle.html?id=NV-2026-0001` all returned `200`.
- Rendered desktop proof on `https://arkysan.github.io/newvision-demo/`: 35 vehicle cards, live ship tracker present, world-map links point to `/worldmap.html`, no horizontal overflow.
- Rendered desktop proof on `https://arkysan.github.io/newvision-demo/worldmap.html`: map element present, 108 Leaflet tiles, 23 route/overlay elements, event panel populated, port panel populated, no horizontal overflow.
- Rendered phone proof at `390x844` on home: 35 vehicle cards, mobile burger visible, live ship tracker present, no horizontal overflow.
- Rendered phone proof at `390x844` on `/worldmap.html`: map width `390`, map height `792`, 24 tiles, search input present, port panel present, no horizontal overflow.
- Console note: one browser console error was `https://arkysan.github.io/favicon.ico` 404; no New Vision route or world-map data route failure was observed.
- Local cleanup pending commit: `index.html` static-guard cleanup and PCMaster proof/status updates remain local until owner requests commit.

Live deploy proof:
- `git commit`: `83e8c2e feat: publish New Vision feedback quote flow`.
- `git push origin master`: PASS, `7c721c7..83e8c2e master -> master`.
- `npx vercel --prod --yes`: PASS, deployment `dpl_FtfkqQJGUeWcsCRybPDendMmPAvm`, production alias `https://newvision-demo.vercel.app`.
- `Invoke-WebRequest https://arkysan.github.io/newvision-demo/?v=83e8c2e`: PASS; new review script version, GitHub canonical URL, Eissah, and Andy all present.
- `Invoke-WebRequest https://newvision-demo.vercel.app/?v=83e8c2e`: PASS; new review script version, GitHub canonical URL, Eissah, and Andy all present.
- Live Playwright mobile proof against GitHub Pages and Vercel: PASS; Leave Feedback opens, quote flow prepares New Vision Sales, Eissah, and Andy links with buyer data, and console errors are `0`.
- `Invoke-WebRequest https://newvision-demo.vercel.app/api/cms?action=status`: PASS as honest blocker; `adminConfigured:false`, `storageConfigured:false`.
- `PUT https://newvision-demo.vercel.app/api/cms?action=review-patches` without token: PASS as blocked; `503 missing_admin_token`.

Latest UI proof before this contract task:
- Local preview: `http://127.0.0.1:52452/`
- Viewport: `390x844`
- Search button count: `1`
- After tapping Search, first vehicle card top: `72px`
- Vehicle cards rendered: `35`
- Mobile bottom bar buttons: `4`
- All bottom buttons had icons: `true`
- Browser console warnings/errors: `0`
- Screenshot: `artifacts/phone-search-tabs-20260601.png`

Contract proof:
- `npm test`: PASS. Static check returned `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- `npm run check:pcmaster`: PASS. Contract check returned `ok: true`, `requiredFiles: 10`.

Mobile quote/language proof:
- Browser target: `http://127.0.0.1:52452/`.
- Phone viewport override used for responsive proof.
- Bottom app dock labels: `Cars`, `Filter`, `Quote`, `Lang`.
- Bottom app dock icon count: `4`.
- Quote form requires `qContact`: `true`.
- Quote vehicle options: `38` including 35 vehicles plus select/fleet/other.
- Tapping mobile Quote auto-filled vehicle: `2025 Mercedes-Benz C 260 L 2025 Night Edition Sport`.
- Auto-filled message included the vehicle and FOB price.
- Mobile quote form layout collapsed to one column.
- Mobile language panel opened with `EN`, `AR`, `FR`, `中文`.
- Choosing Chinese changed bottom dock labels to `车辆`, `筛选`, `询价`, `语言`.
- Chinese quote contact label displayed `WHATSAPP / 电话 *`.
- Contact placeholder localized to `+86 137 0000 0000`.
- Browser console warnings/errors: `0`.
- Screenshot: `artifacts/phone-quote-language-20260601.png`.

PCMaster proof refresh:
- Browser target: `http://127.0.0.1:52452/?v=pcmaster-mobile-proof-3#inventory`.
- Viewport: `390x844`.
- Mobile app bar display: `grid`.
- Mobile app buttons: `4`; every button had an SVG icon.
- Quote section appears before Active Shipping Routes: `true`.
- Required fields: `qName`, `qCountry`, `qContact`, `qVehicle`, `qPort`, `qMsg`.
- Direct visible WhatsApp CTA bypass count: `0`.
- Static local CMS auto-load gate: `canAutoLoadCmsState=false`; missing resources: `0`.
- Language proof: French selected; `html.lang=fr`, Cars became `Voitures`, quote name label became `Votre Nom`.
- Quote proof: focused `qName`, kept the form visible on phone, prefilled vehicle `2026 Tesla Model Y L 2026 Standard Range`, and included the FOB quote message.
- Submit proof: rendered WhatsApp handoff links for `New Vision Sales`, `Eissah`, and `Andy`; primary opened URL included name, country, WhatsApp/phone, vehicle, port, and message.
- Browser console warnings/errors: `0`.
- Screenshot: `runtime/pcmaster/phone-quote-proof-20260601.png`.

Review overlay quick-action proof:
- Browser target: `http://127.0.0.1:52452/`.
- Viewport: `820x1180`.
- Loaded script: `arkreview.js?v=20260601-review-actions`.
- Quick action chips with `data-action`: `15`.
- Chip labels verified: `Make bigger`, `Make smaller`, `Change wording`, `Use green`, `Use gold`, `Move up`, `Move down`, `Remove`, `Add more`, `Stock photo`, `Fix spacing`, `Fix phone`, `WhatsApp flow`, `Language`, `Keep this`.
- Workflow tested: open review panel -> flag `Vehicle Inventory` section -> click `Make bigger` -> click `WhatsApp flow`.
- Result: note badge changed to `2`; note list had `2` structured notes.
- Result: `Make bigger` applied a draft preview, changing section title font from `22px` to `26px`.
- Result: `WhatsApp flow` created a structured note with status `Must verify quote/contact handoff`.
- Browser console warnings/errors: `0`.
- Screenshot: `artifacts/review-quick-actions-20260601.png`.

Quote/editor publish proof:
- Time: `2026-06-01 01:00 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Mirror target updated deliberately: `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision`.
- Changed files: `index.html`, `arkreview.js`, `api/cms.js`, `scripts/newvision-static-check.js`.
- Quote placement proof: rendered mobile Playwright check found How index `9`, Quote index `10`, Routes index `11`, and quote top `126px` after pressing Contact Our Team.
- Required sales data proof: quote submit required/populated name, country, WhatsApp/phone, vehicle, destination port, and message.
- WhatsApp recipient proof: completed request links rendered for `New Vision Sales`, `Eissah`, and `Andy`; each link contained the same completed buyer request.
- Copy proof: quote dispatch rendered `Copy completed request`.
- Editor proof: review editor rendered Redo, Annotate, Move Up, Move Down, and Publish controls.
- Publish honesty proof: local preview does not claim public publish; deployed site publish path targets `/api/cms?action=review-patches` and requires admin token plus Blob storage.
- Language smoke proof: FR quote submit became `Envoyer la Demande via WhatsApp`; ZH quote submit became `通过WhatsApp发送询价`.
- Syntax proof: `node -c api\cms.js; node -c arkreview.js; node -c scripts\newvision-static-check.js` passed.
- Static proof: `npm test` passed with `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- PCMaster contract proof: `npm run check:pcmaster` passed with `ok: true`, `requiredFiles: 10`.
- Mirror proof: copied file hashes matched for `index.html`, `arkreview.js`, `api\cms.js`, and `scripts\newvision-static-check.js`; mirror `npm test` and syntax checks passed.
- Screenshot: `artifacts/quote-flow-mobile-proof.png`.

Phone review bottom-sheet proof:
- Time: `2026-06-01 01:06 Asia/Shanghai`.
- Browser target: `http://127.0.0.1:52452/`.
- Viewport: `390x844`.
- Review button visible while the phone app dock is visible: `Review 4`.
- Closed-state proof: review button rect `x=275`, `y=708`, `w=98`, `h=40`; app dock display `grid`.
- Open-state proof: review panel display `flex`, body class `rv-open`, app dock display `none`.
- Bottom-sheet proof: panel rect `x=8`, `y=236`, `w=369`, `h=608`; website visible height above sheet `236px`.
- Vehicle/website content remained visible above the editor sheet.
- Quick actions render as phone grid: `grid`, columns `163px 163px`.
- Browser console warnings/errors: `0`.
- Static guard added so phone review editor cannot regress to hidden/full-screen behavior.
- Screenshot: `artifacts/phone-review-bottom-sheet-20260601.png`.

Export Deal Desk proof:
- Time: `2026-06-03 16:11 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Branch: `codex/newvision-wow-upgrade`.
- Changed buyer path: inventory cards expose `View full deal`, `FOB + freight preview`, proof/docs options, and `NVQ` quote ID path.
- New public detail page: `vehicle.html?id=NV-2026-0001` renders gallery, specs, export readiness, quote preview, `NVQ` capture, tracking link, and WhatsApp handoff without exposing private VIN or exact back-room location.
- Quote capture proof: mocked `/api/lead` returned `NVQ-TEST-WOW`; buyer handoff rendered `Track NVQ-TEST-WOW`; lead payload included `stockId`, `quoteEstimate`, `freightEstimate`, `inspectionOption`, `docsOption`, and `vehiclePageUrl`.
- Failure proof: bad stock ID rendered an honest not-found state; Vercel vehicles API failure fell back to static `data/vehicles.json`; empty quote submit was blocked by required fields.
- Role proof: Andy login returned `sales`; `sales-dashboard` returned `200`; sales access to owner dashboard returned `403`; master dashboard returned `200` with finance.
- Desktop rendered proof: 35 vehicle cards, 35 full-deal links, quote preview panel present, and UAE/Saudi/Nigeria market quote buttons present.
- Phone rendered proof: `390x844` vehicle detail page had no horizontal overflow and rendered CIF quote preview.
- Screenshots saved by Browser: `newvision-wow-desktop-home.png`, `newvision-wow-phone-vehicle.png`.
- Syntax proof: `node -c api\lead.js; node -c api\portal.js; node -c scripts\newvision-static-check.js` passed.
- Static proof: `npm test` passed with `ok: true`, `vehicles: 35`, `vehicleImages: 35`.
- PCMaster contract proof: `npm run check:pcmaster` passed with `ok: true`, `requiredFiles: 10`.
- Live drift proof before deploy: `npm run check:deploy-drift` failed because Vercel served `arkreview.js?v=20260602-review-engine` and GitHub served `arkreview.js?v=20260603-annotation-fix`; this remains expected until the same committed source is published to both public surfaces.

Export Deal Desk live sync proof:
- Time: `2026-06-03 16:41 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Branch: `master`.
- Commit pushed to GitHub: `64f2e55 feat(newvision): add export deal desk buyer path`.
- Vercel production deploy: `npx vercel --prod --yes` passed, deployment `dpl_GyWdg8je62DGLGWwyhD6ta6snzCc`.
- `npm run check:deploy-drift`: PASS; Vercel and GitHub both returned `mapped` with normalized hash `c8e1c3fc1b074c11`.
- Public fetch proof: both `https://arkysan.github.io/newvision-demo/` and `https://newvision-demo.vercel.app/` served `arkreview.js?v=20260603-annotation-fix`, `View full deal`, `quotePreview`, and `vehicleDealUrl`.
- Live rendered proof: Playwright passed on both public URLs for 35 inventory cards, 35 full-deal links, `vehicle.html?id=NV-2026-0001`, no private VIN/back-room copy, phone `390x844` no horizontal overflow, quote preview, and mocked `NVQ-LIVE-MOCK` dispatch/tracking link.

Customer map placement and back-room split proof:
- Time: `2026-06-05 03:46 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Scope: local GitHub-main-gate repair only; no Vercel, Cloudflare, jsDelivr, or `arksystem.ai` deployment touched.
- Customer placement: rendered `http://127.0.0.1:52452/` found exactly one `#global-shipping-map`, placed after `#vehicleGrid` and before the post-inventory category band.
- Customer map embed: iframe `src="./worldmap.html?embed=1"`, accessible title present, `allow="geolocation"` present, 36 loaded Leaflet tiles in the embed.
- Customer privacy split: public home text did not contain `World Intelligence` or `Active Shipping Alerts`; embedded customer map had `customer-mode embed-mode`, `#right` hidden, `#left` hidden, `#hdr` hidden, and `riskLayers=0`.
- Route board proof: 6 `#shippingRouteTabs` buttons; selecting Europe changed board title to `Europe destination lane` and transit to `28–42 days`.
- Back-room proof: `worldmap.html?role=admin` had `backroom-mode`, `#right` visible, route brief visible, owner portal visible, and `riskLayers=9`.
- Customer standalone proof: `worldmap.html` had `customer-mode`, world events panel hidden, route brief hidden, owner portal hidden, `riskLayers=0`, and 40 loaded map tiles.
- 3D globe proof: desktop `worldmap.html` loaded `./lib/globe.gl.min.js`, click rendered overlay with 1 canvas, canvas `980x848`, `window.__newVisionGlobe=true`, auto-rotate true, zoom true, pan false, no fallback text, and no relevant console errors.
- 3D globe phone proof: `390x844` rendered overlay with 1 canvas, canvas `390x792`, `window.__newVisionGlobe=true`, no fallback text.
- Mobile placement proof: `390x844` home rendered map iframe `360x380`, route board position `static`, 6 tabs, and no horizontal overflow.
- Syntax/static proof: `node --check scripts/newvision-static-check.js`, `node --check api/worldmap.js`, `node --check api/worldmap-watch.js`, `npm test`, and `npm run check:pcmaster` passed.
- Screenshots: `C:\Users\ARKAI\AppData\Local\Temp\newvision-proof\main-map-after-inventory.png`, `C:\Users\ARKAI\AppData\Local\Temp\newvision-proof\worldmap-3d-globe-desktop.png`, `C:\Users\ARKAI\AppData\Local\Temp\newvision-proof\main-map-mobile.png`, `C:\Users\ARKAI\AppData\Local\Temp\newvision-proof\worldmap-3d-globe-mobile.png`.

GitHub Pages start-position proof:
- Time: `2026-06-05 04:17 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Request: make `https://arkysan.github.io/newvision-demo/` start/refresh at the customer route-map position.
- Local rendered proof: `http://127.0.0.1:52452/` with no hash landed with `#global-shipping-map` top at `74px` under sticky nav height `64px`.
- Hash-safety proof: `http://127.0.0.1:52452/#inventory` kept `#inventory` at `82px` and did not force the map.
- Console proof: no browser errors in the rendered check.
- Static proof: `npm test`, `npm run check:pcmaster`, and `node --check scripts/newvision-static-check.js` passed.

Premium brands and map dependency proof:
- Time: `2026-06-05 04:51 Asia/Shanghai`.
- Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`.
- Request: make the Brands control useful, create a premium-vehicle brand page, keep live-edit review access, and move as much map runtime as possible onto the site.
- Changed surface: `brands.html` added; desktop/mobile Brands nav now opens `./brands.html`; footer Premium Brands link now opens `./brands.html`.
- Brand catalog proof: rendered `http://127.0.0.1:52452/brands.html` showed 23 brand cards, 35 public vehicles, 21 stocked premium picks, and 2 `Sourcing request lane` cards.
- Brand filter proof: Germany filter rendered 4 cards.
- Quote handoff proof: clicking the first `Quote premium` button landed at `http://127.0.0.1:52452/#quote`; `#qMsg` contained `Premium brand request: BMW / 2025 BMW X3 2025 xDrive30L M Sport...`.
- Mobile proof: `390x844` rendered 23 cards, no horizontal overflow, and the owner edit link `./brands.html?arkedit=1`.
- In-app Browser proof: Browser snapshot on `http://127.0.0.1:52452/brands.html` showed the Premium Brands nav, brand filters, brand cards, owner live edit lane, and review widget.
- Map dependency proof: `worldmap.html?embed=1` loaded `window.L`, 60 Leaflet tiles, hidden embed chrome, and Leaflet script from `http://127.0.0.1:52452/lib/leaflet/leaflet.js`.
- Remaining external dependency proof: map tile URLs still use CARTO/OpenStreetMap and OpenSeaMap; `#mapDependencyNote` now labels this honestly on the customer shipping-map section.
- 3D globe proof: local `worldmap.html` click on `#view3dBtn` opened `#globe-wrap.show`, rendered 1 canvas, no fallback text, and no browser console errors.
- Syntax/static proof: `node --check scripts/newvision-static-check.js`, `node --check api/worldmap.js`, `node --check api/worldmap-watch.js`, `npm test`, and `npm run check:pcmaster` passed.

Premium brands GitHub Pages live proof:
- Time: `2026-06-05 04:56 Asia/Shanghai`.
- Commit pushed: `d4d285b feat(newvision): add premium brands catalog`.
- Public fetch proof: `https://arkysan.github.io/newvision-demo/brands.html` returned `200` and contained `Premium Brand Catalog`; `https://arkysan.github.io/newvision-demo/lib/leaflet/leaflet.js` returned `200`; `https://arkysan.github.io/newvision-demo/` returned `200` and contained `./brands.html`.
- Live home proof: desktop nav Brands href was `./brands.html`; `#mapDependencyNote` disclosed local map runtime and external CARTO/OpenStreetMap/OpenSeaMap tile dependency.
- Live brand proof: `https://arkysan.github.io/newvision-demo/brands.html` rendered 23 cards, 35 stock vehicles, 2 sourcing request lanes, and owner edit link `./brands.html?arkedit=1`.
- Live quote proof: clicking `Quote premium` landed at `https://arkysan.github.io/newvision-demo/#quote`; `#qMsg` contained `Premium brand request: BMW / 2025 BMW X3 2025 xDrive30L M Sport...`.
- Live map proof: `https://arkysan.github.io/newvision-demo/worldmap.html?embed=1` loaded Leaflet from `https://arkysan.github.io/newvision-demo/lib/leaflet/leaflet.js`, rendered 60 tiles, and hid embed chrome.
- Live 3D globe proof: `https://arkysan.github.io/newvision-demo/worldmap.html` click on `#view3dBtn` rendered 1 canvas, no fallback text, and no browser console errors.
- Live phone proof: `390x844` on `/brands.html` rendered 23 cards with `scrollWidth=390`, no horizontal overflow, and edit link `./brands.html?arkedit=1`.

Community/Supabase approval boundary proof:
- Time: `2026-06-05 05:04 Asia/Shanghai`.
- Source checked: `api/community.js`, `community.html`, `supabase-schema.sql`, `scripts/newvision-static-check.js`.
- Finding: Claude/community work used a public Supabase anon key in code and did not require reading a local service-role key for normal register/login/posts/comments/follow flows.
- Risk found: `supabase-schema.sql` previously allowed `posts` insert/update with `with check (true)` / `using (true)`, which could let public anon clients write directly if they bypassed the New Vision API.
- Fix: `api/community.js` now reads `SUPABASE_SERVICE_ROLE_KEY` only from deployment environment for admin post writes and returns `missing_supabase_service_role` with the message `Do not read local .env service-role keys` when it is absent.
- Fix: `supabase-schema.sql` now drops the old open `Service can insert/update posts` policies and replaces them with authenticated-admin policies; server-side service-role env can still perform admin writes without exposing the key to the browser.
- Approval decision: local `.env` service-role key reads are not approved. The approved path is CLI-managed deployment secret setup when the owner provides the token/key explicitly for that purpose.
- Verification: `node --check api/community.js`, `node --check scripts/newvision-static-check.js`, `npm test`, and `npm run check:pcmaster` passed.

China mirror drift proof:
- Time: `2026-06-05 05:04 Asia/Shanghai`.
- `https://cdn.jsdelivr.net/gh/arkysan/newvision@main/index.html`: `200`, New Vision present, but no `brands.html`/Premium Brand Catalog signal.
- `https://cdn.jsdelivr.net/gh/arkysan/newvision@main/brands.html`: missing/error.
- `https://seattle-desktop-rtx5090.tail810c5e.ts.net/`: `200`, New Vision present, but no `brands.html` signal.
- `https://seattle-desktop-rtx5090.tail810c5e.ts.net/brands.html`: missing/error.
- Deduction: GitHub Pages is current, but China mirror surfaces need ARKV2 `docs/newvision` sync/push before they carry the new premium brand page.
