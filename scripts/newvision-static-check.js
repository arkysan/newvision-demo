const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const html = fs.readFileSync(INDEX, 'utf8');
const siteI18n = fs.readFileSync(path.join(ROOT, 'site-i18n.js'), 'utf8');
const vehicleDeal = fs.readFileSync(path.join(ROOT, 'vehicle.html'), 'utf8');
const portal = fs.readFileSync(path.join(ROOT, 'portal.html'), 'utf8');
const sales = fs.readFileSync(path.join(ROOT, 'sales.html'), 'utf8');
const worldmap = fs.readFileSync(path.join(ROOT, 'worldmap.html'), 'utf8');
const brands = fs.readFileSync(path.join(ROOT, 'brands.html'), 'utf8');
const communityApi = fs.readFileSync(path.join(ROOT, 'api', 'community.js'), 'utf8');
const supabaseSchema = fs.readFileSync(path.join(ROOT, 'supabase-schema.sql'), 'utf8');
const review = fs.readFileSync(path.join(ROOT, 'arkreview.js'), 'utf8');
const cms = fs.readFileSync(path.join(ROOT, 'api', 'cms.js'), 'utf8');
const vehiclesApi = fs.readFileSync(path.join(ROOT, 'api', 'vehicles.js'), 'utf8');
const uploadApi = fs.readFileSync(path.join(ROOT, 'api', 'upload.js'), 'utf8');
const vercelConfig = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
const failures = [];

function fail(message) {
  failures.push(message);
}

const publicHtmlPages = [
  'index.html',
  'brands.html',
  'vehicle.html',
  'track.html',
  'community.html',
  'worldmap.html',
  'routemap.html',
  'portal.html',
  'sales.html',
];

for (const page of publicHtmlPages) {
  const pageHtml = fs.readFileSync(path.join(ROOT, page), 'utf8');
  if (!pageHtml.includes('site-i18n.js')) fail(`${page} must load the shared full-site language runtime`);
  if (/translate\.google|google_translate_element|skiptranslate/i.test(pageHtml)) {
    fail(`${page} must not depend on Google Translate widgets for language buttons`);
  }
}

for (const lang of ['EN', 'FR', 'AR', 'ZH']) {
  if (!siteI18n.includes(lang)) fail(`site-i18n.js must expose ${lang} language coverage`);
}
for (const snippet of [
  'const STORE_KEY = \'newvision.lang\'',
  'data-nv-lang',
  'newvision:langchange',
  'MutationObserver',
  'document.documentElement.dir',
  'document.documentElement.lang',
  'placeholder',
]) {
  if (!siteI18n.includes(snippet)) fail(`site-i18n.js missing required language runtime guard: ${snippet}`);
}
if (/translate\.google|google_translate_element|skiptranslate/i.test(siteI18n)) {
  fail('site-i18n.js must use local dictionaries, not Google Translate');
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
  ['data-i18n="quote_inspection"', 'Quote proof/inspection label must be translated'],
  ['data-i18n="quote_preview_title"', 'Quote preview title must be translated'],
  ['trQuoteRoute', 'Generated quote route preview must translate route names'],
  ['data-i18n="nav_ship_routes"', 'Ship Routes nav item must be translated'],
  ['data-i18n="ship_map_h"', 'Shipping map heading must be translated'],
  ['SHIPPING_ROUTE_BOARD_ZH', 'Shipping route board must have Chinese dynamic copy'],
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
  ['id="quotePreview"', 'Quote form must expose an export quote preview panel'],
  ['quoteEstimate', 'Lead payload must include quote estimate context'],
  ['freightEstimate', 'Lead payload must include freight estimate context'],
  ['inspectionOption', 'Lead payload must include proof/inspection choice'],
  ['docsOption', 'Lead payload must include document choice'],
  ['async function captureLead', 'Quote flow must still capture the lead before WhatsApp handoff'],
];
for (const [snippet, message] of requiredQuoteWiring) {
  if (!html.includes(snippet)) fail(message);
}

