const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { put, list } = require('@vercel/blob');

const BLOB_KEY = 'cms/vehicles.json';
const STATIC_PATH = path.join(process.cwd(), 'data', 'vehicles.json');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function requireAdmin(req, res) {
  const expected = process.env.NEWVISION_ADMIN_TOKEN;
  if (!expected) {
    send(res, 503, { ok: false, code: 'missing_admin_token', message: 'Set NEWVISION_ADMIN_TOKEN in Vercel env vars.' });
    return false;
  }
  const supplied = req.headers['x-newvision-admin-token'] || '';
  const left = Buffer.from(String(supplied));
  const right = Buffer.from(String(expected));
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    send(res, 401, { ok: false, code: 'unauthorized' });
    return false;
  }
  return true;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '[]');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '[]');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-newvision-admin-token');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  // ── GET — serve vehicles (Blob if available, else static file) ──
  if (req.method === 'GET') {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: BLOB_KEY });
        if (blobs.length) {
          const r = await fetch(blobs[0].url);
          if (r.ok) return send(res, 200, await r.json());
        }
      } catch (_) {}
    }
    try {
      return send(res, 200, JSON.parse(fs.readFileSync(STATIC_PATH, 'utf8')));
    } catch (_) {
      return send(res, 500, { ok: false, error: 'vehicles.json not found' });
    }
  }

  // ── PUT — save vehicles (admin + blob required) ──
  if (req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return send(res, 503, { ok: false, code: 'missing_blob_token', message: 'Connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN).' });
    }
    let vehicles;
    try { vehicles = await readBody(req); } catch (_) { return send(res, 400, { ok: false, error: 'Invalid JSON' }); }
    if (!Array.isArray(vehicles)) return send(res, 400, { ok: false, error: 'Expected JSON array' });
    await put(BLOB_KEY, JSON.stringify(vehicles, null, 2), {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      allowOverwrite: true,
    });
    return send(res, 200, { ok: true, count: vehicles.length });
  }

  return send(res, 405, { ok: false, error: 'Method not allowed' });
};
