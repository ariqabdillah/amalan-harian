// Penghubung aman: link Apps Script dan PIN disimpan di Environment Variables Vercel
// (SHEET_URL dan APP_PIN), tidak pernah dikirim ke browser.
const crypto = require('crypto');

function sameText(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async (req, res) => {
  const url = (process.env.SHEET_URL || '').trim();
  const pin = (process.env.APP_PIN || '').trim();
  const q = req.query || {};
  res.setHeader('Cache-Control', 'no-store');

  if (q.status !== undefined) return res.status(200).json({ configured: !!(url && pin) });
  if (!url || !pin) return res.status(503).json({ ok: false, error: 'not-configured' });

  const given = String(req.headers['x-pin'] || '').trim();
  if (!sameText(given, pin)) {
    await new Promise(r => setTimeout(r, 1500)); // memperlambat tebakan PIN
    return res.status(401).json({ ok: false, error: 'pin' });
  }
  if (q.check !== undefined) return res.status(200).json({ ok: true });

  try {
    let r;
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
    } else {
      r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { redirect: 'follow' });
    }
    const text = await r.text();
    try { JSON.parse(text); } catch (e) {
      return res.status(502).json({ ok: false, error: 'Google Sheets tidak menjawab dengan benar. Cek link SHEET_URL.' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e) });
  }
};
