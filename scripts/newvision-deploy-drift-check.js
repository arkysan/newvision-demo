const crypto = require('node:crypto');

const TARGETS = [
  ['vercel', 'https://newvision-demo.vercel.app/'],
  ['github', 'https://arkysan.github.io/newvision-demo/'],
];

function normalize(html) {
  return String(html || '')
    .replace(/\?v=\d[\w.-]*/g, '?v=VERSION')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function signal(name, html) {
  return {
    name,
    status: html.includes('New Vision') && html.includes('global-shipping-map') && html.includes('stockIdForVehicle') ? 'mapped' : 'missing-signals',
    title: (html.match(/<title>(.*?)<\/title>/i) || [])[1] || '',
    hasLogo: html.includes('logo-mark.png'),
    hasMap: html.includes('global-shipping-map'),
    hasStockIds: html.includes('stockIdForVehicle') || html.includes('NV-2026-'),
    bytes: html.length,
    hash: hash(normalize(html)),
  };
}

(async () => {
  const rows = [];
  for (const [name, url] of TARGETS) {
    const res = await fetch(url, { cache: 'no-store' });
    const html = await res.text();
    rows.push(Object.assign({ url, http: res.status }, signal(name, html)));
  }
  console.table(rows);
  const [a, b] = rows;
  const drift = a.http !== 200 || b.http !== 200 || a.hash !== b.hash || a.status !== 'mapped' || b.status !== 'mapped';
  if (drift) {
    console.error('DEPLOY DRIFT: Vercel and GitHub home pages are not synced or one page is missing required public-site signals.');
    process.exit(1);
  }
  console.log('DEPLOY DRIFT CHECK PASS');
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