const requiredInventoryOrganization = [
  ['id="inventoryFilterDrawer"', 'Inventory filters must live in a compact dropdown drawer'],
  ['Refine inventory', 'Inventory filter drawer must use clear customer-facing dropdown wording'],
  ['id="inventoryOrganizer"', 'Inventory must expose the grouped buyer filter organizer'],
  ['data-i18n="org_brand"', 'Inventory organizer must label brand filters'],
  ['id="brandGrid"', 'Brand filters must live inside the inventory shopping surface'],
  ['id="powerFilterBar"', 'Inventory organizer must separate electric/hybrid from gas/petrol vehicles'],
  ["setInventoryFilter('power','EV'", 'Power filter must expose an EV/PHEV lane'],
  ["setInventoryFilter('power','Fuel'", 'Power filter must expose a gas/petrol lane'],
  ['id="bodyFilterBar"', 'Inventory organizer must separate SUV/sedan/body categories'],
  ['id="tierFilterBar"', 'Inventory organizer must separate premium from value vehicles'],
  ['id="stockFilterBar"', 'Inventory organizer must separate new/used stock condition'],
  ['id="priceFilterBar"', 'Inventory organizer must keep budget separate from new/used stock'],
  ["if (powerFilter==='EV')", 'Filter logic must apply the EV/PHEV filter'],
  ["else if (powerFilter==='Fuel')", 'Filter logic must apply the gas/petrol filter'],
  ["if (tierFilter==='Premium')", 'Filter logic must apply the premium filter'],
  ["else if (tierFilter==='Value')", 'Filter logic must apply the value filter'],
  ['function setActiveFilterButton', 'Grouped filter buttons must keep active state scoped per group'],
  ['grid-template-columns: repeat(2, minmax(0, 1fr))', 'Phone inventory must render as a dense two-column marketplace grid'],
  ['max-height: 320px', 'Phone filter drawer must stay compact instead of pushing vehicles too far down'],
];
for (const [snippet, message] of requiredInventoryOrganization) {
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
  ['Saved as selected-section annotation', 'Annotation must save through the structured review-note flow'],
  ['selectedRangeElement', 'Review widget must support highlighted text as a movable/annotatable target'],
  ['data-action="size-up"', 'Review quick chips must expose direct bigger action'],
  ['data-action="move-down"', 'Review quick chips must expose directional move action'],
  ['data-action="whatsapp"', 'Review quick chips must expose WhatsApp flow action'],
  ['data-action="annotate"', 'Review quick chips must expose visible annotation action'],
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

const requiredPortalPhotoControls = [
  ['Photos — up to 8', 'Portal vehicle editor must allow adding more photos, not stop at four'],
  ['id="imgSlots"', 'Portal vehicle editor must expose image upload slots'],
  ['Array(8).fill(null)', 'Portal photo editor must maintain eight upload slots'],
  ['const SLOT_LABELS', 'Portal photo editor must label upload slots'],
  ['handleSlotFile', 'Portal photo editor must upload selected files'],
  ["fetch(apiUrl('/api/upload?filename='", 'Portal photo editor must call the upload API through the host-aware API base'],
  ["fetch(apiUrl('/api/vehicles'", 'Portal inventory manager must read/save vehicle data through the host-aware API base'],
  ['imgs:       invImgUrls.filter(Boolean)', 'Portal must persist all uploaded photo URLs in vehicle imgs'],
  ['SESSION_KEY', 'GitHub portal mode must use sessionStorage for cross-host API sessions'],
  ['Authorization = \'Bearer \'', 'Portal must send the cross-host bearer session token to Vercel APIs'],
  ['id="vf_stockId"', 'Portal vehicle editor must expose public stock IDs'],
  ['id="vf_vin"', 'Portal vehicle editor must keep private VIN/frame fields'],
  ['id="vf_docs"', 'Portal vehicle editor must capture export docs status'],
  ['id="vf_inspection"', 'Portal vehicle editor must capture inspection status'],
  ['id="vf_shipment"', 'Portal vehicle editor must connect vehicles to shipment IDs'],
];
for (const [snippet, message] of requiredPortalPhotoControls) {
  if (!portal.includes(snippet)) fail(message);
}

const requiredPublicGalleryControls = [
  ['galleryImgs=Array.isArray(v.imgs)&&v.imgs.length', 'Public vehicle modal must read multi-photo imgs arrays'],
  ['gallery-thumbs', 'Public vehicle modal must expose thumbnails for multiple photos'],
  ['galleryNav', 'Public vehicle modal must expose previous/next gallery navigation'],
  ["fetch(apiUrl('/api/vehicles'", 'Public site must refresh vehicle inventory through the host-aware API base'],
  ['const API_BASE', 'Public site must define a GitHub/Vercel API base helper'],
  ['const IS_STATIC_PUBLIC_HOST', 'Public site must route GitHub, jsDelivr, and Pages static hosts through the Vercel API base'],
  ["location.hostname === 'cdn.jsdelivr.net'", 'Public site must route jsDelivr static pages through the Vercel API base'],
  ["location.hostname.endsWith('.pages.dev')", 'Public site must route Cloudflare Pages through the Vercel API base'],
  ['data-stock-id="${stockIdForVehicle(v)}"', 'Vehicle cards must expose public stock IDs'],
  ['vehiclePublicLane', 'Customer-facing vehicle cards must show a public export lane, not exact back-room location'],
  ['vehicle-spec-strip', 'Vehicle cards must show compact detail facts before opening the modal'],
  ['vehicleDealUrl', 'Vehicle cards must link to a public full deal page'],
  ['View full deal', 'Vehicle cards must expose a full deal CTA'],
  ['FOB + freight preview', 'Vehicle cards must communicate the export quote preview path'],
  ["openModal(${v.id},'specs')", 'Vehicle cards must expose a dedicated full specs button'],
  ['data-tab="specs"', 'Vehicle detail modal must expose stable tab keys for translated UI'],
  ['requestCurrentStockPhoto', 'Vehicle detail modal must route current-photo requests into the quote flow'],
  ['requestVehicleInspection', 'Vehicle detail modal must route inspection requests into the quote flow'],
];
for (const [snippet, message] of requiredPublicGalleryControls) {
  if (!html.includes(snippet)) fail(message);
}

const requiredVehicleDealPageControls = [
  ['China vehicle export deal desk', 'Vehicle deal page must be branded as the export deal desk'],
  ['function stockIdForVehicle', 'Vehicle deal page must resolve public stock IDs'],
  ['IS_STATIC_PUBLIC_HOST=IS_GITHUB_PAGES', 'Vehicle deal page must route public static hosts through Vercel APIs'],
  ["location.hostname==='cdn.jsdelivr.net'", 'Vehicle deal page must support jsDelivr static hosting'],
  ["location.hostname.endsWith('.pages.dev')", 'Vehicle deal page must support Cloudflare Pages static hosting'],
  ['Export readiness', 'Vehicle deal page must show export readiness'],
  ['Export quote preview', 'Vehicle deal page must show a quote preview'],
  ['Capture NVQ and open WhatsApp', 'Vehicle deal page must capture a quote ID before WhatsApp handoff'],
  ['quoteEstimate', 'Vehicle deal page lead payload must include quote estimate'],
  ['freightEstimate', 'Vehicle deal page lead payload must include freight estimate'],
  ['inspectionOption', 'Vehicle deal page lead payload must include proof/inspection choice'],
  ['docsOption', 'Vehicle deal page lead payload must include document choice'],
  ['vehiclePageUrl', 'Vehicle deal page lead payload must include its public URL'],
  ['trackUrl(leadId)', 'Vehicle deal page must link returned NVQ IDs to tracking'],
];
for (const [snippet, message] of requiredVehicleDealPageControls) {
  if (!vehicleDeal.includes(snippet)) fail(message);
}
if (/vinPrivate|Back-room location|v\.location|vehicleLocation/i.test(vehicleDeal)) {
  fail('Vehicle deal page must not expose private VIN or exact back-room location fields');
}

const requiredShippingMapControls = [
  ['id="global-shipping-map"', 'Post-inventory area must include the full-width global shipping map'],
  ['src="./worldmap.html?embed=1"', 'Shipping map must embed the live Leaflet world map'],
  ['title="New Vision live world shipping route map"', 'Shipping map iframe must have an accessible title'],
  ['allow="geolocation"', 'Shipping map iframe must allow geolocation for the map runtime'],
  ['id="shippingRouteTabs"', 'Shipping map must expose route selector tabs'],
  ['selectShippingRoute', 'Shipping map route board must update selected route details'],
  ['Quote this route', 'Shipping map port cards must route buyers into quote requests'],
  ['shipping-map-panel', 'Shipping map must include the advanced route-board panel'],
  ['id="shippingClock"', 'Shipping map must show a current route-preview timestamp'],
  ['focusShippingMapOnLanding', 'Home page must start at the customer shipping map when loaded without another hash'],
  ["hash && hash !== '#global-shipping-map'", 'Shipping-map landing focus must respect explicit hash deep links'],
  ['Shanghai', 'Shipping map must include Shanghai origin port'],
  ['Jebel Ali', 'Shipping map must include Jebel Ali port'],
  ['Mombasa', 'Shipping map must include Mombasa port'],
  ['Lagos', 'Shipping map must include Lagos port'],
  ['Antwerp', 'Shipping map must include Antwerp port'],
  ['Santos', 'Shipping map must include Santos port'],
  ['Kingston', 'Shipping map must include Caribbean port coverage'],
  ['exact vessel schedules, freight, and ETA are confirmed', 'Shipping map must not pretend the route preview is live AIS tracking'],
  ['id="mapDependencyNote"', 'Shipping map must disclose which map dependencies are local versus external'],
  ['2D tile images still load from CARTO/OpenStreetMap and OpenSeaMap', 'Shipping map must honestly label remaining external tile dependency'],
];
for (const [snippet, message] of requiredShippingMapControls) {
  if (!html.includes(snippet)) fail(message);
}
const inventoryPos = html.indexOf('id="vehicleGrid"');
const shippingMapPos = html.indexOf('id="global-shipping-map"');
const categoriesPos = html.indexOf('<!-- ── CATEGORIES ── -->');
if (inventoryPos < 0 || shippingMapPos < 0 || shippingMapPos < inventoryPos) {
  fail('Customer shipping map must sit directly below the vehicle inventory results');
}
if (categoriesPos > 0 && shippingMapPos > categoriesPos) {
  fail('Customer shipping map must appear before the post-inventory category band');
}
if (html.includes('World Intelligence') || html.includes('Active Shipping Alerts')) {
  fail('Customer page must not expose back-room world-events intelligence');
}
if (html.includes('routemap.html')) {
  fail('Shipping map must use worldmap.html?embed=1, not the old routemap.html surface');
}
if (!fs.existsSync(path.join(ROOT, 'worldmap.html'))) {
  fail('Live world map page is missing: worldmap.html');
}
if (!worldmap.includes('BACK_ROOM_ROLES') || !worldmap.includes('customer-mode') || !portal.includes('worldmap.html?role=admin')) {
  fail('World map must separate customer view from sales/admin back-room intelligence');
}
if (!worldmap.includes('src="./lib/globe.gl.min.js"')) {
  fail('3D globe must use the local World Monitor globe.gl bundle, not a CDN-only runtime');
}
if (!worldmap.includes('href="./lib/leaflet/leaflet.css"') || !worldmap.includes('src="./lib/leaflet/leaflet.js"')) {
  fail('World map must use the local Leaflet runtime instead of a CDN-only runtime');
}
if (/unpkg\.com\/leaflet/.test(worldmap)) {
  fail('World map still hotlinks Leaflet from unpkg');
}
if (!fs.existsSync(path.join(ROOT, 'lib', 'globe.gl.min.js'))) {
  fail('3D globe runtime missing: lib/globe.gl.min.js');
}
for (const leafletFile of ['leaflet.css', 'leaflet.js']) {
  if (!fs.existsSync(path.join(ROOT, 'lib', 'leaflet', leafletFile))) fail(`Leaflet runtime missing: lib/leaflet/${leafletFile}`);
}
for (const texture of ['earth-topo-bathy.jpg', 'night-sky.png']) {
  if (!fs.existsSync(path.join(ROOT, 'textures', texture))) fail(`3D globe texture missing: textures/${texture}`);
}
if (!fs.existsSync(path.join(ROOT, 'img', 'world-map-110m.svg'))) {
  fail('Generated world map asset is missing: img/world-map-110m.svg');
}
if (vercelConfig.includes('(?!api/)')) {
  fail('Vercel header sources must not use unsupported negative lookahead patterns');
}

const requiredBrandCatalogControls = [
  ['href="./brands.html"', 'Main navigation must open the premium brands catalog page'],
  ['id="premiumBrandGrid"', 'Premium brands page must render a brand catalog grid'],
  ['BRAND_META', 'Premium brands page must define brand metadata'],
  ['data/vehicles.json', 'Premium brands page must load the static public vehicle stock file'],
  ["apiUrl('/api/vehicles')", 'Premium brands page must refresh through the Vercel-backed vehicle API on static hosts'],
  ['Sourcing request lane', 'Premium brands page must label missing public stock as sourcing requests'],
  ['newvision.prefillQuote', 'Premium brands page must hand brand quote requests back to the main quote form'],
  ['brands.html?arkedit=1', 'Premium brands page must expose the owner review-editor entry'],
];
for (const [snippet, message] of requiredBrandCatalogControls) {
  if (!(html.includes(snippet) || brands.includes(snippet))) fail(message);
}

const requiredCommunitySafetyControls = [
  ['SUPABASE_SERVICE_ROLE_KEY', 'Community admin post writes must use a deployment env service-role key, never a local .env read'],
  ['missing_supabase_service_role', 'Community API must fail honestly when the server service-role env is not configured'],
  ['Do not read local .env service-role keys', 'Community API must document that local service-role .env reads are not required'],
  ['Authenticated admins can insert posts', 'Supabase schema must restrict direct post inserts instead of open anon writes'],
  ['Authenticated admins can update posts', 'Supabase schema must restrict direct post updates instead of open anon writes'],
];
for (const [snippet, message] of requiredCommunitySafetyControls) {
  if (!(communityApi.includes(snippet) || supabaseSchema.includes(snippet))) fail(message);
}
if (supabaseSchema.includes('create policy "Service can insert posts"   on public.posts for insert with check (true)')
    || supabaseSchema.includes('create policy "Service can update posts"   on public.posts for update using (true)')) {
  fail('Supabase posts policies must not allow open insert/update with public anon key');
}
if (/SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*['"][^'"]+/.test(communityApi)) {
  fail('Community API must not contain a fallback literal Supabase service-role key');
}

const requiredVehicleApiControls = [
  ["require('node:crypto')", 'Vehicles API admin-token comparison must import node:crypto'],
  ['BLOB_KEY', 'Vehicles API must define a Blob storage key'],
  ['allowOverwrite: true', 'Vehicles API must overwrite the inventory blob on save'],
];
for (const [snippet, message] of requiredVehicleApiControls) {
  if (!vehiclesApi.includes(snippet)) fail(message);
}

const requiredUploadApiControls = [
  ["require('node:crypto')", 'Upload API admin-token comparison must import node:crypto'],
  ["require('@vercel/blob')", 'Upload API must use Vercel Blob'],
  ['MAX_BYTES', 'Upload API must enforce file-size limits'],
  ['ALLOWED_TYPES', 'Upload API must restrict uploads to image types'],
  ['await put(pathname, body', 'Upload API must store the uploaded image body in Blob'],
  ['url: blob.url', 'Upload API must return the public image URL to the portal'],
];
for (const [snippet, message] of requiredUploadApiControls) {
  if (!uploadApi.includes(snippet)) fail(message);
}

const requiredSalesPortalControls = [
  ['Andy / Eissa Sales Portal', 'Sales portal must be branded for Andy and Eissa'],
  ['Sales Deal Cockpit', 'Sales portal must clearly explain that it is a deal cockpit'],
  ['id="staffMap"', 'Sales portal must include the advanced staff route map'],
  ['routeCounts', 'Sales portal must aggregate shipment counts by lane'],
  ['ROUTE_META', 'Sales portal must define staff route map lanes'],
  ['id="routeShipments"', 'Sales portal must list shipments for the selected lane'],
  ['id="vehicleEditor"', 'Sales portal must let staff add and edit vehicle inventory'],
  ['saveVehicleRecord', 'Sales portal must persist vehicle add/edit changes'],
  ['archiveVehicleRecord', 'Sales portal must archive/delete vehicle records'],
  ['markVehicleSold', 'Sales portal must mark older vehicles as SOLD from the page'],
  ['id="soldInventory"', 'Sales portal must show sold inventory by salesperson'],
  ['id="salesTeamList"', 'Sales portal must show salesperson profiles and payout references'],
  ['saveSalesperson', 'Sales portal must let the team add/update salesperson profiles'],
  ['archiveSalesperson', 'Sales portal must archive salesperson profiles instead of deleting commission history'],
  ['maskedBankAccount', 'Sales portal must mask payout account data on screen'],
  ['Back-room location', 'Sales portal must show exact vehicle location only in staff back-room context'],
  ['vinPrivate', 'Sales portal must expose private VIN/frame only to staff'],
  ['copyScript', 'Sales portal must provide a copy-ready WhatsApp sales script'],
  ['copyDealSummary', 'Sales portal must provide a copy-ready deal summary'],
  ['sessionStorage.getItem(SESSION_KEY)', 'Sales portal must use bearer session auth instead of public data access'],
  ["api('sales-dashboard')", 'Sales portal must use the limited sales dashboard, not owner finance dashboard'],
  ['id="ownerPortalLink"', 'Sales portal must hide the owner portal link unless an owner/master is signed in'],
  ["fetch(apiUrl('/api/vehicles')", 'Sales portal must read the full vehicle list from the Vercel-backed API'],
  ['Quote estimate', 'Sales portal must surface buyer quote-preview estimates'],
  ['Freight estimate', 'Sales portal must surface buyer freight estimates'],
  ['Proof choice', 'Sales portal must surface buyer inspection/proof choices'],
  ['Vehicle page', 'Sales portal must surface the public vehicle deal page URL'],
];
for (const [snippet, message] of requiredSalesPortalControls) {
  if (!sales.includes(snippet)) fail(message);
}
const requiredOwnerSalesControls = [
  ['id="openSalesViewBtn"', 'Owner portal must let owner/master inspect the sales view'],
  ["user.role === 'sales'", 'Owner portal must redirect sales users out of owner-only panels'],
  ['id="ownerSalesDesk"', 'Owner portal must include an owner-only sales oversight panel'],
  ['Sales portal oversight', 'Owner sales panel must be clearly labeled as oversight, not the staff portal itself'],
  ['Quote estimate', 'Owner sales panel must surface buyer quote-preview estimates'],
  ['Freight estimate', 'Owner sales panel must surface buyer freight estimates'],
  ['Proof choice', 'Owner sales panel must surface buyer inspection/proof choices'],
  ['Vehicle page', 'Owner sales panel must surface the public vehicle deal page URL'],
];
for (const [snippet, message] of requiredOwnerSalesControls) {
  if (!portal.includes(snippet)) fail(message);
}
if (html.includes('vehicleLocation(v)</div>')) {
  fail('Customer-facing vehicle card must not expose exact vehicleLocation(v)');
}
if (html.includes("['Location',vehicleLocation(v)]")) {
  fail('Customer-facing modal specs must not expose exact back-room vehicle location');
}
if (html.includes('Yiwu / Shanghai export lane')) {
  fail('Customer-facing site must use public lane wording instead of exact back-room location fallback');
}

const requiredChinaMirrorControls = [
  ['href="./favicon.svg"', 'GitHub mirror must use a relative favicon path'],
  ['href="./manifest.webmanifest"', 'GitHub mirror must use a relative manifest path'],
  ['"start_url": "./"', 'Manifest must use a relative start URL for GitHub Pages'],
  ['"src": "./favicon.svg"', 'Manifest icon must use a relative path for GitHub Pages'],
  ['translate.google.com', 'Google Translate external script must not be required for core language support'],
];
if (!html.includes(requiredChinaMirrorControls[0][0])) fail(requiredChinaMirrorControls[0][1]);
if (!html.includes(requiredChinaMirrorControls[1][0])) fail(requiredChinaMirrorControls[1][1]);
const manifest = fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8');
if (!manifest.includes(requiredChinaMirrorControls[2][0])) fail(requiredChinaMirrorControls[2][1]);
if (!manifest.includes(requiredChinaMirrorControls[3][0])) fail(requiredChinaMirrorControls[3][1]);
if (html.includes(requiredChinaMirrorControls[4][0])) fail(requiredChinaMirrorControls[4][1]);

const portalApi = fs.readFileSync(path.join(ROOT, 'api', 'portal.js'), 'utf8');
const leadApi = fs.readFileSync(path.join(ROOT, 'api', 'lead.js'), 'utf8');
const track = fs.readFileSync(path.join(ROOT, 'track.html'), 'utf8');
for (const [snippet, message] of [
  ['Access-Control-Allow-Headers\', \'Content-Type, Authorization', 'Portal API CORS must allow bearer sessions from GitHub Pages'],
  ['sessionToken', 'Portal API must return a session token for GitHub portal mode'],
  ["andy: { name: 'Andy', role: 'sales' }", 'Andy must be a sales role, not an owner role'],
  ["eissa: { name: 'Eissa', role: 'sales' }", 'Eissa must be a sales role, not an owner role'],
  ["action === 'sales-dashboard'", 'Portal API must expose a limited sales dashboard'],
  ["if (!isOwnerRole(u)) return send(res, 403", 'Owner-only API actions must reject sales users'],
  ['NVS-', 'Shipment IDs must use the NVS prefix'],
  ['kind: \'vehicle\'', 'Tracking API must accept public stock IDs'],
  ['kind: \'quote\'', 'Tracking API must accept public quote IDs'],
]) {
  if (!portalApi.includes(snippet)) fail(message);
}
const requiredSalesOpsApiControls = [
  ['sales-ops', 'Portal API must expose encrypted sales ops data for the sales portal'],
  ['salesperson-save', 'Portal API must save salesperson profiles'],
  ['salesperson-archive', 'Portal API must archive salesperson profiles'],
  ['vehicle-save', 'Portal API must save staff inventory edits'],
  ['vehicle-archive', 'Portal API must archive/delete staff inventory records'],
  ['vehicle-sold', 'Portal API must record sold vehicles and salesperson commission'],
  ['maskedBankAccount', 'Portal API must mask payout account data before returning it'],
];
for (const [snippet, message] of requiredSalesOpsApiControls) {
  if (!portalApi.includes(snippet)) fail(message);
}
for (const [snippet, message] of [
  ['NVQ-', 'Lead capture must generate public quote IDs'],
  ['leadId', 'Lead API must return the generated quote ID'],
  ['stockId', 'Lead API must preserve public stock IDs'],
  ['quoteEstimate', 'Lead API must preserve quote estimates'],
  ['freightEstimate', 'Lead API must preserve freight estimates'],
  ['inspectionOption', 'Lead API must preserve inspection choices'],
  ['docsOption', 'Lead API must preserve document choices'],
  ['vehiclePageUrl', 'Lead API must preserve vehicle deal page URLs'],
]) {
  if (!leadApi.includes(snippet)) fail(message);
}
for (const [snippet, message] of [
  ['Stock IDs start with NV, quote IDs start with NVQ, and booked shipments start with NVS', 'Tracking page must explain stock, quote, and shipment ID formats'],
  ['Quote ID found. Sales has the buyer, vehicle, destination port, estimate request, and proof/docs choices', 'Tracking page must explain captured quote IDs'],
  ['IS_STATIC_PUBLIC_HOST=IS_GITHUB_PAGES', 'Tracking page must route public static hosts through Vercel APIs'],
  ['API_BASE+API', 'Tracking page must call Vercel APIs from static public hosts'],
]) {
  if (!track.includes(snippet)) fail(message);
}
for (const [name, text] of [
  ['sales.html', sales],
  ['portal.html', portal],
]) {
  if (!text.includes('IS_STATIC_PUBLIC_HOST')) fail(`${name} must route public static hosts through the Vercel API base`);
  if (!text.includes("location.hostname==='cdn.jsdelivr.net'") && !text.includes("location.hostname === 'cdn.jsdelivr.net'")) fail(`${name} must support jsDelivr static hosting`);
  if (!text.includes("location.hostname.endsWith('.pages.dev')")) fail(`${name} must support Cloudflare Pages static hosting`);
}

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
