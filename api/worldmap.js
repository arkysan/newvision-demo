// New Vision World Map — comprehensive intelligence API
// Sources: AISStream (free key), GDELT, GDACS, USGS, NASA EONET, IMF PortWatch, OFAC, ACLED
// All sources have graceful fallback — works with zero keys via static data + free no-auth APIs
const store = require('../lib/store');

const AISSTREAM_KEY = process.env.AISSTREAM_KEY || '';
const ACLED_KEY     = process.env.ACLED_KEY     || '';
const ALLOWED = new Set([
  'https://arkysan.github.io','https://newvision-demo.vercel.app',
  'http://localhost:52452','http://127.0.0.1:52452',
]);

// ─── ROUTE WAYPOINTS ────────────────────────────────────────────────────────
const ROUTE_WP = {
  mombasa:  [[31.23,121.47],[1.30,103.82],[-8.0,55.0],[-4.05,39.67]],
  jebel:    [[31.23,121.47],[1.30,103.82],[4.5,72.0],[22.0,60.0],[25.01,55.09]],
  lagos:    [[31.23,121.47],[1.30,103.82],[-34.0,18.5],[-1.0,5.0],[6.45,3.40]],
  antwerp:  [[31.23,121.47],[22.3,113.8],[1.30,103.82],[4.5,72.0],[12.0,44.0],[30.0,32.3],[36.5,14.0],[51.23,4.40]],
  santos:   [[31.23,121.47],[1.30,103.82],[-34.0,18.5],[-23.94,-46.31]],
  kingston: [[31.23,121.47],[22.3,113.8],[9.1,-79.7],[17.98,-76.79]],
  durban:   [[31.23,121.47],[1.30,103.82],[-29.87,31.03]],
};

const NV_PORTS = {
  Shanghai:  { lat:31.23,  lon:121.47, locode:'CNSHA', region:'China (Origin)' },
  Mombasa:   { lat:-4.05,  lon:39.67,  locode:'KEMBA', region:'East Africa' },
  'Jebel Ali':{ lat:25.01, lon:55.09,  locode:'AEJEA', region:'Gulf / Middle East' },
  Lagos:     { lat:6.45,   lon:3.40,   locode:'NGLOS', region:'West Africa' },
  Antwerp:   { lat:51.23,  lon:4.40,   locode:'BEANT', region:'Europe' },
  Santos:    { lat:-23.94, lon:-46.31, locode:'BRSSZ', region:'Latin America' },
  Kingston:  { lat:17.98,  lon:-76.79, locode:'JMKIN', region:'Caribbean' },
  Durban:    { lat:-29.87, lon:31.03,  locode:'ZADUR', region:'Southern Africa' },
};

// ─── STATIC RISK ZONES (always shown) ────────────────────────────────────────
const STATIC_ZONES = [
  { id:'red-sea',      name:'Red Sea — Houthi Attacks',            lat:15.5,  lon:43.0,  radius:420, severity:'critical', type:'conflict',   detail:'Houthi anti-shipping attacks ongoing since Nov 2023. Most carriers re-routing via Cape (+10–14 days).', affect:'Jebel Ali, Antwerp, Europe' },
  { id:'gulf-aden',    name:'Gulf of Aden',                         lat:12.0,  lon:48.5,  radius:360, severity:'critical', type:'conflict',   detail:'Yemen/Houthi spillover. Armed escort recommended.', affect:'Jebel Ali, Mombasa' },
  { id:'somali-basin', name:'Somali Basin / NW Indian Ocean',       lat:7.5,   lon:54.0,  radius:520, severity:'high',    type:'piracy',     detail:'Residual Somali piracy. Maintain BMP5 protocols.', affect:'Mombasa, East Africa' },
  { id:'gulf-guinea',  name:'Gulf of Guinea — West Africa',         lat:2.5,   lon:3.0,   radius:620, severity:'high',    type:'piracy',     detail:'Highest global piracy rate. Armed robbery and kidnapping off Nigeria/Benin/Togo.', affect:'Lagos, West Africa' },
  { id:'malacca',      name:'Strait of Malacca',                    lat:3.0,   lon:102.0, radius:200, severity:'medium',  type:'piracy',     detail:'All NV departures transit here. Petty theft and low-level piracy.', affect:'All routes from Shanghai' },
  { id:'black-sea',    name:'Black Sea — Russia/Ukraine War',       lat:43.5,  lon:33.0,  radius:380, severity:'critical', type:'conflict',  detail:'Active war zone. Mine hazard. Most commercial shipping suspended.', affect:'None (NV does not route here)' },
  { id:'taiwan-strait',name:'Taiwan Strait — Geopolitical Tension', lat:24.5,  lon:120.5, radius:180, severity:'medium',  type:'tension',    detail:'Elevated military tension. Currently open to commercial traffic.', affect:'Shanghai departure routes' },
  { id:'suez-canal',   name:'Suez Canal — Reduced Traffic',         lat:30.5,  lon:32.3,  radius:90,  severity:'medium',  type:'congestion', detail:'~40% pre-crisis volume. Red Sea re-routing means longer queues for remaining traffic.', affect:'Europe, Antwerp via Suez' },
  { id:'hormuz',       name:'Strait of Hormuz',                     lat:26.6,  lon:56.3,  radius:130, severity:'medium',  type:'tension',    detail:'Iran-regional tension. Strait remains open. Risk of flag-based interdiction.', affect:'Jebel Ali, Gulf routes' },
];

