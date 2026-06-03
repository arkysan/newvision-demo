# Blockers

Current blockers:
- Live GitHub/Vercel sync proof is pending until the same Export Deal Desk source is published to both public surfaces.
- CMS live editor publish is not enabled because Vercel reports `adminConfigured:false` and `storageConfigured:false`.
- `PUT /api/cms?action=review-patches` without a configured admin token correctly returns `503 missing_admin_token`.

Not blockers:
- Local preview at `http://127.0.0.1:52452/` was available during desktop and phone Export Deal Desk proof.
- Static New Vision checks passed after the Export Deal Desk changes.
- PCMaster contract check passed after the Export Deal Desk changes.
- Desktop proof rendered inventory cards, full-deal links, quote preview, and vehicle detail page.
- Phone proof at `390x844` rendered the vehicle detail page without horizontal overflow.
- Buyer quote proof captured the extended lead payload through a mocked `/api/lead` response and returned an `NVQ` handoff.
- Failure probes passed for bad stock ID, missing required quote fields, and Vercel vehicle API fallback.
- Role proof passed: sales user receives sales deal desk only; owner/master receives owner oversight; sales cannot access owner dashboard actions.
