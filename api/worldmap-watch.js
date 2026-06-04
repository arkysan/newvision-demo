// New Vision World Map Watchboard — Vercel Cron (runs every 6 hours)
// Checks all active shipments against live threat intelligence
// Sends Telegram alert if any shipment is near an active risk event
const store = require('../lib/store');

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  || '';
const CHAT_ID    = process.env.TELEGRAM_CHAT_ID    || '';
const VERCEL_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://newvision-demo.vercel.app';

// ── MATH HELPERS ──────────────────────────────────────────────────────────────
const ROUTE_WP = {
  mombasa:  [[31.23,121.47],[1.30,103.82],[-8.0,55.0],[-4.05,39.67]],
  jebel:    [[31.23,121.47],[1.30,103.82],[4.5,72.0],[22.0,60.0],[25.01,55.09]],
  lagos:    [[31.23,121.47],[1.30,103.82],[-34.0,18.5],[-1.0,5.0],[6.45,3.40]],
  antwerp:  [[31.23,121.47],[22.3,113.8],[1.30,103.82],[4.5,72.0],[12.0,44.0],[30.0,32.3],[36.5,14.0],[51.23,4.40]],
  santos:   [[31.23,121.47],[1.30,103.82],[-34.0,18.5],[-23.94,-46.31]],
  kingston: [[31.23,121.47],[22.3,113.8],[9.1,-79.7],[17.98,-76.79]],
  durban:   [[31.23,121.47],[1.30,103.82],[-29.87,31.03]],
};
function haversineNM(a,b){
  const R=3440.065,f1=a[0]*Math.PI/180,f2=b[0]*Math.PI/180;
  const df=(b[0]-a[0])*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180;
  return R*2*Math.atan2(Math.sqrt(Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2),Math.sqrt(1-(Math.sin(df/2)**2+Math.cos(f1)*Math.cos(f2)*Math.sin(dl/2)**2)));
}
function totalNM(wps){let t=0;for(let i=0;i<wps.length-1;i++)t+=haversineNM(wps[i],wps[i+1]);return t;}
function interpolate(wps,trav){let rem=trav;for(let i=0;i<wps.length-1;i++){const seg=haversineNM(wps[i],wps[i+1]);if(rem<=seg){const f=rem/seg;return[wps[i][0]+(wps[i+1][0]-wps[i][0])*f,wps[i][1]+(wps[i+1][1]-wps[i][1])*f];}rem-=seg;}return wps[wps.length-1];}
function destToKey(dest){
  const d=String(dest||'').toLowerCase();
  if(d.includes('mombasa')) return 'mombasa';
  if(d.includes('jebel')||d.includes('dubai')) return 'jebel';
  if(d.includes('lagos')) return 'lagos';
  if(d.includes('antwerp')||d.includes('rotterdam')) return 'antwerp';
  if(d.includes('santos')) return 'santos';
  if(d.includes('kingston')) return 'kingston';
  if(d.includes('durban')) return 'durban';
  return null;
}
function estimatePos(s){
  const rk=destToKey(s.dest||s.route||''); if(!rk) return null;
  const wp=ROUTE_WP[rk];
  const dep=s.departure?new Date(s.departure):null; if(!dep||isNaN(dep)) return null;
  const elapsed=(Date.now()-dep.getTime())/3600000; if(elapsed<0||elapsed>24*90) return null;
  const trav=Math.min(elapsed*12,totalNM(wp));
  const [lat,lon]=interpolate(wp,trav);
  const rem=Math.max(0,totalNM(wp)-trav);
  return {lat,lon,remainingNM:Math.round(rem),progressPct:Math.round(trav/totalNM(wp)*100),etaDate:new Date(Date.now()+rem/12*3600000).toISOString(),routeKey:rk};
}

// ── LIVE THREAT FETCHERS ──────────────────────────────────────────────────────
async function fetchGDACSAlerts(){
  try{
    const today=new Date(),week=new Date(today-7*864e5);
    const fmt=d=>d.toISOString().slice(0,10);
    const r=await fetch(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=${fmt(week)}&toDate=${fmt(today)}&alertlevel=orange,red&limit=15`,{signal:AbortSignal.timeout(7000),headers:{Accept:'application/json'}});
    if(!r.ok) return [];
    const d=await r.json();
    return (d.features||[]).map(f=>{
      const p=f.properties||f,g=f.geometry||{};
      return {name:`${p.eventtype||'Event'}: ${p.country||p.name||''}`,lat:g.coordinates?g.coordinates[1]:(p.latitude||0),lon:g.coordinates?g.coordinates[0]:(p.longitude||0),severity:p.alertlevel,type:'gdacs'};
    }).filter(e=>e.lat&&e.lon&&(e.severity==='Red'||e.severity==='Orange'));
  }catch(_){return [];}
}
async function fetchUSGSQuakes(){
  try{
    const start=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    const r=await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=6.0&limit=10&starttime=${start}`,{signal:AbortSignal.timeout(6000)});
    if(!r.ok) return [];
    const d=await r.json();
    return (d.features||[]).map(f=>({name:`M${f.properties.mag} Quake: ${(f.properties.place||'').slice(0,60)}`,lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0],severity:'medium',type:'usgs'}));
  }catch(_){return [];}
}

// ── TELEGRAM ─────────────────────────────────────────────────────────────────
async function sendTelegram(text){
  if(!BOT_TOKEN||!CHAT_ID) return false;
  try{
    const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:CHAT_ID,text,parse_mode:'HTML',disable_web_page_preview:true}),
      signal:AbortSignal.timeout(8000),
    });
    return r.ok;
  }catch(_){return false;}
}