// ─── ROUTE RISK WEIGHTS (static, per route) ──────────────────────────────────
const ROUTE_BASE_RISK = {
  mombasa:  { piracy:35, conflict:20, congestion:5,  natural:5  },
  jebel:    { piracy:15, conflict:55, congestion:10, natural:5  },
  lagos:    { piracy:55, conflict:20, congestion:10, natural:5  },
  antwerp:  { piracy:5,  conflict:30, congestion:15, natural:5  },
  santos:   { piracy:10, conflict:5,  congestion:10, natural:10 },
  kingston: { piracy:10, conflict:5,  congestion:5,  natural:20 },
  durban:   { piracy:15, conflict:5,  congestion:5,  natural:5  },
};

// WORLDMONITOR deep-link per route
const WM_LINKS = {
  mombasa:  'https://www.worldmonitor.app/?lat=-1&lon=72&zoom=2.5&view=global&timeRange=7d&layers=conflicts%2Cais%2Cwaterways%2Chotspots',
  jebel:    'https://www.worldmonitor.app/?lat=18&lon=58&zoom=2.5&view=global&timeRange=7d&layers=conflicts%2Cais%2Cwaterways%2CiranAttacks%2Csanctions',
  lagos:    'https://www.worldmonitor.app/?lat=2&lon=12&zoom=2.5&view=global&timeRange=7d&layers=conflicts%2Cais%2Chotspots%2Cwaterways',
  antwerp:  'https://www.worldmonitor.app/?lat=30&lon=32&zoom=2.5&view=global&timeRange=7d&layers=conflicts%2Cais%2Cwaterways%2Csanctions%2CtradeRoutes',
  santos:   'https://www.worldmonitor.app/?lat=-10&lon=-20&zoom=2.5&view=global&timeRange=7d&layers=ais%2Cwaterways%2CtradeRoutes',
  kingston: 'https://www.worldmonitor.app/?lat=15&lon=-78&zoom=3&view=global&timeRange=7d&layers=ais%2Cwaterways%2CtradeRoutes%2Cnatural',
  durban:   'https://www.worldmonitor.app/?lat=-20&lon=35&zoom=2.5&view=global&timeRange=7d&layers=conflicts%2Cais%2Cwaterways%2Chotspots',
};

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────
function haversineNM(a, b) {
  const R=3440.065, f1=a[0]*Math.PI/180, f2=b[0]*Math.PI/180;
  const df=(b[0]-a[0])*Math.PI/180, dl=(b[1]-a[1])*Math.PI/180;
  return R*2*Math.atan2(Math.sqrt(Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2),Math.sqrt(1-(Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2)));
}
function routeBbox(wps, buf=6) {
  const lats=wps.map(p=>p[0]), lons=wps.map(p=>p[1]);
  return { minLat:Math.min(...lats)-buf, maxLat:Math.max(...lats)+buf, minLon:Math.min(...lons)-buf, maxLon:Math.max(...lons)+buf };
}
function destToRouteKey(dest) {
  const d=String(dest||'').toLowerCase();
  if(d.includes('mombasa'))                     return 'mombasa';
  if(d.includes('jebel')||d.includes('dubai')) return 'jebel';
  if(d.includes('lagos')||d.includes('apapa')) return 'lagos';
  if(d.includes('antwerp')||d.includes('rotterdam')||d.includes('hamburg')) return 'antwerp';
  if(d.includes('santos')||d.includes('brazil')) return 'santos';
  if(d.includes('kingston'))                    return 'kingston';
  if(d.includes('durban'))                      return 'durban';
  return null;
}
function totalRouteNM(wps) { let t=0; for(let i=0;i<wps.length-1;i++) t+=haversineNM(wps[i],wps[i+1]); return t; }
function interpolateRoute(wps, traveled) {
  let rem=traveled;
  for(let i=0;i<wps.length-1;i++){
    const seg=haversineNM(wps[i],wps[i+1]);
    if(rem<=seg){ const f=rem/seg; return [wps[i][0]+(wps[i+1][0]-wps[i][0])*f, wps[i][1]+(wps[i+1][1]-wps[i][1])*f]; }
    rem-=seg;
  }
  return wps[wps.length-1];
}
function estimatePosition(s) {
  const rk=destToRouteKey(s.dest||s.route||''); if(!rk) return null;
  const wp=ROUTE_WP[rk];
  const dep=s.departure?new Date(s.departure):null; if(!dep||isNaN(dep)) return null;
  const elapsed=(Date.now()-dep.getTime())/3600000; if(elapsed<0) return null;
  const avgKn=12, traveledNM=Math.min(elapsed*avgKn, totalRouteNM(wp));
  const [lat,lon]=interpolateRoute(wp,traveledNM);
  const totalNM=totalRouteNM(wp), remNM=Math.max(0,totalNM-traveledNM);
  return { lat,lon, estimated:true, traveledNM:Math.round(traveledNM), remainingNM:Math.round(remNM),
    totalNM:Math.round(totalNM), progressPct:Math.round(traveledNM/totalNM*100),
    etaDate:new Date(Date.now()+remNM/avgKn*3600000).toISOString(),
    elapsedDays:Math.round(elapsed/24), avgSpeedKn:avgKn };
}

