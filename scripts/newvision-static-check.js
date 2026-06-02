const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const html = fs.readFileSync(INDEX, 'utf8');
const review = fs.readFileSync(path.join(ROOT, 'arkreview.js'), 'utf8');
const cms = fs.readFileSync(path.join(ROOT, 'api', 'cms.js'), 'utf8');
const failures = [];

function fail(message) {
  failures.push(message);
}

const forbidden = [
  [/img\s*:\s*null/, 'Vehicle data contains img:null'],
  [/emoji\s*:/, 'Vehicle data contains emoji fallback fields'],
  [/img\s*:\s*['"]https?:\/\//, 'Vehicle data hotlinks remote vehicle images'],
  [/modalEmoji|vehicle-img-placeholder/, 'Vehicle photo fallback still uses cartoon/placeholder path'],
  [/Live Inventory|Stock en ligne|مخزون مباشر|实时库存/, 'Demo copy still claims live inventory'],
];

for (const [pattern, message] of forbidden) {
  if (pattern.test(html)) fail(message);
}

const requiredLanguageGuards = [
  ['I18N_EXTRA', 'Missing local extra translation dictionary for untagged visible text'],
  ['applyStaticPhraseTranslations', 'Missing static phrase translation pass for untagged text'],
  ["trTerm('fuel'", 'Vehicle cards/modal no longer translate fuel/body/spec terms'],
  ['modalWasOpen', 'Language switching must not reopen a closed vehicle modal'],
];

for (const [snippet, message] of requiredLanguageGuards) {
  if (!html.includes(snippet)) fail(message);
}

const requiredMobileQuoteGuards = [
  ['id="qContact"', 'Quote form must require WhatsApp / phone contact information'],
  ['data-i18n="mnav_lang"', 'Mobile bottom bar must expose language control'],
  ['id="mobileLangPanel"', 'Mobile language panel is missing'],
  ['data-vehicle-id="${v.id}"', 'Vehicle cards must expose IDs for mobile quote context'],
  ['currentVisibleVehicle', 'Mobile quote flow must infer the visible vehicle when possible'],
  ['populateQuoteVehicles', 'Quote vehicle selector must be generated from current vehicle data'],
  ['canAutoLoadCmsState', 'Local static preview must not auto-fetch missing CMS API'],
  ['WhatsApp / Phone: ${contact}', 'WhatsApp quote message must include buyer contact information'],
];

for (const [snippet, message] of requiredMobileQuoteGuards) {
  if (!html.includes(snippet)) fail(message);
}

const quoteIndex = html.indexOf('id="quote"');
const routesIndex = html.indexOf('id="routes"');
const howIndex = html.indexOf('id="how"');
if (quoteIndex === -1) fail('Quote section is missing');
if (routesIndex === -1) fail('Routes section is missing');
if (howIndex !== -1 && quoteIndex !== -1 && quoteIndex < howIndex) fail('Quote section moved above How It Works');
if (quoteIndex !== -1 && routesIndex !== -1 && quoteIndex > routesIndex) fail('Quote section must sit before Active Shipping Routes');
if (/onclick=["'][^"']*openWA\(/.test(html)) fail('Visible WhatsApp CTAs bypass the required quote form');

const requiredQuoteWiring = [
  ['SALES_WHATSAPP_RECIPIENTS', 'Missing sales WhatsApp recipient list'],
  ['8613735611862', 'Missing primary New Vision WhatsApp number'],
  ['15558694441', 'Missing Eissah WhatsApp number'],
  ['15595107788', 'Missing Andy WhatsApp number'],
  ['copyLastQuoteMessage', 'Quote dispatch must let the completed request be copied for secondary sales handoff'],
  ['function goToQuote', 'Missing quote scroll/prefill function'],
  ['function quoteVehicle', 'Vehicle quote buttons no longer prefill the quote form'],
  ['id="quoteDispatch"', 'Missing quote dispatch recipient panel'],
  ['id="qContact"', 'WhatsApp/phone field is required for sales handoff data'],
  ['WhatsApp / Phone: ${contact}', 'Quote message must include buyer WhatsApp/phone'],
  ['Multiple vehicles / Fleet order', 'Vehicle select must include a usable fleet-order option'],
];
for (const [snippet, message] of requiredQuoteWiring) {
  if (!html.includes(snippet)) fail(message);
}

function tagHasRequired(id) {
  const pattern = new RegExp(`<(?:input|select|textarea)[^>]*id=["']${id}["'][^>]*\\brequired\\b`, 'i');
  return pattern.test(html);
}
for (const [id, message] of [
  ['qName', 'Name must be required before WhatsApp opens'],
  ['qCountry', 'Country must be required before WhatsApp opens'],
  ['qContact', 'WhatsApp/phone must be required before WhatsApp opens'],
  ['qVehicle', 'Vehicle selection must be required before WhatsApp opens'],
  ['qPort', 'Destination port must be required before WhatsApp opens'],
  ['qMsg', 'Message/quantity must be required before WhatsApp opens'],
]) {
  if (!tagHasRequired(id)) fail(message);
}

const requiredReviewControls = [
  ['WA_RECIPIENTS', 'Review widget missing New Vision recipient list'],
  ['rv-redo', 'Review edit bar missing redo button'],
  ['rv-annotate', 'Review edit bar missing annotation button'],
  ['rv-move-up', 'Review edit bar missing move-up control'],
  ['function moveSelected', 'Review widget missing selected-section move support'],
  ['function annotateSelected', 'Review widget missing selected-section annotation support'],
  ['selectedRangeElement', 'Review widget must support highlighted text as a movable/annotatable target'],
  ['data-action="size-up"', 'Review quick chips must expose direct bigger action'],
  ['data-action="move-down"', 'Review quick chips must expose directional move action'],
  ['data-action="whatsapp"', 'Review quick chips must expose WhatsApp flow action'],
  ['function handleQuickAction', 'Review quick chips must run action handlers instead of only filling the note box'],
  ['function addStructuredNote', 'Review quick chips must create structured notes'],
  ['rv-main-cmd', 'Hybrid review editor must expose one primary Tell ARK command box'],
  ['Tell ARK what to change', 'Hybrid review editor must use a plain natural-language command prompt'],
  ['function intentFromText', 'Hybrid review editor must parse natural-language review instructions'],
  ['function renderSuggestions', 'Hybrid review editor must render smart suggestion actions'],
  ['function runSuggestion', 'Hybrid review editor must execute Preview/Add note/Publish request/Undo'],
  ['rv-preview-switch', 'Review mode must expose a Local/Live/Phone preview switcher'],
  ['rv-preview-phone', 'Preview switcher must include a phone mode control'],
  ['rv-phone-preview', 'Phone preview mode must use a dedicated review-only class'],
  ['newvision-demo.vercel.app', 'Live preview must point to the Vercel deployment'],
  ['github.com/arkysan/newvision-demo', 'Review workflow must expose the GitHub source link for owner updates'],
  ['rv-inventory-lane', 'Inventory must expose an owner-only review lane below vehicle results'],
  ['rv-fab-mobile', 'Review widget must expose a phone-sized Review button'],
  ['body.rv-open .mobile-app-bar', 'Review widget must hide the phone app dock while the phone editor is open'],
  ['#rv-chips{display:grid', 'Review quick chips must use a phone-friendly grid layout'],
  ['max-height:min(72vh,620px)', 'Phone review editor must leave the website visible above the bottom sheet'],
  ['border-radius:20px 20px 0 0', 'Phone review editor must render as a bottom sheet instead of a full-screen cover'],
  ['Preview applied', 'Review quick chips must mark visible preview actions'],
  ['PUBLISH REQUEST', 'Review publish flow must send an honest publish request packet'],
  ['CMS_REVIEW_ENDPOINT', 'Review publish flow must target the live CMS review-patches endpoint'],
  ['PUBLISHED LIVE', 'Review publish flow must report actual live CMS publish when it succeeds'],
  ['function loadPublishedChanges', 'Published review changes must reload on the public site'],
];
for (const [snippet, message] of requiredReviewControls) {
  if (!review.includes(snippet)) fail(message);
}
if (/@media\(max-width:600px\)\{#rv-fab\{display:none\}\}/.test(review)) {
  fail('Phone viewport must not hide the review editor button');
}

const requiredCmsControls = [
  ["require('node:crypto')", 'CMS admin-token comparison must import node:crypto'],
  ['REVIEW_PATCHES_PATH', 'CMS must define a public review patch store for editor publishes'],
  ['normalizeReviewPatches', 'CMS must sanitize review patch publishes'],
  ["action === 'review-patches'", 'CMS must expose review-patches read/write actions'],
];
for (const [snippet, message] of requiredCmsControls) {
  if (!cms.includes(snippet)) fail(message);
}
const cryptoImports = cms.match(/require\('node:crypto'\)/g) || [];
if (cryptoImports.length !== 1) fail(`CMS should import node:crypto exactly once, found ${cryptoImports.length}`);

const emojiPattern = /\p{Extended_Pictographic}/gu;
const emojiFiles = [
  ['index.html', html],
  ['arkreview.js', review],
];
for (const [name, text] of emojiFiles) {
  const matches = [...new Set(text.match(emojiPattern) || [])];
  if (matches.length) fail(`${name} contains emoji-style UI characters: ${matches.join(' ')}`);
}

const localRefs = new Set();
for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) localRefs.add(match[1]);
for (const match of html.matchAll(/img\s*:\s*['"]([^'"]+)['"]/g)) localRefs.add(match[1]);

for (const ref of localRefs) {
  if (ref.includes('${')) continue;
  if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(ref)) continue;
  const clean = ref.split(/[?#]/)[0].replace(/^\/+/, '');
  if (!clean) continue;
  const file = path.join(ROOT, clean);
  if (!fs.existsSync(file)) {
    fail(`Missing referenced asset: ${ref}`);
    continue;
  }
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(file) && fs.statSync(file).size === 0) {
    fail(`Zero-byte image asset: ${ref}`);
  }
}

const vehicleMatches = [...html.matchAll(/\{\s*id:\s*\d+,/g)];
const vehicleImageMatches = [...html.matchAll(/img\s*:\s*['"]img\//g)];
const vehicleImageRefs = [...html.matchAll(/img\s*:\s*['"](img\/[^'"]+)['"]/g)].map(match => match[1]);
if (vehicleMatches.length === 0) fail('No vehicles found in data set');
if (vehicleImageMatches.length < vehicleMatches.length) {
  fail(`Vehicle image coverage incomplete: ${vehicleImageMatches.length}/${vehicleMatches.length}`);
}

for (const ref of vehicleImageRefs) {
  if (!/\.webp$/i.test(ref)) fail(`Vehicle image should use deployable webp path: ${ref}`);
  const imageFile = path.join(ROOT, ref);
  if (!fs.existsSync(imageFile)) fail(`Missing vehicle image asset: ${ref}`);
  const thumbRef = `img/thumbs/${path.basename(ref).replace(/\.[^.]+$/, '.webp')}`;
  const thumbFile = path.join(ROOT, thumbRef);
  if (!fs.existsSync(thumbFile)) fail(`Missing generated phone thumbnail asset: ${thumbRef}`);
  if (fs.existsSync(thumbFile) && fs.statSync(thumbFile).size === 0) fail(`Zero-byte phone thumbnail asset: ${thumbRef}`);
}

if (!fs.existsSync(path.join(ROOT, 'PHOTO_SOURCES.md'))) {
  fail('PHOTO_SOURCES.md is missing');
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  vehicles: vehicleMatches.length,
  vehicleImages: vehicleImageMatches.length,
  checkedAt: new Date().toISOString(),
}, null, 2));
