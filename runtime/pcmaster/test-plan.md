# Test Plan

Required checks:
- `npm test`: verifies New Vision static assets, vehicle image coverage, copy guardrails, and local references.
- `npm run check:pcmaster`: verifies the PCMaster control contract exists in this repo.

Visual proof required when UI changes:
- Phone viewport: `390x844`
- Confirm the requested surface renders.
- Confirm no framework overlay or console errors.
- Confirm the changed interaction works.

Current visual proof target:
- Phone Review button stays visible above the app dock.
- Phone review/editor opens as a bottom sheet so the website remains visible while editing.
- Review quick actions remain usable in the phone bottom sheet.
- Contact Our Team scrolls to the quote form.
- Quote form remains between How It Works and Active Shipping Routes.
- Required quote fields produce WhatsApp links for New Vision Sales, Eissah, and Andy with the same completed buyer data.
- Review editor exposes Redo, Annotate, Move Up, Move Down, and Publish.
- Language buttons still translate visible quote text.
- Brands navigation opens a real premium-brand catalog page.
- Brand catalog quote buttons prefill the main quote form.
- World map uses local Leaflet runtime while honestly labeling external tile services.