// ─── LIVE DATA FETCHERS (all with timeouts + graceful fail) ──────────────────

async function fetchGDACS() {
  try {
    const today = new Date(), week = new Date(today-7*864e5);
    const fmt = d => d.toISOString().slice(0,10);
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=&fromDate=${fmt(week)}&toDate=${fmt(today)}&alertlevel=orange,red&limit=20`;
    const r = await fetch(url, { signal:AbortSignal.timeout(6000), headers:{'Accept':'application/json'} });
    if(!r.ok) return [];
    const d = await r.json();
    const items = (d.features||d.results||[]);
    return items.slice(0,15).map(f => {
      const p=f.properties||f; const g=f.geometry||{};
      return {
        id:'gdacs-'+(p.eventid||Math.random().toString(36).slice(2)),
        name: `${p.eventtype||'Event'}: ${p.country||p.name||''}`,
        lat: g.coordinates?g.coordinates[1]:(p.latitude||0),
        lon: g.coordinates?g.coordinates[0]:(p.longitude||0),
        type: (p.eventtype||'').toLowerCase().includes('tc')?'natural':
              (p.eventtype||'').toLowerCase().includes('eq')?'natural':'natural',
        severity: p.alertlevel==='Red'?'high':'medium',
        detail: (p.htmldescription||p.description||p.name||'GDACS alert').replace(/<[^>]+>/g,'').slice(0,200),
        date: p.fromdate||new Date().toISOString(),
        source:'gdacs',
      };
    }).filter(e=>e.lat&&e.lon);
  } catch(_){ return []; }
}

async function fetchUSGS() {
  try {
    const start=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
    const url=`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&limit=20&starttime=${start}&orderby=magnitude`;
    const r=await fetch(url,{signal:AbortSignal.timeout(6000)});
    if(!r.ok) return [];
    const d=await r.json();
    return (d.features||[]).slice(0,12).map(f=>({
      id:'usgs-'+f.id, name:`M${f.properties.mag} Earthquake: ${(f.properties.place||'').slice(0,60)}`,
      lat:f.geometry.coordinates[1], lon:f.geometry.coordinates[0],
      type:'natural', severity:f.properties.mag>=6.5?'high':'medium',
      detail:`Magnitude ${f.properties.mag} earthquake. Depth ${f.geometry.coordinates[2]}km. ${(f.properties.place||'')}`,
      date:new Date(f.properties.time).toISOString(), source:'usgs',
    })).filter(e=>e.lat&&e.lon);
  } catch(_){ return []; }
}

async function fetchEONET() {
  try {
    const r=await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25&days=7',{signal:AbortSignal.timeout(6000)});
    if(!r.ok) return [];
    const d=await r.json();
    return (d.events||[]).slice(0,15).map(ev=>{
      const geo=ev.geometry?.[0]; if(!geo) return null;
      return {
        id:'eonet-'+ev.id, name:ev.title, type:'natural', severity:'medium',
        lat:geo.coordinates[1], lon:geo.coordinates[0],
        detail:`${ev.categories?.[0]?.title||'Natural event'} — ${ev.title}`,
        date:geo.date||new Date().toISOString(), source:'eonet',
      };
    }).filter(Boolean);
  } catch(_){ return []; }
}

async function fetchGDELT(routeKey) {
  try {
    const queries = {
      mombasa: 'piracy+attack+ship+Somalia+Kenya', jebel: 'Houthi+ship+attack+Red+Sea+Yemen',
      lagos: 'piracy+attack+Gulf+Guinea+Nigeria', antwerp: 'shipping+disruption+Suez+Europe',
      santos: 'shipping+South+America+port', kingston: 'shipping+Caribbean+hurricane',
      durban: 'shipping+South+Africa+port',
    };
    const q=encodeURIComponent(queries[routeKey]||'shipping+maritime+conflict+piracy');
    const url=`https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=15&format=json&timespan=7d&sourcelang=english`;
    const r=await fetch(url,{signal:AbortSignal.timeout(7000)});
    if(!r.ok) return [];
    const d=await r.json();
    return (d.articles||[]).slice(0,8).map((a,i)=>({
      id:'gdelt-'+i+'-'+a.seendate,
      name:a.title||'Shipping intelligence report',
      lat:null, lon:null, type:'news', severity:'low',
      detail:(a.title||'').slice(0,180),
      url:a.url, source:'gdelt', date:a.seendate,
    }));
  } catch(_){ return []; }
}

async function fetchPortWatch(locode) {
  try {
    // IMF PortWatch ArcGIS REST endpoint
    const url=`https://portwatch.imf.org/server/rest/services/hosted/portwatch_portcalls_v2/FeatureServer/0/query`+
      `?where=portlocode%3D'${locode}'&outFields=*&resultRecordCount=7&orderByFields=week+DESC&f=json`;
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});
    if(!r.ok) return null;
    const d=await r.json();
    if(!d.features||!d.features.length) return null;
    const latest=d.features[0].attributes, prev=d.features[3]?.attributes;
    const calls=latest.total_portcalls, baseline=prev?.total_portcalls||calls;
    const pct=Math.round(calls/Math.max(baseline,1)*100);
    return { calls, baseline, pct, week:latest.week, source:'portwatch' };
  } catch(_){ return null; }
}

