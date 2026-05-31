# New Vision Codex Workflow

Codex role: build, patch, test, and proof-check this repo.

Active repo:
- `C:\Users\ARKAI\Desktop\newvision-demo`

Primary user surface:
- Local preview: `http://127.0.0.1:52452/` when `scripts/serve-static.js 52452` is running.
- Primary public site: `https://arkysan.github.io/newvision-demo/`
- Vercel/API backup: `https://newvision-demo.vercel.app`

Before edits:
- Confirm branch with `git status --short --branch`.
- Confirm active task in `runtime/pcmaster/active-task.md`.
- Define allowed files and rollback path.
- Use `rg` before opening broad files.

After edits:
- Run `npm test`.
- Run `npm run check:pcmaster`.
- For visual changes, verify the rendered page in a phone viewport and save proof when practical.
- Update `runtime/pcmaster/proof.md` and `runtime/pcmaster/latest-status.md`.
- Save AgentShare memory.

Rollback:
- Use targeted reversal of the files touched for the active task.
- Do not use destructive git reset or checkout against unrelated dirty work.
