const crypto = require('node:crypto');
const { put } = require('@vercel/blob');

const ALLOWED_TYPES = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/gif']);
const MAX_BYTES = 4.5 * 1024 * 1024;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function requireAdmin(req, res) {
  const expected = process.env.NEWVISION_ADMIN_TOKEN;
  if (!expected) { send(res, 503, { ok:false, code:'missing_admin_token' }); return false; }
  const supplied = req.headers['x-newvision-admin-token'] || '';
  const left  = Buffer.from(String(supplied));
  const right = Buffer.from(String(expected));
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    send(res, 401, { ok:false, code:'unauthorized' }); return false;
  }
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-newvision-admin-token');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') return send(res, 405, { ok:false, error:'POST only' });
  if (!requireAdmin(req, res)) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return send(res, 503, { ok:false, code:'missing_blob_token', message:'Connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN).' });
  }

  const contentType = req.headers['content-type'] || 'image/jpeg';
  if (!ALLOWED_TYPES.has(contentType.split(';')[0].trim())) {
    return send(res, 400, { ok:false, error:'Image type not allowed. Use JPEG/PNG/WebP.' });
  }

  // Buffer body with size guard
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) return send(res, 413, { ok:false, error:'Image too large (max 4.5MB).' });
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  if (!body.length) return send(res, 400, { ok:false, error:'Empty body.' });

  const raw = (req.query && req.query.filename) || 'photo.jpg';
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const ts = Date.now();
  const pathname = `vehicles/${ts}_${safe}`;

  const blob = await put(pathname, body, {
    access: 'public',
    contentType,
    allowOverwrite: false,
  });

  return send(res, 200, { ok:true, url: blob.url, pathname: blob.pathname });
};