// ─── ROUTE RISK BRIEF ─────────────────────────────────────────────────────────
async function buildBrief(routeKey, shipment) {
  const wp=ROUTE_WP[routeKey]; if(!wp) return null;
  const bbox=routeBbox(wp);
  const base=ROUTE_BASE_RISK[routeKey]||{ piracy:10, conflict:10, congestion:5, natural:5 };

  // Parallel fetches
  const [gdacs, usgs, eonet] = await Promise.all([
    fetchGDACS(), fetchUSGS(), fetchEONET(),
  ]);

  // Filter events inside route corridor
  function inBox(e){ return e.lat&&e.lon&&e.lat>=bbox.minLat&&e.lat<=bbox.maxLat&&e.lon>=bbox.minLon&&e.lon<=bbox.maxLon; }
  const nearRoute = [...gdacs.filter(inBox), ...usgs.filter(inBox), ...eonet.filter(inBox)];

  // Static zones: on route by waypoint proximity OR listed in zone's affect field
  const destNames=[routeKey, Object.keys(NV_PORTS).find(n=>n.toLowerCase().includes(routeKey))||''];
  const zonesOnRoute = STATIC_ZONES.filter(z => {
    const nearWp  = wp.some(p => haversineNM(p,[z.lat,z.lon]) < z.radius);
    const inAffect= z.affect && destNames.some(n => n && z.affect.toLowerCase().includes(n.toLowerCase()));
    return nearWp || inAffect;
  });

  // Score calculation
  let piracyScore    = base.piracy;
  let conflictScore  = base.conflict;
  let naturalScore   = base.natural;
  let congestionScore= base.congestion;

  zonesOnRoute.forEach(z => {
    if(z.type==='piracy')    piracyScore    = Math.min(100, piracyScore   + (z.severity==='critical'?25:z.severity==='high'?15:8));
    if(z.type==='conflict')  conflictScore  = Math.min(100, conflictScore + (z.severity==='critical'?30:z.severity==='high'?18:10));
    if(z.type==='congestion')congestionScore= Math.min(100, congestionScore+ 10);
  });
  nearRoute.forEach(e => {
    if(e.type==='natural') naturalScore = Math.min(100, naturalScore + (e.severity==='high'?20:10));
    if(e.type==='conflict')conflictScore= Math.min(100, conflictScore + 12);
  });

  const overall = Math.round((piracyScore*0.3 + conflictScore*0.35 + naturalScore*0.2 + congestionScore*0.15));
  const label   = overall>=75?'CRITICAL':overall>=50?'HIGH':overall>=25?'MODERATE':'LOW';
  const color   = overall>=75?'#e53935':overall>=50?'#FF8F00':overall>=25?'#FDD835':'#43A047';

  // ETA impact
  let etaImpact = 0;
  if(zonesOnRoute.some(z=>z.id==='red-sea')) etaImpact += 14;
  if(zonesOnRoute.some(z=>z.id==='gulf-aden')) etaImpact += 3;
  if(nearRoute.some(e=>e.type==='natural'&&e.severity==='high')) etaImpact += 2;
  if(congestionScore > 50) etaImpact += 3;

  return {
    routeKey, overall, label, color,
    scores:{ piracy:piracyScore, conflict:conflictScore, natural:naturalScore, congestion:congestionScore },
    zonesOnRoute: zonesOnRoute.map(z=>({id:z.id,name:z.name,severity:z.severity,type:z.type,affect:z.affect})),
    nearRouteEvents: nearRoute.slice(0,6),
    etaImpactDays: etaImpact,
    etaNote: etaImpact>0?`+${etaImpact} days estimated due to active disruptions`:'No significant ETA impact detected',
    worldmonitorUrl: WM_LINKS[routeKey]||WM_LINKS.mombasa,
    recommendations: buildRecommendations(routeKey, zonesOnRoute, overall),
    generatedAt: new Date().toISOString(),
  };
}

