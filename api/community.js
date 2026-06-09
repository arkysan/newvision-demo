// New Vision Community API
// Actions: register | login | me | posts | comments | follow
// All Supabase calls go via REST — no SDK dependency needed.

const SB_URL  = 'https://gcootnvmfvktcgelipbu.supabase.co';
// Anon key is public by design — env var only if it matches this project (old SUPABASE_ANON_KEY env may point to a different project)
const KNOWN_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb290bnZtZnZrdGNnZWxpcGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjMyMTcsImV4cCI6MjA5NTk5OTIxN30.MaseafulifklB8Y4474QKjz6KY6ufaqpA0JtQ1-b6jc';
const SB_ANON = (process.env.SUPABASE_ANON_KEY || '').includes('gcootnvmfvktcgelipbu') ? process.env.SUPABASE_ANON_KEY : KNOWN_ANON;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN   = process.env.NEWVISION_ADMIN_TOKEN || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json',
};

// ── Supabase REST helper ─────────────────────────────────────
async function sb(path, opts = {}, jwt = null, apiKey = SB_ANON) {
  const hdrs = {
    'apikey': apiKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'Authorization': `Bearer ${jwt || apiKey}`,
    ...opts.headers,
  };
  const r = await fetch(`${SB_URL}${path}`, { ...opts, headers: hdrs });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

// ── Get user from JWT ────────────────────────────────────────
async function getUser(jwt) {
  if (!jwt) return null;
  const r = await sb('/auth/v1/user', {}, jwt);
  return r.ok ? r.data : null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  const action = req.query.action || '';
  const jwt = (req.headers.authorization || '').replace('Bearer ', '').trim();
  let body = {};
  if (req.method === 'POST' || req.method === 'DELETE') {
    body = typeof req.body === 'object' ? req.body : {};
  }

  try {

    // ── REGISTER ─────────────────────────────────────────────
    if (action === 'register' && req.method === 'POST') {
      const { email, password, display_name, country, whatsapp } = body;
      if (!email || !password || !display_name) {
        return res.status(400).json({ ok: false, error: 'email, password, and display_name are required' });
      }
      const r = await sb('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({
          email, password,
          data: { display_name, country: country || '', whatsapp: whatsapp || '' },
        }),
      });
      if (!r.ok) return res.status(400).json({ ok: false, error: r.data?.msg || r.data?.message || 'Registration failed' });
      return res.status(200).json({ ok: true, user: r.data.user, access_token: r.data.access_token, message: 'Check your email to confirm your account.' });
    }

    // ── LOGIN ─────────────────────────────────────────────────
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = body;
      if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
      const r = await sb('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return res.status(401).json({ ok: false, error: 'Invalid email or password' });
      const { access_token, user } = r.data;
      return res.status(200).json({ ok: true, access_token, user });
    }

    // ── ME (get current user profile) ─────────────────────────
    if (action === 'me' && req.method === 'GET') {
      const user = await getUser(jwt);
      if (!user) return res.status(401).json({ ok: false, error: 'Not logged in' });
      const profile = await sb(`/rest/v1/profiles?id=eq.${user.id}&select=*`);
      return res.status(200).json({ ok: true, user, profile: profile.data?.[0] || null });
    }

    // ── POSTS (list) ─────────────────────────────────────────
    if (action === 'posts' && req.method === 'GET') {
      const r = await sb('/rest/v1/posts?select=id,title,content,category,author_name,cover_url,created_at&order=created_at.desc&limit=30');
      // Get comment counts
      const posts = r.data || [];
      return res.status(200).json({ ok: true, posts });
    }

    // ── POSTS (create — admin only) ───────────────────────────
    if (action === 'posts' && req.method === 'POST') {
      if (!ADMIN || !body.admin_token || body.admin_token !== ADMIN) {
        return res.status(403).json({ ok: false, error: 'Admin token required' });
      }
      if (!SB_SERVICE) {
        return res.status(503).json({
          ok: false,
          code: 'missing_supabase_service_role',
          error: 'Set SUPABASE_SERVICE_ROLE_KEY in the deployment environment for admin post writes. Do not read local .env service-role keys.',
        });
      }
      const { title, content, category, author_name, cover_url } = body;
      if (!title || !content) return res.status(400).json({ ok: false, error: 'title and content required' });
      const r = await sb('/rest/v1/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content, category: category || 'news', author_name: author_name || 'New Vision Team', cover_url: cover_url || null }),
      }, null, SB_SERVICE);
      return res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, post: r.data?.[0] } : { ok: false, error: 'Failed to create post' });
    }

    // ── COMMENTS (list) ───────────────────────────────────────
    if (action === 'comments' && req.method === 'GET') {
      const postId = req.query.post_id;
      if (!postId) return res.status(400).json({ ok: false, error: 'post_id required' });
      const r = await sb(`/rest/v1/comments?post_id=eq.${postId}&select=id,display_name,content,created_at&order=created_at.asc`);
      return res.status(200).json({ ok: true, comments: r.data || [] });
    }

    // ── COMMENTS (create) ─────────────────────────────────────
    if (action === 'comments' && req.method === 'POST') {
      const user = await getUser(jwt);
      if (!user) return res.status(401).json({ ok: false, error: 'Login required to comment' });
      const { post_id, content } = body;
      if (!post_id || !content?.trim()) return res.status(400).json({ ok: false, error: 'post_id and content required' });
      const display_name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Buyer';
      const r = await sb('/rest/v1/comments', {
        method: 'POST',
        body: JSON.stringify({ post_id, user_id: user.id, display_name, content: content.trim().slice(0, 1000) }),
      }, jwt);
      return res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, comment: r.data?.[0] } : { ok: false, error: 'Failed to post comment' });
    }

    // ── FOLLOW (status) ───────────────────────────────────────
    if (action === 'follow' && req.method === 'GET') {
      // Total followers (public)
      const countR = await sb('/rest/v1/follows?select=id', { headers: { Prefer: 'count=exact', Range: '0-0' } });
      const total = parseInt((countR.data?.length === 0 ? '0' : String(countR.status === 206 ? 0 : countR.data?.length || 0)));
      // Get count via a simpler approach
      const allR = await sb('/rest/v1/follows?select=id');
      const totalFollowers = Array.isArray(allR.data) ? allR.data.length : 0;

      const user = await getUser(jwt);
      let following = false;
      if (user) {
        const myR = await sb(`/rest/v1/follows?user_id=eq.${user.id}&select=id`, {}, jwt);
        following = Array.isArray(myR.data) && myR.data.length > 0;
      }
      return res.status(200).json({ ok: true, following, total: totalFollowers });
    }

    // ── FOLLOW (toggle) ───────────────────────────────────────
    if (action === 'follow' && req.method === 'POST') {
      const user = await getUser(jwt);
      if (!user) return res.status(401).json({ ok: false, error: 'Login required to follow' });
      const existing = await sb(`/rest/v1/follows?user_id=eq.${user.id}&select=id`, {}, jwt);
      if (Array.isArray(existing.data) && existing.data.length > 0) {
        await sb(`/rest/v1/follows?user_id=eq.${user.id}`, { method: 'DELETE' }, jwt);
        return res.status(200).json({ ok: true, following: false, message: 'Unfollowed' });
      } else {
        await sb('/rest/v1/follows', { method: 'POST', body: JSON.stringify({ user_id: user.id }) }, jwt);
        return res.status(200).json({ ok: true, following: true, message: 'Now following New Vision!' });
      }
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });

  } catch (e) {
    console.error('community API error:', e.message);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
