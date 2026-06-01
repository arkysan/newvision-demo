// Shared ARK lead-capture serverless function (Vercel-compatible).
// Drop into any site as /api/lead. Captures the lead BEFORE the WhatsApp/phone
// handoff so NO inquiry is ever lost — then notifies the owner via Telegram.
//
// Env (set on the Vercel project, never committed):
//   TELEGRAM_BOT_TOKEN  - @Videoarkbot token
//   TELEGRAM_CHAT_ID    - owner chat id
//   LEAD_SOURCE         - optional label (e.g. "New Vision", "Audit", "Macular-OD")
//
// Honest design: if Telegram env is missing it still returns ok:true (never blocks
// the user's handoff) but reports delivered:false so the site can fall back.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }

  try {
    const b = (req.body && typeof req.body === 'object') ? req.body : {};
    // Accept any common contact fields; keep it generic so all 4 sites reuse it.
    const name = String(b.name || b.fullName || '').slice(0, 120).trim();
    const contact = String(b.contact || b.phone || b.whatsapp || b.email || '').slice(0, 120).trim();
    const message = String(b.message || b.details || b.notes || '').slice(0, 1500).trim();
    const extra = {};
    for (const k of ['country', 'vehicle', 'port', 'business', 'businessType', 'practice', 'role', 'topic']) {
      if (b[k]) extra[k] = String(b[k]).slice(0, 200);
    }
    if (!name && !contact) { res.status(400).json({ ok: false, error: 'name or contact required' }); return; }

    const source = process.env.LEAD_SOURCE || b.source || 'ARK site';
    const lines = [
      `🟢 NEW LEAD — ${source}`,
      name ? `Name: ${name}` : null,
      contact ? `Contact: ${contact}` : null,
      ...Object.entries(extra).map(([k, v]) => `${k}: ${v}`),
      message ? `Message: ${message}` : null,
      `Time: ${new Date().toISOString()}`,
    ].filter(Boolean);
    const text = lines.join('\n');

    async function tgSend(token, chatId) {
      if (!token || !chatId) return false;
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
        const j = await r.json().catch(() => ({}));
        return !!j.ok;
      } catch (_) { return false; }
    }

    // Primary bot for this site (e.g. New Vision = @VISIONMANAGERBOT).
    const delivered = await tgSend(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID);
    // Optional mirror to the master bot so the two bots "communicate" — every lead
    // also lands in the central @Videoarkbot feed. Set MIRROR_BOT_TOKEN/MIRROR_CHAT_ID
    // to enable; skipped silently if unset or identical to the primary.
    let mirrored = false;
    const mTok = process.env.MIRROR_BOT_TOKEN, mChat = process.env.MIRROR_CHAT_ID;
    if (mTok && mChat && mTok !== process.env.TELEGRAM_BOT_TOKEN) {
      mirrored = await tgSend(mTok, mChat);
    }

    res.status(200).json({ ok: true, delivered, mirrored, captured: { name, contact } });
  } catch (e) {
    // Never block the user's handoff — return ok even on internal error.
    res.status(200).json({ ok: true, delivered: false, error: e.message });
  }
};
