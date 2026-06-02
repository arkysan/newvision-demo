/* New Vision interaction heatmap tracker — aggregate clicks/scroll for all visitors,
   detailed movement only for quote-requesters. Batches to the owner-portal API. */
(function () {
  var EP = 'https://newvision-demo.vercel.app/api/portal?action=heat';
  var sid = sessionStorage.getItem('nv_sid');
  if (!sid) { sid = 's' + Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('nv_sid', sid); }
  var firstSend = !sessionStorage.getItem('nv_sent');
  var quote = sessionStorage.getItem('nv_quote') === '1';
  var buf = [], scrollMax = 0;
  function deviceType() {
    var w = window.innerWidth || 0;
    var ua = navigator.userAgent || '';
    if (/MicroMessenger/i.test(ua)) return 'wechat-browser';
    if (w <= 480) return 'phone';
    if (w <= 900) return 'tablet';
    return 'desktop';
  }

  function desc(el) {
    if (!el || !el.tagName) return '';
    var s = el.tagName;
    if (el.id) s += '#' + el.id;
    else if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/)[0];
    var t = (el.innerText || el.alt || '').trim().slice(0, 24);
    if (t) s += ' "' + t + '"';
    return s.slice(0, 60);
  }
  document.addEventListener('click', function (e) {
    var dw = document.documentElement.scrollWidth || window.innerWidth || 1;
    var dh = document.documentElement.scrollHeight || window.innerHeight || 1;
    buf.push({ x: Math.round((e.pageX / dw) * 100), y: Math.round((e.pageY / dh) * 100), el: desc(e.target) });
    if (buf.length >= 40) flush(false);
  }, true);
  window.addEventListener('scroll', function () {
    var sd = Math.round(((window.scrollY + window.innerHeight) / (document.documentElement.scrollHeight || 1)) * 100);
    if (sd > scrollMax) scrollMax = Math.min(100, sd);
  }, { passive: true });
  // flag quote-requester (detailed movement kept for these sessions)
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'quoteForm') { quote = true; sessionStorage.setItem('nv_quote', '1'); flush(false); }
  }, true);

  function payload() {
    var p = { sid: sid, page: location.pathname, device: deviceType(), quote: quote, scrollMax: scrollMax, clicks: buf.splice(0, 40), newSession: firstSend };
    firstSend = false; sessionStorage.setItem('nv_sent', '1');
    return p;
  }
  function flush(beacon) {
    if (!buf.length && !firstSend) return;
    var body = JSON.stringify(payload());
    if (beacon && navigator.sendBeacon) { try { navigator.sendBeacon(EP, new Blob([body], { type: 'application/json' })); return; } catch (_) {} }
    try { fetch(EP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {}); } catch (_) {}
  }
  setInterval(function () { if (buf.length) flush(false); }, 5000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  window.addEventListener('pagehide', function () { flush(true); });
  if (firstSend) setTimeout(function () { flush(false); }, 1500); // register the session
})();
