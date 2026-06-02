// Shared store for the New Vision portal: AES-256-GCM encrypted JSON blobs + session/crypto.
// Leads + ledger are business PII, so they're encrypted at rest even in the public Blob store
// (the blob URL is never exposed to clients; encryption protects against URL leakage).
const crypto = require('node:crypto');
const { put, list } = require('@vercel/blob');

const SECRET = process.env.PORTAL_SECRET || process.env.NEWVISION_ADMIN_TOKEN || 'nv-portal-dev-secret';
const KEY = crypto.scryptSync(SECRET, 'nv-portal-salt-v1', 32);

const PATHS = {
  leads:    'cms/nv-leads.enc',
  ledger:   'cms/nv-ledger.enc',
  visits:   'cms/nv-visits.json',
  heat:     'cms/nv-heat.json',        // aggregate interaction heatmap (all visitors)
  journeys: 'cms/nv-journeys.enc',     // detailed movement for quote-requesters (PII-linked)
  shipments:'cms/nv-shipments.enc',    // per-vehicle shipments (vessel + ETA) for live tracking
};

function enc(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}
function dec(b64) {
  try {
    const raw = Buffer.from(b64, 'base64');
    const iv = raw.subarray(0, 12), tag = raw.subarray(12, 28), ct = raw.subarray(28);
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString('utf8'));
  } catch (_) { return null; }
}

async function readBlob(path) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const r = await list({ prefix: path, limit: 1 });
    const m = (r.blobs || []).find((b) => b.pathname === path);
    if (!m) return null;
    const res = await fetch(`${m.url}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch (_) { return null; }
}
async function writeBlob(path, text, contentType) {
  return put(path, text, { access: 'public', allowOverwrite: true, contentType: contentType || 'text/plain', cacheControlMaxAge: 30 });
}

const PLAIN = { visits: 1, heat: 1 };   // stored as plain JSON; others are AES-encrypted
async function readData(kind, fallback) {
  const txt = await readBlob(PATHS[kind]);
  if (txt == null) return fallback;
  if (PLAIN[kind]) { try { return JSON.parse(txt); } catch (_) { return fallback; } }
  const v = dec(txt); return v == null ? fallback : v;
}
async function writeData(kind, obj) {
  if (PLAIN[kind]) return writeBlob(PATHS[kind], JSON.stringify(obj), 'application/json');
  return writeBlob(PATHS[kind], enc(obj), 'text/plain');
}

async function appendLead(lead) {
  const arr = await readData('leads', []);
  arr.unshift(Object.assign({ at: new Date().toISOString() }, lead));
  await writeData('leads', arr.slice(0, 2000));
  return arr.length;
}

// ── session (HMAC-signed cookie) ──
function sign(payloadObj, days) {
  const exp = Date.now() + (days || 7) * 86400000;
  const body = Buffer.from(JSON.stringify(Object.assign({ exp }, payloadObj))).toString('base64url');
  const sig = crypto.createHmac('sha256', KEY).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const exp = crypto.createHmac('sha256', KEY).update(body).digest('base64url');
  if (sig !== exp) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch (_) { return null; }
}
function getCookie(req, name) {
  const c = req.headers.cookie || '';
  const m = c.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

module.exports = { enc, dec, readData, writeData, appendLead, sign, verify, getCookie, PATHS };
