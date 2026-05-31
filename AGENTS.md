# New Vision Codex Agent Rules

Source of truth: `C:\Users\ARKAI\Desktop\newvision-demo`

Read before editing:
- `PCMASTER.md`
- `CODEX.md`
- `CLAUDE.md`
- `runtime/pcmaster/active-task.md`

Golden rule:
- No source of truth = no coding.
- No test = no success.
- No proof = not done.

Scope:
- This repo owns the New Vision vehicle website, mobile UI, local preview, image assets, Vercel/GitHub Pages build files, and local static checks.
- Do not edit stale copies under `C:\Users\ARKAI\Desktop\ARKV2\docs\newvision` unless the owner explicitly promotes that folder.
- Do not deploy without owner approval.

Required operating loop:
1. Observe current repo state.
2. Record evidence: folder, branch, allowed files, test command, rollback path.
3. Make the smallest safe fix.
4. Verify with `npm test` and any relevant browser proof.
5. Update `runtime/pcmaster/proof.md` and `runtime/pcmaster/latest-status.md`.

Default checks:
- `npm test`
- `npm run check:pcmaster`

