# New Vision — Requirements (from "to learn.mp4" + plan.jpeg)

> Source: `to learn.mp4` (2:00, transcribed locally via whisper.cpp 2026-06-02) + `plan.jpeg`
> ⚠️ The video audio is a rough verbal walkthrough — interpretations below are my best
> read and **need owner confirmation** before building. Do NOT treat as final spec.

## A. Quick tweaks heard in the video (current demo site)
1. **Photo change** — a hero/innovation-section photo needs replacing.
2. **Multi-language** — content must be translatable to other languages (see plan: Arabic, English, French) and switch back.
3. **Pricing** — show only the *official / office price*; simplify the price display (remove extra price fields).
4. **Contact = WhatsApp** — change a contact field/button to WhatsApp.
5. **Second-hand / used cars** — add a used-car section: brand, models, price.
6. **Remove location** — a location field/section is not needed; remove it.
7. **Brands in the middle section** — insert brand groupings: Chinese brands, German brands,
   Japanese (Toyota, Honda), Korean. Mixed "US + China made" framing.
8. **Customized color** — add a customized-color option for vehicles.
9. **Target market** — Africa mentioned as an audience.

## B. Formal roadmap (plan.jpeg — 新世界汽车平台 3-phase budget)
**Phase 1 (PC display + business modules + backend basics) — the launchable MVP:**
- Platform display: car sources, services, articles, social, about
- User ops: favorites, site-wide search, car filtering, parameter view
- Language switch: Arabic / English / French
- Member registration: basic / VIP / agent
- Member center: profile, favorites, inquiry records, notifications
- Purchase demand posting · Online inquiry (contact + form)
- Google Maps (car & receiver location) · Vehicle inspection display
- Company intro (legality) · Social-media links
- Backend: manage inquiries, statuses, vehicle data, news
- Config: columns, contact info, ad slots · Article publishing (FAQ, buy process, help)

**Phase 2 (mobile + transactions):** member levels, order records, intl shipping calculator,
H5/APP mobile, agent (B2B) mgmt, customer follow-up/transport/contracts.

**Phase 3 (B2B2C full platform):** CRM + sales/finance, agent mgmt, full-process purchase
(search→consult→negotiate→pay→ship→deliver), third-party online payment.

## C. Real company facts (from location screenshot)
- 义乌新视界汽车出口有限公司 / New Vision (Yiwu) Auto Export Co., Ltd
- Address: 浙江省金华市义乌市稠州北路518号一楼大厅 (518 Chouzhou North Rd, 1F lobby, Yiwu, Zhejiang)
- Real logo: `logo.jpeg` (green NEW VISION 新视界 + arc + orange star)

## D. ⚠️ Architecture issue to resolve FIRST
There are TWO diverged New Vision codebases:
- `C:\Users\ARKAI\Desktop\newvision-demo` → GitHub Pages (arkysan.github.io/newvision-demo) — **CANONICAL** (owner-confirmed), static-only, actively built by Codex (admin.js, api/, arkreview, PWA).
- `ARKV2\docs\newvision` → Vercel (newvision-orpin.vercel.app) — where lead-capture /api/lead was added. Vercel runs serverless; GitHub Pages does NOT.
**Decision needed:** pick ONE home. Lead-capture needs serverless (Vercel) or an external form endpoint (for GitHub Pages).
