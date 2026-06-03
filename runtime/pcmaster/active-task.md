# Active Task

Task id: `NEWVISION-EXPORT-DEAL-DESK-20260603`

Objective:
- Keep GitHub Pages and Vercel as identical public buyer surfaces.
- Upgrade the public buyer journey into an Export Deal Desk: inventory card -> vehicle detail page -> export quote preview -> `NVQ` quote capture -> WhatsApp sales handoff -> tracking link.
- Preserve the green/white New Vision identity and public/private data separation.
- Surface quote-preview fields in sales and owner portals without letting sales users access owner-only panels.

Allowed files:
- `index.html`
- `vehicle.html`
- `track.html`
- `sales.html`
- `portal.html`
- `api/lead.js`
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
- If public deployment is performed, restore the previous commit on GitHub Pages and redeploy the prior Vercel production deployment.
- Do not use destructive git reset or checkout against unrelated dirty work.

Status:
- `PASS`: local syntax/static/PCMaster checks passed.
- `PASS`: local desktop/phone rendered proof passed for inventory cards, vehicle detail page, quote preview, query prefill, mocked `NVQ` capture, validation, API-unavailable fallback, bad stock state, and role boundary.
- `PASS`: `master` pushed to GitHub, Vercel production deployed, deploy-drift check passed, and live rendered proof passed on both public surfaces.
- `BLOCKED`: CMS live editor publish still requires `NEWVISION_ADMIN_TOKEN` and Vercel Blob storage.
