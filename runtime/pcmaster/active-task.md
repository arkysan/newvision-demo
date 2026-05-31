# Active Task

Task id: `NEWVISION-QUOTE-EDITOR-PUBLISH-20260601`

Objective:
- Keep the quote form between How It Works and Active Shipping Routes.
- Route visible WhatsApp/contact CTAs through the required quote form.
- Require buyer name, country, WhatsApp/phone, vehicle, destination port, and message before WhatsApp handoff.
- Prepare the same completed request for New Vision Sales, Eissah, and Andy.
- Let the review editor move highlighted/selected sections, annotate, redo, and publish through the live CMS review-patches path when deployed with an admin token.

Allowed files:
- `index.html`
- `arkreview.js`
- `api/cms.js`
- `scripts/newvision-static-check.js`
- `runtime/pcmaster/*`
- `C:\PCMaster-Control\inventory\projects.md`
- `C:\PCMaster-Control\tasks\active-task.md`
- `C:\PCMaster-Control\status\latest-status.md`

Blocked files/actions:
- Production deployment, Vercel alias changes, GitHub Pages deploy, or push without owner approval.
- Secrets, tokens, cookies, browser profiles, or raw private logs.
- Stale `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision` as a source of truth. It may only receive a deliberate mirror after source proof passes.

Test commands:
- `node -c api\cms.js; node -c arkreview.js; node -c scripts\newvision-static-check.js`
- `npm test`
- `npm run check:pcmaster`
- Rendered Playwright mobile quote/editor proof against `http://127.0.0.1:52452/`.

Rollback path:
- Revert only the latest changes in `index.html`, `arkreview.js`, `api/cms.js`, and `scripts/newvision-static-check.js`.
- Restore the previous mirrored copies under `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision` only if the mirror is the source of the fault.
- Do not reset unrelated dirty work.

Status:
- `PASS`: static checks, PCMaster contract check, syntax checks, rendered mobile quote proof, editor control proof, and language smoke proof passed locally.
- `PARTIAL`: public live publish was not executed because deployed-site admin token and Vercel Blob storage are owner/config gated.

Phone review sheet addendum:
- `PASS`: phone review button is visible on the 390px phone viewport.
- `PASS`: opening review now uses a bottom sheet instead of a full-screen cover, leaving the website visible above the editor.
- `PASS`: quick actions stay usable in a two-column phone grid and the bottom app dock hides only while the editor sheet is open.
