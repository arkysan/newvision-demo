// New Vision owner portal API (Andy + Eissa). Auth (owner creds + real Google), dashboard
// data (visitors, vehicle requests/leads, revenue-expense ledger, analyzer), all gated.
const fs = require('node:fs');
const path = require('node:path');
const store = require('../lib/store');

const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '1234';
// username -> display + role. 'master' (Arky) owns the full ERP; sales users get the deal desk only.
const OWNERS = { andy: { name: 'Andy', role: 'sales' }, eissa: { name: 'Eissa', role: 'sales' }, arky: { name: 'Arky', role: 'master' } };
const COOKIE = 'nv_portal';
const OWNER_ROLES = new Set(['master', 'owner']);
const SALES_ROLES = new Set(['master', 'owner', 'sales']);

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function setCookie(res, token, maxDays) {
  const parts = [COOKIE + '=' + encodeURIComponent(token), 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure',
    'Max-Age=' + (maxDays ? maxDays * 86400 : 0)];
  res.setHeader('Set-Cookie', parts.join('; '));
}
function readBody(req) {
  return new Promise((resolve) => { let d = ''; req.on('data', (c) => d += c); req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } }); });
}
function getAction(req) { try { return new URL(req.url, 'http://x').searchParams.get('action') || ''; } catch (_) { return ''; } }
function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = new Set([
    'https://arkysan.github.io',
    'https://newvision-demo.vercel.app',
    'https://newvision-ao6.pages.dev',
    'https://newvision.pages.dev',
    'https://newvision-ark.vercel.app',
    'http://localhost:52452',
    'http://127.0.0.1:52452',
  ]);
  res.setHeader('Access-Control-Allow-Origin', allowed.has(origin) ? origin : 'https://newvision-demo.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}
function bearerUser(req) {
  const h = String(req.headers.authorization || '');
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? store.verify(m[1]) : null;
}
function sessionUser(req) { return bearerUser(req) || store.verify(store.getCookie(req, COOKIE)); }
function isOwnerRole(u) { return OWNER_ROLES.has(u && u.role); }
function isSalesRole(u) { return SALES_ROLES.has(u && u.role); }
function stockIdForVehicle(v) {
  if (v && v.stockId) return String(v.stockId).toUpperCase();
  const n = String(v?.id || 0).replace(/\D/g, '').padStart(4, '0').slice(-4);
  return `NV-2026-${n}`;
}
function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max || 120);
}
function cleanMoney(value) {
  return Math.max(0, Math.min(100000000, Math.round(Number(value) || 0)));
}
function cleanRate(value) {
  return Math.max(0, Math.min(50, Number(value) || 0));
}
function maskedBankAccount(value) {
  const raw = String(value || '').replace(/[^\dA-Za-z]/g, '');
  if (!raw) return '';
  const tail = raw.slice(-4);
  return `${'*'.repeat(Math.min(8, Math.max(4, raw.length - 4)))}${tail}`;
}
function defaultSalesOps() {
  return {
    staff: [
      { id: 'andy', name: 'Andy', status: 'active', role: 'Sales', commissionRate: 3, payoutBank: '', bankAccount: '', payoutNotes: '' },
      { id: 'eissa', name: 'Eissa', status: 'active', role: 'Sales', commissionRate: 3, payoutBank: '', bankAccount: '', payoutNotes: '' },
    ],
    vehicleOverrides: {},
    sales: [],
  };
}
async function readSalesOps() {
  const ops = await store.readData('salesOps', defaultSalesOps());
  ops.staff = Array.isArray(ops.staff) && ops.staff.length ? ops.staff : defaultSalesOps().staff;
  ops.vehicleOverrides = ops.vehicleOverrides && typeof ops.vehicleOverrides === 'object' ? ops.vehicleOverrides : {};
  ops.sales = Array.isArray(ops.sales) ? ops.sales : [];
  return ops;
}
function publicSalesOps(ops) {
  return {
    staff: ops.staff.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status || 'active',
      role: s.role || 'Sales',
      whatsapp: s.whatsapp || '',
      commissionRate: Number(s.commissionRate) || 0,
      payoutBank: s.payoutBank || '',
      maskedBankAccount: s.maskedBankAccount || maskedBankAccount(s.bankAccount),
      payoutNotes: s.payoutNotes ? 'Saved encrypted' : '',
      archivedAt: s.archivedAt || '',
    })),
    vehicleOverrides: ops.vehicleOverrides,
    sales: ops.sales.slice(0, 1000),
  };
}
function normalizeSalesperson(input, existing) {
  const name = cleanText(input.name, 80);
  const id = cleanText(input.id || name, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `sales-${Date.now().toString(36)}`;
  const bankAccount = cleanText(input.bankAccount, 120) || existing?.bankAccount || '';
  return {
    id,
    name: name || existing?.name || 'Salesperson',
    status: input.status === 'archived' ? 'archived' : 'active',
    role: cleanText(input.role, 40) || existing?.role || 'Sales',
    whatsapp: cleanText(input.whatsapp, 40) || existing?.whatsapp || '',
    commissionRate: cleanRate(input.commissionRate ?? existing?.commissionRate ?? 3),
    payoutBank: cleanText(input.payoutBank, 80) || existing?.payoutBank || '',
    bankAccount,
    maskedBankAccount: maskedBankAccount(bankAccount),
    payoutNotes: cleanText(input.payoutNotes, 160) || existing?.payoutNotes || '',
    updatedAt: new Date().toISOString(),
  };
}
function normalizeVehicleRecord(input, existing) {
  const stockId = cleanText(input.stockId || input.id || existing?.stockId, 40).toUpperCase() || `NV-SALES-${Date.now().toString(36).toUpperCase()}`;
  return Object.assign({}, existing || {}, {
    id: Number.parseInt(input.id || existing?.id || Date.now(), 10) || Date.now(),
    stockId,
    year: Number.parseInt(input.year || existing?.year || new Date().getFullYear(), 10) || new Date().getFullYear(),
    make: cleanText(input.make || existing?.make, 80) || 'New Vision',
    model: cleanText(input.model || existing?.model, 160) || 'Vehicle',
    price: cleanMoney(input.price ?? existing?.price),
    condition: cleanText(input.condition || existing?.condition, 40) || 'New',
    fuel: cleanText(input.fuel || existing?.fuel, 40) || 'Confirm',
    body: cleanText(input.body || existing?.body, 40) || 'SUV',
    drive: cleanText(input.drive || existing?.drive, 40),
    location: cleanText(input.location || existing?.location, 100),
    docsStatus: cleanText(input.docsStatus || existing?.docsStatus, 120) || 'Docs check available',
    inspectionStatus: cleanText(input.inspectionStatus || existing?.inspectionStatus, 120) || 'Photo/video available',
    vinPrivate: cleanText(input.vinPrivate || existing?.vinPrivate, 80),
    shipmentId: cleanText(input.shipmentId || existing?.shipmentId, 40),
    img: cleanText(input.img || existing?.img, 1000),
    imgs: Array.isArray(input.imgs) ? input.imgs.map((x) => cleanText(x, 1000)).filter(Boolean).slice(0, 8) : (existing?.imgs || []),
    status: cleanText(input.status || existing?.status || 'Available', 40),
    source: existing?.source || 'sales-ops',
    updatedAt: new Date().toISOString(),
  });
}
function readStaticVehicles() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'vehicles.json'), 'utf8')); }
  catch (_) { return []; }
}