function emojiSeverity(s){ return s==='Red'||s==='critical'?'🔴':s==='Orange'||s==='high'?'🟠':'🟡'; }

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Content-Type','application/json;charset=utf-8');
  res.setHeader('Cache-Control','no-store');

  // Security: cron-only or internal calls
  const authHeader=req.headers.authorization||'';
  const isCron=req.headers['x-vercel-cron']==='1';
  if(!isCron&&authHeader!==`Bearer ${process.env.NEWVISION_ADMIN_TOKEN||''}`) {
    res.statusCode=401; res.end(JSON.stringify({ok:false,error:'Unauthorized'})); return;
  }

  const startTime=Date.now();
  const report={ alerts:[], shipmentsSummary:[], threatsFound:0, telegramSent:0 };

  try{
    // Load shipments
    let shipments=[];
    try{ shipments=(await store.loadJSON('shipments'))||[]; }catch(_){}
    const active=shipments.filter(s=>/booked|loaded|in transit/i.test(s.status||''));
    report.activeShipments=active.length;

    if(!active.length){
      await sendTelegram(`🌍 <b>New Vision Watchboard</b>\nNo active shipments to monitor.\n<i>${new Date().toUTCString()}</i>`);
      report.telegramSent=1;
      res.statusCode=200; res.end(JSON.stringify({ok:true,...report})); return;
    }

    // Fetch live threats once (shared across all shipments)
    const [gdacs, usgs] = await Promise.all([fetchGDACSAlerts(), fetchUSGSQuakes()]);
    const allThreats=[...gdacs,...usgs];
    report.threatsInWorld=allThreats.length;

    const ALERT_RADIUS_NM=600;
    const alertMessages=[];

    for(const s of active){
      const pos=estimatePos(s);
      const shipSummary={ code:s.code, vehicle:s.vehicle, vessel:s.vessel, dest:s.dest, status:s.status, threats:[] };

      if(pos){
        // Check distance from each threat
        for(const threat of allThreats){
          const dist=haversineNM([pos.lat,pos.lon],[threat.lat,threat.lon]);
          if(dist<=ALERT_RADIUS_NM){
            shipSummary.threats.push({ name:threat.name, dist:Math.round(dist), severity:threat.severity, type:threat.type });
            report.threatsFound++;
            alertMessages.push(
              `${emojiSeverity(threat.severity)} <b>${s.code}</b> — <i>${s.vehicle||'Vehicle'}</i>\n` +
              `📍 Est. position: ${pos.lat.toFixed(1)}°, ${pos.lon.toFixed(1)}° (${pos.progressPct}% complete)\n` +
              `⚠ Threat within <b>${Math.round(dist)} nm</b>: ${threat.name}\n` +
              `📦 Destination: ${s.dest||'—'} · ETA: ${pos.etaDate?new Date(pos.etaDate).toDateString():'—'}`
            );
          }
        }

        // Check static risk zones
        const STATIC_ZONES=[
          {id:'red-sea',name:'Red Sea — Houthi Attacks',lat:15.5,lon:43.0,radius:420,severity:'critical'},
          {id:'gulf-guinea',name:'Gulf of Guinea Piracy',lat:2.5,lon:3.0,radius:620,severity:'high'},
          {id:'somali-basin',name:'Somali Basin Piracy',lat:7.5,lon:54.0,radius:520,severity:'high'},
        ];
        for(const z of STATIC_ZONES){
          const dist=haversineNM([pos.lat,pos.lon],[z.lat,z.lon]);
          if(dist<=z.radius){
            shipSummary.threats.push({name:z.name,dist:Math.round(dist),severity:z.severity,type:'static'});
          }
        }
      }

      shipSummary.position=pos?`${pos.lat.toFixed(2)},${pos.lon.toFixed(2)}`:'unknown';
      shipSummary.progress=pos?`${pos.progressPct}%`:'—';
      report.shipmentsSummary.push(shipSummary);
    }

    // Send alerts
    if(alertMessages.length){
      const header=`🚨 <b>New Vision Shipping Alert</b>\n${alertMessages.length} active threat(s) detected near tracked vessels\n\n`;
      await sendTelegram(header+alertMessages.join('\n\n'));
      report.telegramSent=1;
    }

    // Always send daily summary at 08:00 UTC (hour check)
    const hour=new Date().getUTCHours();
    if(hour===8||!alertMessages.length){
      const summaryLines=report.shipmentsSummary.map(s=>{
        const threatStr=s.threats.length?` ⚠ ${s.threats.length} threat(s)`:'✅';
        return `${threatStr} <b>${s.code}</b> — ${s.vehicle||'Vehicle'} → ${s.dest||'—'} (${s.status}) ${s.progress}`;
      });
      const summaryMsg=`🌍 <b>New Vision Daily Watchboard</b>\n` +
        `Active shipments: ${active.length} | World events: ${allThreats.length}\n\n`+
        summaryLines.join('\n')+
        `\n\n<a href="${VERCEL_URL}/worldmap.html">Open World Map</a>  ·  <i>${new Date().toUTCString()}</i>`;
      if(!alertMessages.length){ await sendTelegram(summaryMsg); report.telegramSent=1; }
    }

    report.durationMs=Date.now()-startTime;
    res.statusCode=200; res.end(JSON.stringify({ok:true,...report}));
  } catch(err){
    report.error=err.message;
    res.statusCode=500; res.end(JSON.stringify({ok:false,...report}));
  }
};
