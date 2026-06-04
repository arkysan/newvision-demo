# Active Task

Task id: `NEWVISION-GITHUB-PAGES-WORLDMAP-GATE-20260605`

Objective:
- Repair the main public GitHub Pages gate at `https://arkysan.github.io/newvision-demo/`.
- Publish the current world-map/watchboard entry path into GitHub source so `worldmap.html` is no longer missing from GitHub Pages.
- Keep Vercel, Cloudflare Pages, mirror repo, jsDelivr, and `arksystem.ai` out of this pass until the owner explicitly asks for those deployments.
- Preserve the existing Export Deal Desk buyer journey: inventory card -> vehicle detail page -> export quote preview -> `NVQ` quote capture -> WhatsApp sales handoff -> tracking link.
- Preserve the green/white New Vision identity and public/private data separation.
- Surface quote-preview fields in sales and owner portals without letting sales users access owner-only panels.

Allowed files:
- `index.html`
- `vehicle.html`
- `track.html`
- `sales.html`
- `portal.html`
- `brands.html`
- `api/lead.js`
- `api/worldmap.js`
- `api/worldmap-watch.js`
- `worldmap.html`
- `lib/leaflet/*`
- `vercel.json`
- `scripts/newvision-deploy-drift-check.js`
- `scripts/newvision-static-check.js`
- `sitemap.xml`
- `runtime/pcmaster/*`

Blocked files/actions:
- Secrets, tokens, cookies, browser profiles, or raw private logs.
- Stale `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision` as a source of truth.
- CMS live editor publish remains blocked until Vercel has `NEWVISION_ADMIN_TOKEN` and Blob storage.

Test commands:
- `node -c api\lead.js; node -c api\portal.js; node -c scripts\newvision-static-check.js`
- `npm test`
- `npm run check:pcmaster`
- `npm run check:deploy-drift`
- Rendered Playwright proof against `http://127.0.0.1:52452/` at desktop and `390x844`.
- Rendered Playwright proof against `https://arkysan.github.io/newvision-demo/` and `https://newvision-demo.vercel.app/` at desktop and `390x844`.

Rollback path:
- Revert only the files listed in Allowed files for this task.
- If GitHub Pages deployment is performed, restore the previous commit on `master` with a targeted revert.
- Do not deploy or modify Vercel, Cloudflare Pages, mirror repo, jsDelivr, `newvision.pages.dev`, or `arksystem.ai` in this pass.
- Do not use destructive git reset or checkout against unrelated dirty work.

Status:
- `PASS LOCAL`: Customer main page now places `#global-shipping-map` directly below `#vehicleGrid`.
- `PASS LOCAL`: Customer/default world map hides the World Events panel and skips risk-zone overlays; back-room roles `sales`, `andy`, `eissa`, `owner`, `admin`, `master`, and `arky` keep world-event intelligence.
- `PASS LOCAL`: Owner/admin portal links open `worldmap.html?role=admin`; Andy/Eissa sales links open `worldmap.html?role=sales`.
- `PASS LOCAL`: 3D globe repaired locally with copied World Monitor `lib/globe.gl.min.js` and World Monitor texture assets.
- `PASS GITHUB PAGES`: Premium brand catalog and local Leaflet runtime are committed and pushed on `master`.
- `PASS`: GitHub Pages main gate is live and includes `worldmap.html`.
- `PASS`: local `npm test` and worldmap syntax checks passed after removing emoji-style UI markers from `index.html`.
- `PASS`: live fetch proof returned `200` for `/`, `/worldmap.html`, `/track.html`, and `/vehicle.html?id=NV-2026-0001` on GitHub Pages.
- `PASS`: rendered browser proof passed on desktop and `390x844` phone for the GitHub Pages home and world-map page.
- `LOCAL CLEANUP PENDING COMMIT`: `index.html` static-guard cleanup and PCMaster proof/status updates are local changes only until owner requests commit.
- `BLOCKED`: CMS live editor publish still requires `NEWVISION_ADMIN_TOKEN` and Vercel Blob storage.