function buildRecommendations(routeKey, zones, score) {
  const recs=[];
  if(zones.some(z=>z.id==='red-sea'||z.id==='gulf-aden'))
    recs.push('Route via Cape of Good Hope recommended. Avoid Suez/Red Sea corridor. Add 10–14 days to ETA.');
  if(zones.some(z=>z.id==='gulf-guinea'))
    recs.push('Advise carrier to use armed security escort approaching Lagos. Maintain radio watch on VHF 16.');
  if(zones.some(z=>z.id==='somali-basin'))
    recs.push('Maintain BMP5 anti-piracy measures. Register voyage with MSCHOA. Use recommended transit corridor.');
  if(zones.some(z=>z.id==='malacca'))
    recs.push('Malacca transit: maintain watch, secure accessible equipment, complete IMO voyage plan.');
  if(score>=75)
    recs.push('HIGH RISK: Confirm war risk insurance coverage before vessel departs. Notify client of potential delay.');
  if(score>=50&&score<75)
    recs.push('Moderate risk: monitor daily. Brief client on possible 3–7 day delay scenario.');
  if(!recs.length) recs.push('Standard precautions apply. No active high-severity alerts on this corridor.');
  return recs;
}

// ─── AISStream WebSocket lookup (free, Node 22+ native WS) ───────────────────
async function lookupAISStream(mmsi) {
  if(!AISSTREAM_KEY||!mmsi) return null;
  const mmsiStr=String(mmsi).replace(/\D/g,''); if(mmsiStr.length<9) return null;
  return new Promise(resolve=>{
    let done=false;
    const to=setTimeout(()=>{ if(!done){done=true;try{ws.close();}catch(_){}resolve(null);} },6000);
    let ws;
    try{ ws=new WebSocket('wss://stream.aisstream.io/v0/stream'); }
    catch(_){ clearTimeout(to);resolve(null);return; }
    ws.addEventListener('open',()=>ws.send(JSON.stringify({APIkey:AISSTREAM_KEY,BoundingBoxes:[[[-90,-180],[90,180]]],FiltersShipMMSI:[mmsiStr],FilterMessageTypes:['PositionReport']})));
    ws.addEventListener('message',ev=>{ try{
      const msg=JSON.parse(ev.data);
      if(msg.MessageType==='PositionReport'&&!done){
        done=true;clearTimeout(to);try{ws.close();}catch(_){}
        const p=msg.Message.PositionReport;
        resolve({mmsi:mmsiStr,lat:p.Latitude,lon:p.Longitude,speed:p.Sog,heading:p.TrueHeading!==511?p.TrueHeading:p.Cog,lastUpdate:new Date().toISOString(),source:'aisstream'});
      }
    }catch(_){} });
    ws.addEventListener('error',()=>{ if(!done){done=true;clearTimeout(to);resolve(null);} });
    ws.addEventListener('close',()=>{ if(!done){done=true;clearTimeout(to);resolve(null);} });
  });
}

