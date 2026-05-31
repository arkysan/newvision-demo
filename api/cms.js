const crypto = require('node:crypto');
const { put, list } = require('@vercel/blob');

const STATE_PATH = 'cms/newvision-state.json';
const REVIEW_PATCHES_PATH = 'cms/newvision-review-patches.json';
const MAX_JSON_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function getAction(req) {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  return url.searchParams.get('action') || 'state';
}

function timingSafeMatch(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res) {
  const expected = process.env.NEWVISION_ADMIN_TOKEN;
  if (!expected) {
    send(res, 503, {
      ok: false,
      code: 'missing_admin_token',
      message: 'Set NEWVISION_ADMIN_TOKEN in Vercel before live edits are allowed.',
    });
    return false;
  }
  const supplied = req.headers['x-newvision-admin-token'];
  if (!timingSafeMatch(supplied, expected)) {
    send(res, 401, { ok: false, code: 'unauthorized', message: 'Admin token is missing or invalid.' });
    return false;
  }
  return true;
}

function requireBlob(res) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  send(res, 503, {
    ok: false,
    code: 'missing_blob_token',
    message: 'Connect a Vercel Blob store so BLOB_READ_WRITE_TOKEN is available.',
  });
  return false;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) {
      const err = new Error('Request body too large');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function cleanName(name) {
  return String(name || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'upload';
}

function cleanText(value, max = 2000) {
  return String(value || '').replace(/\u0000/g, '').slice(0, max);
}

function normalizeVehicle(vehicle, index) {
  const id = Number.parseInt(vehicle.id, 10);
  const price = Number.parseInt(vehicle.price, 10);
  const year = Number.parseInt(vehicle.year, 10);
  const mileage = Number.parseInt(vehicle.mileage || 0, 10);
  if (!Number.isFinite(id) || id <= 0) throw new Error(`Vehicle ${index + 1} has an invalid id`);
  if (!Number.isFinite(price) || price < 0 || price > 2000000) throw new Error(`Vehicle ${id} has an invalid price`);
  if (!Number.isFinite(year) || year < 1990 || year > 2035) throw new Error(`Vehicle ${id} has an invalid year`);
  if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2000000) throw new Error(`Vehicle ${id} has an invalid mileage`);

  const img = cleanText(vehicle.img, 1000);
  if (img && !/^(https:\/\/|img\/)/.test(img)) throw new Error(`Vehicle ${id} image must be https or img/`);

  return {
    id,
    make: cleanText(vehicle.make, 80),
    model: cleanText(vehicle.model, 160),
    year,
    mileage,
    condition: vehicle.condition === 'Used' ? 'Used' : 'New',
    type: cleanText(vehicle.type, 40) || 'SUV',
    fuel: cleanText(vehicle.fuel, 40) || 'Petrol',
    body: cleanText(vehicle.body, 40) || 'SUV',
    price,
    img,
    ev: Boolean(vehicle.ev),
    hot: Boolean(vehicle.hot),
    premium: Boolean(vehicle.premium),
    trans: cleanText(vehicle.trans, 80),
    engine: cleanText(vehicle.engine, 120),
    drive: cleanText(vehicle.drive, 40),
    doors: Number.parseInt(vehicle.doors || 4, 10) || 4,
    seats: Number.parseInt(vehicle.seats || 5, 10) || 5,
    range_km: vehicle.range_km ? Number.parseInt(vehicle.range_km, 10) || null : null,
  };
}

function normalizeState(input) {
  const vehicles = Array.isArray(input.vehicles) ? input.vehicles : [];
  if (vehicles.length > 500) throw new Error('Vehicle list is too large');

  const allowedContent = ['demo_notice', 'hero_h1', 'hero_sub', 'inv_sub', 'showroom_desc'];
  const content = {};
  for (const key of allowedContent) {
    if (input.content && input.content[key] !== undefined) content[key] = cleanText(input.content[key], key === 'hero_h1' ? 500 : 1400);
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    content,
    vehicles: vehicles.map(normalizeVehicle),
  };
}

function cleanSelector(value, max = 500) {
  return cleanText(value, max).replace(/[<>"`]/g, '');
}

function normalizeReviewChange(change, index) {
  const allowedKinds = new Set(['text', 'image', 'size', 'imgsize', 'color', 'hide', 'move', 'annotation']);
  const kind = cleanText(change.kind, 30);
  if (!allowedKinds.has(kind)) throw new Error(`Review change ${index + 1} has an unsupported kind`);

  const after = cleanText(change.after, kind === 'image' ? 1000 : 2500);
  if (kind === 'image' && after && !/^(https:\/\/|img\/)/.test(after)) {
    throw new Error(`Review change ${index + 1} image must be https or img/`);
  }

  return {
    id: cleanText(change.id, 80) || `change-${index + 1}`,
    page: cleanText(change.page, 80) || 'home',
    kind,
    sel: cleanSelector(change.sel),
    key: cleanSelector(change.key, 120),
    parent: cleanSelector(change.parent),
    before: cleanText(change.before, 2500),
    after,
    desc: cleanText(change.desc, 300),
    at: Number.parseInt(change.at || Date.now(), 10) || Date.now(),
  };
}

function normalizeReviewPatches(input) {
  const changes = Array.isArray(input.changes) ? input.changes : [];
  if (changes.length > 300) throw new Error('Review patch list is too large');
  return {
    version: 1,
    publishedAt: new Date().toISOString(),
    page: cleanText(input.page, 80) || 'home',
    changes: changes.map(normalizeReviewChange),
    notes: Array.isArray(input.notes) ? input.notes.slice(0, 100).map((note) => ({
      page: cleanText(note.page, 80),
      section: cleanText(note.section, 300),
      action: cleanText(note.action, 120),
      text: cleanText(note.text, 2000),
      at: cleanText(note.at, 80),
    })) : [],
  };
}

async function readState() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { state: null, source: 'defaults', storageConfigured: false };
  }
  const result = await list({ prefix: STATE_PATH, limit: 1 });
  const match = (result.blobs || []).find((blob) => blob.pathname === STATE_PATH);
  if (!match) return { state: null, source: 'defaults', storageConfigured: true };

  const response = await fetch(`${match.url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`State blob read failed: ${response.status}`);
  return { state: await response.json(), source: 'blob', storageConfigured: true };
}

async function readReviewPatches() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { patches: null, source: 'defaults', storageConfigured: false };
  }
  const result = await list({ prefix: REVIEW_PATCHES_PATH, limit: 1 });
  const match = (result.blobs || []).find((blob) => blob.pathname === REVIEW_PATCHES_PATH);
  if (!match) return { patches: null, source: 'defaults', storageConfigured: true };

  const response = await fetch(`${match.url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Review patch blob read failed: ${response.status}`);
  return { patches: await response.json(), source: 'blob', storageConfigured: true };
}

async function saveState(req, res) {
  if (!requireAdmin(req, res) || !requireBlob(res)) return;
  const body = await readJsonBody(req);
  const state = normalizeState(body.state || body);
  const blob = await put(STATE_PATH, JSON.stringify(state), {
    access: 'public',
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json',
  });
  send(res, 200, { ok: true, state, blob });
}

async function saveReviewPatches(req, res) {
  if (!requireAdmin(req, res) || !requireBlob(res)) return;
  const body = await readJsonBody(req);
  const patches = normalizeReviewPatches(body);
  const blob = await put(REVIEW_PATCHES_PATH, JSON.stringify(patches), {
    access: 'public',
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json',
  });
  send(res, 200, { ok: true, patches, blob });
}

async function uploadAsset(req, res) {
  if (!requireAdmin(req, res) || !requireBlob(res)) return;
  const body = await readJsonBody(req);
  const mime = cleanText(body.type || 'application/octet-stream', 120);
  const originalName = cleanName(body.name);
  const encoded = String(body.data || '').replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length) {
    send(res, 400, { ok: false, code: 'empty_upload', message: 'No file data was received.' });
    return;
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    send(res, 413, { ok: false, code: 'upload_too_large', message: 'Upload is over 6 MB after browser compression.' });
    return;
  }

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const blob = await put(`uploads/${folder}/${Date.now()}-${originalName}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000,
    contentType: mime,
  });
  send(res, 200, { ok: true, asset: blob });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

    const action = getAction(req);
    if (req.method === 'GET' && action === 'status') {
      return send(res, 200, {
        ok: true,
        adminConfigured: Boolean(process.env.NEWVISION_ADMIN_TOKEN),
        storageConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      });
    }
    if (req.method === 'GET' && action === 'state') {
      const state = await readState();
      return send(res, 200, { ok: true, ...state });
    }
    if (req.method === 'GET' && action === 'review-patches') {
      const patches = await readReviewPatches();
      return send(res, 200, { ok: true, ...patches });
    }
    if (req.method === 'PUT' && action === 'state') return saveState(req, res);
    if (req.method === 'PUT' && action === 'review-patches') return saveReviewPatches(req, res);
    if (req.method === 'POST' && action === 'upload') return uploadAsset(req, res);

    send(res, 405, { ok: false, code: 'method_not_allowed' });
  } catch (error) {
    send(res, error.statusCode || 500, {
      ok: false,
      code: 'cms_error',
      message: error.message || 'CMS request failed.',
    });
  }
};
