// New Vision owner portal API (Andy + Eissa). Auth (owner creds + real Google), dashboard
// data (visitors, vehicle requests/leads, revenue-expense ledger, analyzer), all gated.
const store = require('../lib/store');

const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '1234';
const OWNERS = { andy: 'Andy', eissa: 'Eissa' };          // username -> display name
const COOKIE = 'nv_portal';

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
function sessionUser(req) { return store.verify(store.getCookie(req, COOKIE)); }

async function trackVisit() {
  const v = await store.readData('visits', { total: 0, daily: {} });
  const day = new Date().toISOString().slice(0, 10);
  v.total = (v.total || 0) + 1;
  v.daily = v.daily || {}; v.daily[day] = (v.daily[day] || 0) + 1;
  await store.writeData('visits', v);
  return v;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 200; return res.end(); }
  const action = getAction(req);

  try {
    // ── public config (Google client id is public-safe) ──
    if (action === 'config') { return send(res, 200, { ok: true, googleClientId: process.env.GOOGLE_CLIENT_ID || '' }); }

    // ── visitor tracking (public, no auth) ──
    if (action === 'track') { const v = await trackVisit(); return send(res, 200, { ok: true, total: v.total }); }

    // ── owner login ──
    if (action === 'login' && req.method === 'POST') {
      const b = await readBody(req);
      const user = String(b.user || '').trim().toLowerCase();
      const pass = String(b.password || '');
      if (OWNERS[user] && pass === OWNER_PASSWORD) {
        const token = store.sign({ u: user, name: OWNERS[user], role: 'owner' }, 7);
        setCookie(res, token, 7);
        return send(res, 200, { ok: true, user: { u: user, name: OWNERS[user], role: 'owner' } });
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
      return send(res, 200, { ok: true, user: { u: info.email, name: info.name || info.email, role: 'member' } });
    }

    if (action === 'logout') { setCookie(res, '', 0); return send(res, 200, { ok: true }); }

    if (action === 'me') {
      const u = sessionUser(req);
      return u ? send(res, 200, { ok: true, user: u }) : send(res, 401, { ok: false });
    }

    // ── everything below requires a session ──
    const u = sessionUser(req);
    if (!u) return send(res, 401, { ok: false, error: 'Not signed in' });

    if (action === 'dashboard') {
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

    if (action === 'ledger' && req.method === 'POST') {
      const b = await readBody(req);
      const type = b.type === 'expense' ? 'expense' : 'income';
      const amount = Math.max(0, Math.min(1e12, +b.amount || 0));
      const entry = { id: 'l' + Date.now(), type, amount, label: String(b.label || '').slice(0, 120), date: String(b.date || new Date().toISOString().slice(0, 10)), by: u.name, at: new Date().toISOString() };
      const ledger = await store.readData('ledger', []);
      ledger.unshift(entry); await store.writeData('ledger', ledger.slice(0, 5000));
      return send(res, 200, { ok: true, entry });
    }

    if (action === 'ledger-delete' && req.method === 'POST') {
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