async function trackVisit() {
  const v = await store.readData('visits', { total: 0, daily: {} });
  const day = new Date().toISOString().slice(0, 10);
  v.total = (v.total || 0) + 1;
  v.daily = v.daily || {}; v.daily[day] = (v.daily[day] || 0) + 1;
  await store.writeData('visits', v);
  return v;
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end(); }
  const action = getAction(req);

  try {
    // ── public config (Google client id is public-safe) ──
    if (action === 'config') { return send(res, 200, { ok: true, googleClientId: process.env.GOOGLE_CLIENT_ID || '' }); }

    // ── public shipment tracking (by tracking code; no customer PII) ──
    if (action === 'shiptrack') {
      const code = String((new URL(req.url, 'http://x')).searchParams.get('code') || '').trim().toUpperCase();
      if (!code) return send(res, 400, { ok: false, error: 'tracking code required' });
      const s = (await store.readData('shipments', [])).find((x) => (x.code || '').toUpperCase() === code);
      if (!s) {
        const q = (await store.readData('leads', [])).find((x) => (x.id || '').toUpperCase() === code);
        if (q) return send(res, 200, { ok: true, shipment: {
          kind: 'quote',
          code: q.id,
          vehicle: q.vehicle || 'Quote request',
          vessel: '',
          imo: '',
          mmsi: '',
          origin: 'New Vision quote desk',
          dest: q.port || 'Destination port under review',
          etd: '',
          eta: '',
          status: 'Quote request received',
          note: 'This quote ID confirms New Vision received the request. Shipment tracking appears after booking.',
        } });
        const v = readStaticVehicles().find((x) => stockIdForVehicle(x) === code || String(x.id || '').toUpperCase() === code);
        if (!v) return send(res, 404, { ok: false, error: 'Tracking code not found' });
        return send(res, 200, { ok: true, shipment: {
          kind: 'vehicle',
          code: stockIdForVehicle(v),
          vehicle: `${v.year} ${v.make} ${v.model}`,
          vessel: '',
          imo: '',
          mmsi: '',
          origin: 'China export lane',
          dest: 'Confirm destination port',
          etd: '',
          eta: '',
          status: v.status || 'Vehicle selected',
          note: 'This is a public stock ID. A shipment tracking ID appears after booking and vessel assignment.',
        } });
      }
      return send(res, 200, { ok: true, shipment: { code: s.code, vehicle: s.vehicle, vessel: s.vessel, imo: s.imo, mmsi: s.mmsi, origin: s.origin, dest: s.dest, etd: s.etd, eta: s.eta, status: s.status } });
    }

    // ── visitor tracking (public, no auth) ──
    if (action === 'track') { const v = await trackVisit(); return send(res, 200, { ok: true, total: v.total }); }

    // ── heatmap ingest (public): batched interaction events from the site ──
    if (action === 'heat' && req.method === 'POST') {
      const b = await readBody(req);
      const isQuote = !!b.quote;
      const page = String(b.page || '/').slice(0, 40);
      const device = String(b.device || 'unknown').slice(0, 30);
      const clicks = Array.isArray(b.clicks) ? b.clicks.slice(0, 40) : [];
      const heat = await store.readData('heat', { clicks: [], scroll: {}, pages: {}, devices: {}, sessions: 0 });
      clicks.forEach((c) => {
        heat.clicks.push({ x: Math.max(0, Math.min(100, Math.round(+c.x || 0))), y: Math.max(0, Math.min(100, Math.round(+c.y || 0))), el: String(c.el || '').slice(0, 60), q: isQuote ? 1 : 0, p: page });
      });
      if (heat.clicks.length > 6000) heat.clicks = heat.clicks.slice(-6000);
      const sd = Math.max(0, Math.min(100, Math.round(+b.scrollMax || 0)));
      const bucket = sd >= 90 ? '90-100' : sd >= 75 ? '75-90' : sd >= 50 ? '50-75' : sd >= 25 ? '25-50' : '0-25';
      heat.scroll[bucket] = (heat.scroll[bucket] || 0) + 1;
      if (b.newSession) heat.sessions = (heat.sessions || 0) + 1;
      heat.pages[page] = (heat.pages[page] || 0) + 1;
      heat.devices = heat.devices || {};
      heat.devices[device] = (heat.devices[device] || 0) + 1;
      await store.writeData('heat', heat);
      // detailed movement only for quote-requesters (encrypted, PII-linked)
      if (isQuote && clicks.length) {
        const j = await store.readData('journeys', []);
        j.unshift({ sid: String(b.sid || '').slice(0, 40), at: new Date().toISOString(), page, scrollMax: sd,
          clicks: clicks.map((c) => ({ x: Math.round(+c.x || 0), y: Math.round(+c.y || 0), el: String(c.el || '').slice(0, 40) })) });
        await store.writeData('journeys', j.slice(0, 400));
      }
      return send(res, 200, { ok: true });
    }

    // ── owner login ──
    if (action === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      const user = String(b.user || '').trim().toLowerCase();
      const pass = String(b.password || '');
      if (OWNERS[user] && pass === OWNER_PASSWORD) {
        const o = OWNERS[user];
        const u2 = { u: user, name: o.name, role: o.role };
        const token = store.sign(u2, 7);
        setCookie(res, token, 7);
        return send(res, 200, { ok: true, user: u2, sessionToken: token });
      }
      return send(res, 401, { ok: false, error: 'Wrong name or password' });
    }

    // ── real Google sign-in (verifies the Google ID token; needs GOOGLE_CLIENT_ID) ──
    if (action === 'google' && req.method === 'POST') {
      const cid = process.env.GOOGLE_CLIENT_ID;
      if (!cid) return send(res, 400, { ok: false, error: 'Google sign-in not configured yet (set GOOGLE_CLIENT_ID).' });
      const b = await readBody(req);
      const cred = String(b.credential || '');
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred));
      const info = await r.json().catch(() => ({}));
      if (!r.ok || info.aud !== cid || !info.email) return send(res, 401, { ok: false, error: 'Google verification failed' });
      const token = store.sign({ u: info.email, name: info.name || info.email, role: 'member', pic: info.picture || '' }, 7);
      setCookie(res, token, 7);
      return send(res, 200, { ok: true, user: { u: info.email, name: info.name || info.email, role: 'member' }, sessionToken: token });
    }

    if (action === 'logout') { setCookie(res, '', 0); return send(res, 200, { ok: true }); }

    if (action === 'me') {
      const u = sessionUser(req);
      return u ? send(res, 200, { ok: true, user: u }) : send(res, 401, { ok: false });
    }

    // ── everything below requires a session ──
    const u = sessionUser(req);
    if (!u) return send(res, 401, { ok: false, error: 'Not signed in' });

    // master-only: hand the live-edit admin token to the master portal session
    if (action === 'master-token') {
      if (u.role !== 'master') return send(res, 403, { ok: false, error: 'Master only' });
      return send(res, 200, { ok: true, token: process.env.NEWVISION_ADMIN_TOKEN || '' });
    }

    if (action === 'sales-dashboard') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const leads = await store.readData('leads', []);
      return send(res, 200, { ok: true, user: u, leads: leads.slice(0, 200), leadCount: leads.length });
    }

    if (action === 'sales-ops') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const ops = await readSalesOps();
      return send(res, 200, { ok: true, salesOps: publicSalesOps(ops) });
    }

    if (action === 'salesperson-save' && req.method === 'POST') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const b = await readBody(req);
      const ops = await readSalesOps();
      const id = cleanText(b.id || b.name, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const idx = ops.staff.findIndex((s) => s.id === id || s.id === b.id);
      const staff = normalizeSalesperson(b, idx >= 0 ? ops.staff[idx] : null);
      if (idx >= 0) ops.staff[idx] = Object.assign({}, ops.staff[idx], staff, { archivedAt: '' });
      else ops.staff.unshift(Object.assign(staff, { createdAt: new Date().toISOString(), createdBy: u.name }));
      await store.writeData('salesOps', ops);
      return send(res, 200, { ok: true, salesperson: publicSalesOps(ops).staff.find((s) => s.id === staff.id) });
    }

    if (action === 'salesperson-archive' && req.method === 'POST') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const b = await readBody(req);
      const ops = await readSalesOps();
      const id = cleanText(b.id, 80);
      const idx = ops.staff.findIndex((s) => s.id === id);
      if (idx < 0) return send(res, 404, { ok: false, error: 'Salesperson not found' });
      ops.staff[idx] = Object.assign({}, ops.staff[idx], { status: 'archived', archivedAt: new Date().toISOString(), archivedBy: u.name });
      await store.writeData('salesOps', ops);
      return send(res, 200, { ok: true });
    }

    if (action === 'vehicle-save' && req.method === 'POST') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const b = await readBody(req);
      const ops = await readSalesOps();
      const incoming = b.vehicle || b;
      const stockId = cleanText(incoming.stockId || incoming.id, 40).toUpperCase();
      const existing = stockId ? ops.vehicleOverrides[stockId] : null;
      const vehicle = Object.assign(normalizeVehicleRecord(incoming, existing), { updatedBy: u.name });
      ops.vehicleOverrides[stockIdForVehicle(vehicle)] = vehicle;
      await store.writeData('salesOps', ops);
      return send(res, 200, { ok: true, vehicle });
    }

    if (action === 'vehicle-archive' && req.method === 'POST') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const b = await readBody(req);
      const ops = await readSalesOps();
      const stockId = cleanText(b.stockId, 40).toUpperCase();
      const existing = ops.vehicleOverrides[stockId] || { stockId };
      ops.vehicleOverrides[stockId] = Object.assign({}, existing, { status: 'Archived', archivedAt: new Date().toISOString(), archivedBy: u.name });
      await store.writeData('salesOps', ops);
      return send(res, 200, { ok: true });
    }

    if (action === 'vehicle-sold' && req.method === 'POST') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      const b = await readBody(req);
      const ops = await readSalesOps();
      const stockId = cleanText(b.stockId, 40).toUpperCase();
      const staff = ops.staff.find((s) => s.id === b.salespersonId) || ops.staff.find((s) => s.status !== 'archived') || { id: 'unknown', name: cleanText(b.salespersonName, 80) || u.name, commissionRate: 0 };
      const salePrice = cleanMoney(b.salePrice);
      const rate = cleanRate(b.commissionRate ?? staff.commissionRate);
      const vehicle = Object.assign({}, ops.vehicleOverrides[stockId] || { stockId }, b.vehicle || {});
      const sale = {
        id: `sale-${Date.now().toString(36)}`,
        stockId,
        vehicleName: cleanText(b.vehicleName || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`, 160),
        buyer: cleanText(b.buyer, 100),
        salespersonId: staff.id,
        salespersonName: staff.name,
        salePrice,
        commissionRate: rate,
        commissionAmount: Math.round(salePrice * rate) / 100,
        soldAt: new Date().toISOString(),
        soldBy: u.name,
      };
      ops.vehicleOverrides[stockId] = Object.assign({}, vehicle, { stockId, status: 'Sold', soldAt: sale.soldAt, soldBy: u.name, salespersonId: staff.id, salespersonName: staff.name, salePrice, commissionAmount: sale.commissionAmount });
      ops.sales.unshift(sale);
      await store.writeData('salesOps', ops);
      return send(res, 200, { ok: true, sale, vehicle: ops.vehicleOverrides[stockId] });
    }

    if (action === 'dashboard') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const [visits, leads, ledger] = await Promise.all([
        store.readData('visits', { total: 0, daily: {} }),
        store.readData('leads', []),
        store.readData('ledger', []),
      ]);
      const day = new Date().toISOString().slice(0, 10);
      const last7 = [];
      for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); last7.push({ d, n: (visits.daily || {})[d] || 0 }); }
      const income = ledger.filter((e) => e.type === 'income').reduce((s, e) => s + (+e.amount || 0), 0);
      const expense = ledger.filter((e) => e.type === 'expense').reduce((s, e) => s + (+e.amount || 0), 0);
      const bySource = {}; const byVehicle = {};
      leads.forEach((l) => { const s = l.source || 'Other'; bySource[s] = (bySource[s] || 0) + 1; if (l.vehicle) byVehicle[l.vehicle] = (byVehicle[l.vehicle] || 0) + 1; });
      const topVehicles = Object.entries(byVehicle).sort((a, b) => b[1] - a[1]).slice(0, 6);
      return send(res, 200, {
        ok: true, user: u,
        visits: { total: visits.total || 0, today: (visits.daily || {})[day] || 0, last7 },
        leads: leads.slice(0, 200),
        leadCount: leads.length,
        bySource, topVehicles,
        ledger: ledger.slice(0, 500),
        finance: { income, expense, profit: income - expense },
      });
    }

    if (action === 'heatmap') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const [heat, journeys] = await Promise.all([
        store.readData('heat', { clicks: [], scroll: {}, pages: {}, devices: {}, sessions: 0 }),
        store.readData('journeys', []),
      ]);
      const elCount = {};
      heat.clicks.forEach((c) => { if (c.el) elCount[c.el] = (elCount[c.el] || 0) + 1; });
      const topEls = Object.entries(elCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
      const quoteSids = new Set(journeys.map((j) => j.sid));
      return send(res, 200, { ok: true, clicks: heat.clicks.slice(-3000), scroll: heat.scroll || {}, pages: heat.pages || {}, devices: heat.devices || {}, sessions: heat.sessions || 0, quoteSessions: quoteSids.size, topEls, journeys: journeys.slice(0, 40) });
    }

    if (action === 'shipments') {
      if (!isSalesRole(u)) return send(res, 403, { ok: false, error: 'Sales role required' });
      return send(res, 200, { ok: true, shipments: await store.readData('shipments', []) });
    }

    if (action === 'shipment' && req.method === 'POST') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const b = await readBody(req);
      const list = await store.readData('shipments', []);
      const code = (String(b.code || '').trim().toUpperCase()) || ('NVS-' + Date.now().toString(36).toUpperCase());
      const s = (k) => String(b[k] || '').slice(0, 80);
      const entry = { code, vehicle: s('vehicle'), customer: s('customer'), contact: s('contact'), vessel: s('vessel'),
        imo: String(b.imo || '').slice(0, 20), mmsi: String(b.mmsi || '').slice(0, 20), origin: s('origin'), dest: s('dest'),
        etd: String(b.etd || '').slice(0, 20), eta: String(b.eta || '').slice(0, 20), status: String(b.status || 'In transit').slice(0, 30), by: u.name, at: new Date().toISOString() };
      const i = list.findIndex((x) => (x.code || '').toUpperCase() === code);
      if (i >= 0) list[i] = Object.assign(list[i], entry); else list.unshift(entry);
      await store.writeData('shipments', list.slice(0, 2000));
      return send(res, 200, { ok: true, shipment: entry });
    }

    if (action === 'shipment-delete' && req.method === 'POST') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const b = await readBody(req);
      const list = (await store.readData('shipments', [])).filter((x) => (x.code || '').toUpperCase() !== String(b.code || '').toUpperCase());
      await store.writeData('shipments', list);
      return send(res, 200, { ok: true });
    }

    if (action === 'ledger' && req.method === 'POST') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const b = await readBody(req);
      const type = b.type === 'expense' ? 'expense' : 'income';
      const amount = Math.max(0, Math.min(1e12, +b.amount || 0));
      const entry = { id: 'l' + Date.now(), type, amount, label: String(b.label || '').slice(0, 120), date: String(b.date || new Date().toISOString().slice(0, 10)), by: u.name, at: new Date().toISOString() };
      const ledger = await store.readData('ledger', []);
      ledger.unshift(entry); await store.writeData('ledger', ledger.slice(0, 5000));
      return send(res, 200, { ok: true, entry });
    }

    if (action === 'ledger-delete' && req.method === 'POST') {
      if (!isOwnerRole(u)) return send(res, 403, { ok: false, error: 'Owner role required' });
      const b = await readBody(req);
      const ledger = (await store.readData('ledger', [])).filter((e) => e.id !== b.id);
      await store.writeData('ledger', ledger);
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { ok: false, error: 'Unknown action' });
  } catch (e) {
    return send(res, 500, { ok: false, error: e.message });
  }
};