function embedUrls(imo,mmsi){
  const im=String(imo||'').replace(/\D/g,''), ms=String(mmsi||'').replace(/\D/g,'');
  return {
    vesselfinderUrl:   ms?`https://www.vesselfinder.com/?mmsi=${ms}`:null,
    vesselfinderWidget:ms?`https://www.vesselfinder.com/widget2?mmsi=${ms}&zoom=8&width=100%25&height=320&names=true`:null,
    myshiptrackingUrl: im?`https://www.myshiptracking.com/vessels/imo-${im}`:ms?`https://www.myshiptracking.com/vessels/mmsi-${ms}`:null,
    marinetrafficUrl:  im?`https://www.marinetraffic.com/en/ais/details/ships/imo:${im}`:null,
  };
}

// ─── CORS + UTILS ─────────────────────────────────────────────────────────────
function setCors(req,res){
  const o=req.headers.origin||'';
  res.setHeader('Access-Control-Allow-Origin',ALLOWED.has(o)?o:'https://newvision-demo.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials','true');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Vary','Origin');
}
function send(res,status,body){ res.statusCode=status; res.setHeader('Content-Type','application/json;charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); }

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  setCors(req,res);
  if(req.method==='OPTIONS'){ res.statusCode=204;res.end();return; }
  let p; try{ p=new URL(req.url,'http://x').searchParams; }catch(_){return send(res,400,{ok:false,error:'Bad request'});}
  const action=p.get('action')||'', q=(p.get('q')||'').trim();

  // ── VESSEL LOOKUP ────────────────────────────────────────────────────────
  if(action==='vessel'){
    if(!q) return send(res,400,{ok:false,error:'Query required'});
    if(/^NVS-/i.test(q)){
      let shipments=[];
      try{ shipments=(await store.loadJSON('shipments'))||[]; }catch(_){}
      const s=shipments.find(x=>(x.code||'').toUpperCase()===q.toUpperCase());
      if(!s) return send(res,404,{ok:false,error:`Shipment ${q} not found. Confirm code with your sales contact.`});
      let livePos=null;
      if(AISSTREAM_KEY&&s.mmsi) livePos=await lookupAISStream(s.mmsi).catch(()=>null);
      const estPos=livePos?null:estimatePosition(s);
      const rk=destToRouteKey(s.dest||s.route||'');
      const destKey=Object.entries(NV_PORTS).find(([n])=>(s.dest||'').toLowerCase().includes(n.toLowerCase()));
      return send(res,200,{ok:true,source:livePos?'aisstream':'estimated',
        shipment:{code:s.code,vehicle:s.vehicle,vessel:s.vessel,imo:s.imo,mmsi:s.mmsi,origin:s.origin||'Shanghai',dest:s.dest||s.route||'—',status:s.status,eta:s.eta,departure:s.departure||s.bookedAt||null},
        position:livePos||estPos,destCoords:destKey?{lat:destKey[1].lat,lon:destKey[1].lon}:null,
        worldmonitorUrl:rk?WM_LINKS[rk]:null, routeKey:rk,
        ...embedUrls(s.imo,s.mmsi), hasLiveAIS:!!AISSTREAM_KEY});
    }
    const ms=q.replace(/\D/g,'');
    let livePos=null;
    if(AISSTREAM_KEY&&ms.length>=9) livePos=await lookupAISStream(ms).catch(()=>null);
    return send(res,200,{ok:true,source:livePos?'aisstream':'embed',position:livePos,...embedUrls(q.replace(/\D/g,''),ms),hasLiveAIS:!!AISSTREAM_KEY});
  }

  // ── WORLD EVENTS ────────────────────────────────────────────────────────
  if(action==='events'){
    const routeKey=p.get('route')||'';
    const [gdacs,usgs,eonet,gdelt] = await Promise.all([
      fetchGDACS(), fetchUSGS(), fetchEONET(),
      routeKey?fetchGDELT(routeKey):Promise.resolve([]),
    ]);
    let acledEvents=[];
    if(ACLED_KEY){
      try{
        const r=await fetch(`https://api.acleddata.com/acled/read?key=${ACLED_KEY}&email=map@newvision.nv&event_type=Explosions%2FRemote%20violence&region=4,5,7&fields=event_date,event_type,country,location,latitude,longitude,notes&limit=12`,{signal:AbortSignal.timeout(5000)});
        if(r.ok){const d=await r.json();acledEvents=(d.data||[]).map(e=>({id:'acled-'+(e.event_id_cnty||Math.random()),name:`${e.country}: ${e.location}`,lat:parseFloat(e.latitude),lon:parseFloat(e.longitude),type:'conflict',severity:'medium',detail:(e.notes||e.event_type||'').slice(0,200),date:e.event_date,source:'acled'})).filter(e=>e.lat&&e.lon);}
      }catch(_){}
    }
    return send(res,200,{ok:true,zones:STATIC_ZONES,events:[...gdacs,...usgs,...eonet,...acledEvents,...gdelt],ts:Date.now(),sources:{gdacs:gdacs.length,usgs:usgs.length,eonet:eonet.length,acled:acledEvents.length,gdelt:gdelt.length}});
  }

  // ── PORT STATUS ──────────────────────────────────────────────────────────
  if(action==='ports'){
    const STATIC_STATUS={
      Shanghai:{status:'operational',note:'Origin hub — normal ops.'},
      Mombasa:{status:'operational',note:'Normal ops. SGR rail link to Nairobi.'},
      'Jebel Ali':{status:'caution',note:'Gulf hub. Hormuz tension nearby.'},
      Lagos:{status:'caution',note:'Gulf of Guinea piracy zone proximity.'},
      Antwerp:{status:'operational',note:'Red Sea re-routing adds 10–14 days.'},
      Santos:{status:'operational',note:'Cape route unaffected.'},
      Kingston:{status:'operational',note:'Hurricane season Jun–Nov, monitor.'},
      Durban:{status:'operational',note:'Cape route alternative. Normal ops.'},
    };
    const ports=await Promise.all(Object.entries(NV_PORTS).map(async([name,p])=>{
      const pw=await fetchPortWatch(p.locode).catch(()=>null);
      const st=STATIC_STATUS[name]||{status:'operational',note:''};
      let portStatus=st.status, note=st.note;
      if(pw){ note=`${pw.calls} vessel calls (${pw.pct}% of baseline)`+(pw.pct<70?' — below normal, possible disruption':''); portStatus=pw.pct<60?'caution':'operational'; }
      return {name,...p,...st,status:portStatus,note,portwatch:pw};
    }));
    return send(res,200,{ok:true,ports,hasLiveAIS:!!AISSTREAM_KEY,hasACLED:!!ACLED_KEY});
  }

  // ── ROUTE RISK BRIEF ────────────────────────────────────────────────────
  if(action==='brief'){
    const from=p.get('from')||'Shanghai', to=p.get('to')||'';
    const rk=destToRouteKey(to);
    if(!rk) return send(res,400,{ok:false,error:`Unknown destination: ${to}. Use a port name like Mombasa, Jebel Ali, Lagos, Antwerp, Santos, Kingston.`});
    const brief=await buildBrief(rk,{dest:to});
    return send(res,200,{ok:true,...brief,from,to});
  }

  send(res,400,{ok:false,error:`Unknown action: ${action}`});
};
