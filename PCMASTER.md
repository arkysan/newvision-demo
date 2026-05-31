# New Vision PCMaster Source Of Truth

Project: New Vision vehicle website

Source of truth:
- `C:\Users\ARKAI\Desktop\newvision-demo`

Stale/reference folders:
- `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision` is read-only evidence unless the owner explicitly promotes it.

Repository:
- GitHub: `https://github.com/arkysan/newvision-demo`
- Current local branch at contract creation: `master`

Live surfaces:
- Local preview: `http://127.0.0.1:52452/`
- Vercel: `https://newvision-demo.vercel.app`
- GitHub Pages: `https://arkysan.github.io/newvision-demo/`

Master law:
- No source of truth = no coding.
- No test = no success.
- No proof = not done.

Required files:
- `AGENTS.md`
- `CLAUDE.md`
- `CODEX.md`
- `PCMASTER.md`
- `runtime/pcmaster/source-of-truth.md`
- `runtime/pcmaster/active-task.md`
- `runtime/pcmaster/test-plan.md`
- `runtime/pcmaster/proof.md`
- `runtime/pcmaster/latest-status.md`
- `runtime/pcmaster/blockers.md`

Default tests:
- `npm test`
- `npm run check:pcmaster`

Deploy rule:
- Do not deploy to Vercel, GitHub Pages, or any production alias without owner approval.

Current status:
- `PARTIAL`: the repo now has a PCMaster control contract.
- `PASS`: local static test, syntax checks, PCMaster contract test, rendered quote proof, editor control proof, FR/ZH language smoke, GitHub Pages deploy, and Vercel production deploy are current proof gates.
- `BLOCKED`: public editor publish remains Vercel-env gated because `NEWVISION_ADMIN_TOKEN` and `BLOB_READ_WRITE_TOKEN` are not configured.
