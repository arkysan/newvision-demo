# Blockers

Current blockers:
- CMS live editor publish is not enabled because Vercel reports `adminConfigured:false` and `storageConfigured:false`.
- `PUT /api/cms?action=review-patches` without a configured admin token correctly returns `503 missing_admin_token`.

Not blockers:
- Live GitHub/Vercel sync proof passed after pushing `master` and deploying Vercel production from the same Export Deal Desk source.
- `npm run check:deploy-drift` passed with both public home pages returning `mapped` and normalized hash `c8e1c3fc1b074c11`.
- Live Playwright proof passed on both public URLs for desktop inventory/deal links, `vehicle.html?id=NV-2026-0001`, phone `390x844` no-overflow detail page, and mocked `NVQ-LIVE-MOCK` quote dispatch/tracking link.
- Local preview at `http://127.0.0.1:52452/` was available during desktop and phone Export Deal Desk proof.
- Static New Vision checks passed after the Export Deal Desk changes.
- PCMaster contract check passed after the Export Deal Desk changes.
- Desktop proof rendered inventory cards, full-deal links, quote preview, and vehicle detail page.
- Phone proof at `390x844` rendered the vehicle detail page without horizontal overflow.
- Buyer quote proof captured the extended lead payload through a mocked `/api/lead` response and returned an `NVQ` handoff.
- Failure probes passed for bad stock ID, missing required quote fields, and Vercel vehicle API fallback.
- Role proof passed: sales user receives sales deal desk only; owner/master receives owner oversight; sales cannot access owner dashboard actions.
