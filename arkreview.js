/* ARK Review Widget (reusable) — drop <script src="arkreview.js"></script>
   before </body> on ANY site. Auto-detects the project name from the page
   title. Reviewers flag a section, tap a suggestion or type a note, then
   send everything to the team by WhatsApp or email in one tap.              */
(function () {
  'use strict';
  var WA_RECIPIENTS = [
    { name: 'New Vision Sales', number: '8613735611862' },
    { name: 'Eissah', number: '15558694441' },
    { name: 'Andy', number: '15595107788' },
  ];
  var WA_NUMBER  = WA_RECIPIENTS[0].number;      // Primary WhatsApp handoff
  var TEAM_EMAIL = 'info@n-vision.com.cn';       // email fallback
  var CMS_TOKEN_KEY = 'newvision.cms.token';
  var CMS_REVIEW_ENDPOINT = '/api/cms?action=review-patches';
  var PROJECT = (document.title || 'this site').split(/[—|·]/)[0].trim() || 'this site';
  var KEY = 'ark-review-notes';
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'home';

  // ---- storage ----
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ return []; } }
  function save(n){ localStorage.setItem(KEY, JSON.stringify(n)); }
  var notes = load();

  // ---- styles ----
  var css = document.createElement('style');
  css.textContent = `
   #rv-fab{position:fixed;right:24px;bottom:24px;z-index:99997;max-width:calc(100vw - 48px);background:#D4AF37;color:#0f1219;border:none;border-radius:50px;padding:18px 30px;font:800 18px 'Plus Jakarta Sans',system-ui,sans-serif;cursor:pointer;box-shadow:0 12px 36px rgba(212,175,55,.5);display:flex;align-items:center;gap:11px;animation:rvpulse 2.4s ease-in-out infinite}
   @keyframes rvpulse{0%,100%{box-shadow:0 12px 36px rgba(212,175,55,.4);transform:scale(1)}50%{box-shadow:0 14px 50px rgba(212,175,55,.8);transform:scale(1.03)}}
   #rv-fab:hover{background:#F5E6A3;animation:none;transform:translateY(-2px) scale(1.04)}
   #rv-fab .rv-fab-mobile{display:none}
   #rv-fab .b{background:#0f1219;color:#D4AF37;border-radius:20px;min-width:26px;height:26px;display:none;align-items:center;justify-content:center;font-size:14px;font-weight:800;padding:0 7px}
   #rv-fab .b.show{display:flex}
   @media(max-width:900px){#rv-fab{right:16px;bottom:16px;padding:14px 20px;font-size:15px}}
   #rv-panel{position:fixed;right:0;top:0;bottom:0;width:380px;max-width:92vw;z-index:99999;background:#0f1219;color:#e6e9ef;box-shadow:-12px 0 40px rgba(0,0,0,.4);display:none;flex-direction:column;font-family:'Inter',system-ui,sans-serif}
   #rv-panel.open{display:flex}
   #rv-h{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.1)}
   #rv-h .t{font:800 16px 'Plus Jakarta Sans';color:#fff}
   #rv-h .t span{color:#D4AF37}
   #rv-h .d{font-size:12.5px;color:#9aa3b2;margin-top:3px;line-height:1.45}
   #rv-h .x{position:absolute;right:14px;top:14px;width:38px;height:38px;background:none;border:none;color:#9aa3b2;font-size:20px;cursor:pointer}
   #rv-flag{margin:16px 18px 4px;background:#D4AF37;border:none;color:#0f1219;border-radius:12px;padding:18px;font:800 17px 'Plus Jakarta Sans';cursor:pointer;width:calc(100% - 36px);text-align:center;box-shadow:0 6px 20px rgba(212,175,55,.35)}
   #rv-flag:hover{background:#F5E6A3}
   #rv-flag.on{background:#1a1d24;color:#F5E6A3;border:2px solid #D4AF37;box-shadow:none}
   #rv-editmode{margin:8px 18px 4px;background:#1a1d24;border:1px solid rgba(96,109,255,.5);color:#b8c0ff;border-radius:12px;padding:14px;font:700 15px 'Plus Jakarta Sans';cursor:pointer;width:calc(100% - 36px);text-align:center}
   #rv-editmode:hover{background:#21263a}
   #rv-editmode.on{background:#5b5bf5;color:#fff;border-color:#5b5bf5}
   .rv-editable{outline:1.5px dashed #5b5bf5 !important;outline-offset:3px;cursor:text !important;border-radius:3px}
   .rv-editable:hover{background:rgba(91,91,245,.08)!important}
   .rv-edited{outline:1.5px solid #2f8f6b !important;outline-offset:3px}
    #rv-editbar{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:100000;background:#11141b;border:1px solid rgba(91,91,245,.5);color:#fff;border-radius:16px;padding:10px;display:none;align-items:center;gap:8px;box-shadow:0 16px 50px rgba(0,0,0,.5);width:min(840px,94vw)}
   #rv-editbar.show{display:flex}
   #rv-cmd{flex:1;min-width:0;background:#1a1d24;border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#e6e9ef;padding:11px 13px;font:14px 'Inter';outline:none}
   #rv-cmd:focus{border-color:#5b5bf5}
   #rv-editbar button{background:#1a1d24;color:#e6e9ef;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:11px 12px;font:700 13px 'Plus Jakarta Sans';cursor:pointer;white-space:nowrap}
   #rv-editbar button:hover{border-color:#5b5bf5}
   #rv-doit{background:#5b5bf5 !important;color:#fff !important;border-color:#5b5bf5 !important}
   #rv-editbar .pubn{background:#2f8f6b !important;color:#fff !important;border-color:#2f8f6b !important}
   @media(max-width:600px){#rv-editbar{flex-wrap:wrap}#rv-cmd{flex-basis:100%}}
   #rv-histpanel{position:fixed;right:18px;bottom:84px;z-index:100000;background:#11141b;border:1px solid rgba(255,255,255,.14);border-radius:14px;width:320px;max-height:50vh;overflow-y:auto;display:none;box-shadow:0 16px 50px rgba(0,0,0,.5);padding:8px}
   #rv-histpanel.show{display:block}
   #rv-histpanel .hh{font:800 13px 'Plus Jakarta Sans';color:#fff;padding:8px 10px}
   .rv-hrow{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;font-size:12.5px;color:#c2c8d2}
   .rv-hrow:hover{background:rgba(255,255,255,.04)}
   .rv-hrow.undone{opacity:.45;text-decoration:line-through}
   .rv-hrow .u{margin-left:auto;background:none;border:1px solid rgba(255,255,255,.14);color:#9aa3b2;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer}
    .rv-changed{outline:2px solid #5b5bf5 !important;outline-offset:2px;transition:outline .3s}
    .rv-selected{outline:2px solid #D4AF37 !important;outline-offset:4px}
    .rv-annotated{box-shadow:0 0 0 3px rgba(212,175,55,.25)!important}
   .rv-imgedit{outline:2px dashed #2f8f6b !important;outline-offset:2px;cursor:copy !important}
   .rv-imgedit:hover{outline:2px solid #2f8f6b !important;box-shadow:0 0 0 4px rgba(47,143,107,.2)!important}
   #rv-add{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08)}
   #rv-tagline{font-size:12px;color:#8b94a3;margin-bottom:9px;min-height:14px}
   #rv-tagline b{color:#D4AF37}
   #rv-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px;max-height:168px;overflow-y:auto;padding-right:2px}
   #rv-chips button{background:#1a1d24;border:1px solid rgba(212,175,55,.35);color:#e6e9ef;border-radius:20px;padding:9px 13px;font:700 12.5px 'Inter';cursor:pointer}
   #rv-chips button:hover{background:#252a35;border-color:#D4AF37}
   #rv-chips .direct{border-color:rgba(91,91,245,.55);color:#c6cbff}
   #rv-chips .warn{border-color:rgba(212,175,55,.6);color:#F5E6A3}
   #rv-chips .danger{border-color:rgba(193,84,63,.65);color:#ffb1a2}
   #rv-chips .lov{border-color:#2f8f6b;color:#7fdcb4}
   #rv-ta{width:100%;min-height:80px;background:#1a1d24;border:1px solid rgba(255,255,255,.12);border-radius:9px;color:#e6e9ef;padding:13px;font:15px 'Inter';outline:none;resize:vertical}
   #rv-ta:focus{border-color:#D4AF37}
   #rv-save{margin-top:10px;width:100%;background:#D4AF37;color:#0f1219;border:none;border-radius:9px;padding:14px;font:800 15px 'Plus Jakarta Sans';cursor:pointer}
   #rv-list{flex:1;overflow-y:auto;padding:12px 18px}
   #rv-empty{color:#6b7280;font-size:13px;text-align:center;margin-top:30px;line-height:1.6}
   .rv-note{background:#1a1d24;border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:11px 13px;margin-bottom:9px}
   .rv-note .meta{font-size:10.5px;color:#8b94a3;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;display:flex;gap:8px;align-items:center}
   .rv-note .meta .pg{color:#D4AF37}
   .rv-note .body{font-size:13.5px;line-height:1.5;color:#dfe3ea}
   .rv-note .sec{font-size:11.5px;color:#9aa3b2;font-style:italic;margin-bottom:4px}
   .rv-note .del{margin-left:auto;background:none;border:none;color:#6b7280;cursor:pointer;font-size:13px}
   .rv-note .del:hover{color:#c1543f}
   #rv-foot{padding:12px 18px 14px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:8px;flex-wrap:wrap}
   #rv-send{flex:1;min-width:120px;background:#25D366;color:#fff;border:none;border-radius:9px;padding:12px;font:700 13px 'Plus Jakarta Sans';cursor:pointer}
   #rv-email{flex:1;min-width:90px;background:#1a1d24;border:1px solid rgba(212,175,55,.4);color:#F5E6A3;border-radius:9px;padding:12px;font:700 13px 'Plus Jakarta Sans';cursor:pointer}
   #rv-copy{background:#1a1d24;border:1px solid rgba(255,255,255,.15);color:#c2c8d2;border-radius:9px;padding:12px 14px;font:600 13px 'Inter';cursor:pointer}
   #rv-emenu{display:none;padding:0 18px 6px;flex-direction:column;gap:6px}
   #rv-emenu.show{display:flex}
   #rv-emenu .eh{font-size:11px;color:#8b94a3;margin:8px 2px 0}
   #rv-emenu button{display:flex;align-items:center;gap:10px;background:#1a1d24;border:1px solid rgba(255,255,255,.12);color:#e6e9ef;border-radius:8px;padding:11px 13px;font:600 13.5px 'Inter';cursor:pointer;text-align:left}
   #rv-emenu button:hover{border-color:#D4AF37}
   #rv-emenu button .ig{width:22px;text-align:center;font-size:15px}
   .rv-hi{outline:2px dashed #D4AF37 !important;outline-offset:2px;cursor:crosshair !important;background:rgba(212,175,55,.08)!important}
   #rv-toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#0f1219;color:#F5E6A3;border:1px solid #D4AF37;border-radius:10px;padding:11px 20px;font:600 13px 'Inter';z-index:99999;opacity:0;transition:opacity .2s;pointer-events:none}
   #rv-toast.show{opacity:1}
   @media(max-width:600px){
    body.rv-open .mobile-app-bar,body.rv-open .mobile-lang-panel{display:none!important}
    #rv-fab{display:flex;right:12px;bottom:96px;max-width:none;padding:10px 12px;font-size:12px;border-radius:18px;animation:none;box-shadow:0 10px 24px rgba(212,175,55,.34)}
    #rv-fab .rv-fab-full{display:none}
    #rv-fab .rv-fab-mobile{display:inline}
    #rv-fab .b{min-width:20px;height:20px;font-size:11px;padding:0 6px}
    #rv-panel{left:8px;right:8px;top:auto;bottom:0;width:auto;max-width:none;max-height:min(72vh,620px);border:1px solid rgba(212,175,55,.24);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 40px rgba(0,0,0,.36);overflow:hidden}
    #rv-h{padding:20px 14px 12px;position:relative}
    #rv-h:before{content:'';position:absolute;top:8px;left:50%;transform:translateX(-50%);width:42px;height:4px;border-radius:4px;background:rgba(255,255,255,.22)}
    #rv-h .d{font-size:12px;line-height:1.45}
    #rv-flag,#rv-editmode{margin:12px 14px 0;width:calc(100% - 28px);min-height:46px;padding:0 10px;font-size:13px;border-radius:14px}
    #rv-add{padding:12px 14px}
    #rv-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:132px;overflow-y:auto;padding-right:0}
    #rv-chips button{min-height:42px;border-radius:14px;padding:9px 8px;font-size:12px;white-space:normal}
    #rv-ta{height:72px;font-size:13px;border-radius:12px}
    #rv-save{min-height:46px;border-radius:13px}
    #rv-list{padding:12px 14px 18px;min-height:82px}
    .rv-note{padding:11px;border-radius:12px}
    #rv-foot{padding:10px 14px calc(10px + env(safe-area-inset-bottom));gap:8px}
    #rv-foot button{min-height:44px;padding:0 8px;border-radius:11px;font-size:12px}
    #rv-toast{bottom:104px;width:calc(100vw - 28px);max-width:360px;text-align:center}
    #rv-editbar{bottom:92px;left:8px;right:8px;transform:none;width:auto;border-radius:14px}
    #rv-histpanel{right:12px;left:12px;bottom:154px;width:auto;max-height:42vh}
   }
  `;
  document.head.appendChild(css);

  // ---- DOM ----
  var fab = el('button','rv-fab','<span class="rv-fab-full">Leave Feedback</span><span class="rv-fab-mobile">Review</span> <span class="b" id="rv-count"></span>');
  fab.onclick = openPanel; document.body.appendChild(fab);

  var panel = el('div','rv-panel','');
  panel.innerHTML =
    '<div id="rv-h"><button class="x" id="rv-x">×</button><button id="rv-help-btn" style="position:absolute;right:58px;top:14px;background:none;border:1px solid rgba(212,175,55,.4);color:#F5E6A3;width:38px;height:38px;border-radius:50%;font-size:14px;cursor:pointer">?</button><div class="t">Review <span>this draft</span></div>'+
    '<div class="d">1. Tap the big gold button below. 2. Click the part of the page you mean. 3. Quick buttons now add real structured notes and apply safe draft previews when possible.</div></div>'+
    '<button id="rv-flag">Tap here, then click a section</button>'+
    '<button id="rv-editmode">Edit / tell ARK what to do</button>'+
    '<div id="rv-add"><div id="rv-tagline"></div>'+
      '<div id="rv-chips">'+
        '<button class="direct" data-action="size-up" data-c="Make this bigger">Make bigger</button>'+
        '<button class="direct" data-action="size-down" data-c="Make this smaller">Make smaller</button>'+
        '<button class="direct" data-action="wording" data-c="Change the wording here">Change wording</button>'+
        '<button class="direct" data-action="color-green" data-c="Use New Vision green here">Use green</button>'+
        '<button class="direct" data-action="color-gold" data-c="Use gold highlight here">Use gold</button>'+
        '<button class="direct" data-action="move-up" data-c="Move this section up">Move up</button>'+
        '<button class="direct" data-action="move-down" data-c="Move this section down">Move down</button>'+
        '<button class="danger" data-action="remove" data-c="Remove this">Remove</button>'+
        '<button class="warn" data-action="add-more" data-c="Add more detail here">Add more</button>'+
        '<button class="warn" data-action="stock-photo" data-c="Request a current stock photo here">Stock photo</button>'+
        '<button class="warn" data-action="spacing" data-c="Fix the spacing here">Fix spacing</button>'+
        '<button class="warn" data-action="mobile" data-c="Fix this on phone too">Fix phone</button>'+
        '<button class="warn" data-action="whatsapp" data-c="Fix the WhatsApp or quote flow here">WhatsApp flow</button>'+
        '<button class="warn" data-action="language" data-c="Fix language/translation here">Language</button>'+
        '<button class="lov" data-action="keep" data-c="I like this - keep it">Keep this</button>'+
      '</div>'+
      '<textarea id="rv-ta" placeholder="Tap a quick action above, or type exact details to add to the selected area."></textarea><button id="rv-save">+ Add This Note</button></div>'+
    '<div id="rv-list"></div>'+
    '<div id="rv-emenu">'+
      '<div class="eh">Choose how to send by email:</div>'+
      '<button data-p="gmail"><span class="ig">EM</span> Gmail</button>'+
      '<button data-p="outlook"><span class="ig">EM</span> Outlook</button>'+
      '<button data-p="yahoo"><span class="ig">EM</span> Yahoo Mail</button>'+
      '<button data-p="mail"><span class="ig">EM</span> Default mail app</button>'+
    '</div>'+
    '<div id="rv-foot"><button id="rv-send">WhatsApp</button><button id="rv-email">Email</button><button id="rv-copy">Copy</button></div>';
  document.body.appendChild(panel);

  var toast = el('div','rv-toast',''); document.body.appendChild(toast);

  var tagged = null; // {section, snippet}
  byId('rv-x').onclick = closePanel;
  byId('rv-flag').onclick = toggleFlag;
  byId('rv-save').onclick = addNote;
  byId('rv-send').onclick = sendAll;
  byId('rv-email').onclick = toggleEmailMenu;
  byId('rv-copy').onclick = copyAll;
  Array.prototype.forEach.call(panel.querySelectorAll('#rv-emenu button'), function(b){
    b.onclick = function(){ emailVia(b.getAttribute('data-p')); };
  });
  // quick action chips: add a structured note immediately and apply a safe draft preview when possible.
  Array.prototype.forEach.call(panel.querySelectorAll('#rv-chips button'), function(b){
    b.onclick = function(){
      handleQuickAction(b.getAttribute('data-action'), b.getAttribute('data-c'));
    };
  });

  function taggedTarget(){
    if(tagged && tagged.el && document.documentElement.contains(tagged.el)) return tagged.el;
    if(selectedEl && document.documentElement.contains(selectedEl)) return selectedEl;
    return null;
  }
  function requireTaggedTarget(){
    var target=taggedTarget();
    if(target) return target;
    showToast('Tap the gold button, click a section, then choose an action');
    startFlag();
    return null;
  }
  function taggedContext(target){
    target = target || taggedTarget();
    if(tagged && target===tagged.el) return tagged;
    if(!target) return { section:'', snippet:'' };
    return {
      el: target,
      selector: cssPath(target),
      section: nearestHeading(target),
      snippet: (target.innerText || target.alt || '').trim().replace(/\s+/g,' ').slice(0,80)
    };
  }
  function addStructuredNote(action, text, target, status){
    var ctx=taggedContext(target);
    var extra=byId('rv-ta').value.trim();
    var final=text;
    if(status) final += '\nStatus: '+status;
    if(extra && final.indexOf(extra)<0) final += '\nDetail: '+extra;
    notes.unshift({
      page:page,
      section: ctx.section || '',
      snippet: ctx.snippet || '',
      action: action,
      text: final,
      at:new Date().toLocaleString()
    });
    save(notes);
    byId('rv-ta').value='';
    renderCount();
    renderList();
    showToast(action+' note added');
  }
  function textTarget(el){
    if(!el) return null;
    if(isTextLeaf(el)) return el;
    return (el.querySelector && el.querySelector('h1,h2,h3,h4,h5,p,button,a,span,strong,li')) || el.closest('h1,h2,h3,h4,h5,p,button,a,span,strong,li') || el;
  }
  function changeWording(target){
    var leaf=textTarget(target);
    if(!leaf){ addStructuredNote('Change wording', 'Change the wording here.', target, 'Needs exact wording'); return; }
    var before=(leaf.innerText || leaf.textContent || '').trim();
    var next=window.prompt('New wording for this selected text:', before);
    if(next && next.trim()){
      record('text', leaf, before, next.trim(), 'changed wording from quick action');
      addStructuredNote('Change wording', 'Change wording to: "'+next.trim()+'"', target, 'Preview applied');
    } else {
      byId('rv-ta').value = before ? 'Change wording from: "'+before+'"\nTo: ' : 'Change wording here: ';
      byId('rv-ta').focus();
      showToast('Type the new wording, then Add This Note');
    }
  }
  function addMorePrompt(target){
    var more=window.prompt('What should be added here?');
    if(more && more.trim()) addStructuredNote('Add more', 'Add this content here: '+more.trim(), target, 'Needs source update');
    else { byId('rv-ta').value='Add more here: '; byId('rv-ta').focus(); }
  }
  function handleQuickAction(action, label){
    var needsTarget = action !== 'language';
    var target = needsTarget ? requireTaggedTarget() : taggedTarget();
    if(needsTarget && !target) return;
    if(action==='size-up'){
      applyPending(target,{kind:'size',value:1.18});
      addStructuredNote('Make bigger', label, target, 'Preview applied; undo available');
    } else if(action==='size-down'){
      applyPending(target,{kind:'size',value:0.86});
      addStructuredNote('Make smaller', label, target, 'Preview applied; undo available');
    } else if(action==='wording'){
      changeWording(target);
    } else if(action==='color-green'){
      applyPending(target,{kind:'color',value:'#2e7d32'});
      addStructuredNote('Change color', label, target, 'Green preview applied; undo available');
    } else if(action==='color-gold'){
      applyPending(target,{kind:'color',value:'#D4AF37'});
      addStructuredNote('Change color', label, target, 'Gold preview applied; undo available');
    } else if(action==='move-up'){
      selectedEl=movableBlock(target);
      moveSelected('up');
      addStructuredNote('Move up', label, selectedEl || target, 'Preview applied if section could move');
    } else if(action==='move-down'){
      selectedEl=movableBlock(target);
      moveSelected('down');
      addStructuredNote('Move down', label, selectedEl || target, 'Preview applied if section could move');
    } else if(action==='remove'){
      applyPending(target,{kind:'hide'});
      addStructuredNote('Remove', label, target, 'Hidden in draft preview; undo available');
    } else if(action==='add-more'){
      addMorePrompt(target);
    } else if(action==='stock-photo'){
      addStructuredNote('Stock photo', label, target, 'Needs current stock photo from sales/source');
    } else if(action==='spacing'){
      addStructuredNote('Fix spacing', label, target, 'Needs layout spacing update');
    } else if(action==='mobile'){
      addStructuredNote('Fix phone', label, target, 'Must verify phone viewport');
    } else if(action==='whatsapp'){
      addStructuredNote('WhatsApp flow', label, target, 'Must verify quote/contact handoff');
    } else if(action==='language'){
      addStructuredNote('Language', label || 'Fix language/translation here', target, 'Must verify language buttons and copy');
    } else if(action==='keep'){
      addStructuredNote('Keep this', label, target, 'Approved by reviewer');
    } else {
      byId('rv-ta').value = label || '';
      byId('rv-ta').focus();
    }
  }

  // ====== ARK DO ENGINE — type a command, it does it, with undo + history ======
  var CH_KEY='ark-changes';
  function loadCh(){ try{return JSON.parse(localStorage.getItem(CH_KEY))||[];}catch(e){return [];} }
  function saveCh(c){ localStorage.setItem(CH_KEY,JSON.stringify(c)); }
  function uid(){ return 'c'+Math.abs((Date.now()+Math.floor(performance.now()))).toString(36); }
  function cssPath(elm){
    if(!elm||elm===document.body) return 'body';
    var parts=[];
    while(elm && elm.nodeType===1 && elm!==document.body){
      var t=elm.tagName.toLowerCase(), i=1, s=elm;
      while((s=s.previousElementSibling)){ if(s.tagName===elm.tagName) i++; }
      parts.unshift(t+':nth-of-type('+i+')'); elm=elm.parentElement;
    }
    return 'body>'+parts.join('>');
  }
  function findBySel(sel){ try{ return document.querySelector(sel); }catch(_){ return null; } }
  function findChangeEl(c){
    if(c && c.key){
      var keyed=findBySel('[data-rv-key="'+c.key+'"]');
      if(keyed) return keyed;
    }
    return findBySel(c.sel);
  }
  function waUrl(number, text){ return 'https://wa.me/'+number+'?text='+encodeURIComponent(text); }
  function openTeamMessage(text){ window.open(waUrl(WA_NUMBER, text),'_blank'); }
  function canUseCmsApi(){
    var host=(location.hostname||'').toLowerCase();
    return Boolean(host && host!=='localhost' && host!=='127.0.0.1' && host!=='::1' && !host.endsWith('github.io'));
  }
  function readAdminToken(){
    var token=localStorage.getItem(CMS_TOKEN_KEY) || '';
    if(!token){
      token=window.prompt('Admin token required to publish this publicly:') || '';
      if(token.trim()) localStorage.setItem(CMS_TOKEN_KEY, token.trim());
    }
    return token.trim();
  }
  function isTextLeaf(el){
    if(!el||el.nodeType!==1) return false;
    if(/^(SCRIPT|STYLE|SVG|PATH|IMG|INPUT|TEXTAREA)$/.test(el.tagName)) return false;
    if(el.closest('#rv-panel,#rv-fab,#rv-help,#rv-editbar,#rv-histpanel,#splash,#cbar')) return false;
    var txt=''; for(var i=0;i<el.childNodes.length;i++){ if(el.childNodes[i].nodeType===3) txt+=el.childNodes[i].textContent; }
    return txt.trim().length>1;
  }
  function isMine(el){ return el && el.closest && !el.closest('#rv-panel,#rv-fab,#rv-help,#rv-editbar,#rv-histpanel,#splash'); }
  function childIndex(el){
    if(!el || !el.parentElement) return -1;
    return Array.prototype.indexOf.call(el.parentElement.children, el);
  }
  function placeAtIndex(el, parent, index){
    if(!el || !parent) return false;
    var kids=Array.prototype.slice.call(parent.children).filter(function(k){ return k!==el; });
    var ref=kids[Math.max(0, Math.min(index, kids.length))] || null;
    parent.insertBefore(el, ref);
    return true;
  }
  function selectedRangeElement(){
    var s=window.getSelection&&window.getSelection();
    if(!s || !s.rangeCount || !String(s).trim()) return null;
    var n=s.getRangeAt(0).commonAncestorContainer;
    return (n.nodeType===1?n:n.parentElement);
  }
  function movableBlock(el){
    var base=selectedRangeElement() || el;
    if(!base || !base.closest) return el;
    var card=base.closest('.vehicle-card,.info-card,.market-card,.route-card,.step,.cta-block,.showroom-inner');
    if(card) return card;
    var quote=base.closest('#quote');
    if(quote) return quote;
    return base.closest('section,article,form,li') || base;
  }

  // apply a change to the live DOM
  function applyChange(c){
    var el=findChangeEl(c);
    if(!el && c.kind==='text'){ // fallback: find by old text
      var all=document.body.querySelectorAll('h1,h2,h3,h4,h5,p,span,a,li,button,div,strong,em');
      for(var i=0;i<all.length;i++){ if(all[i].innerText && all[i].innerText.trim()===String(c.before).trim() && isTextLeaf(all[i])){ el=all[i]; break; } }
    }
    if(!el) return false;
    if(c.kind==='move'){ return placeAtIndex(el, findBySel(c.parent)||el.parentElement, c.after); }
    if(c.kind==='text') el.innerText=c.after;
    else if(c.kind==='image'){ if(el.tagName==='IMG') el.src=c.after; else el.style.backgroundImage='url('+c.after+')'; }
    else if(c.kind==='size') el.style.fontSize=c.after;
    else if(c.kind==='imgsize') el.style.width=c.after;
    else if(c.kind==='color') el.style.color=c.after;
    else if(c.kind==='hide') el.style.display='none';
    else if(c.kind==='annotation'){ el.setAttribute('data-ark-annotation', c.after); el.setAttribute('title', c.after); el.classList.add('rv-annotated'); }
    el.classList.add('rv-changed'); setTimeout(function(){el.classList.remove('rv-changed');},900);
    return true;
  }
  function revertChange(c){
    var el=findChangeEl(c); if(!el) return;
    if(c.kind==='move'){ placeAtIndex(el, findBySel(c.parent)||el.parentElement, c.before); return; }
    if(c.kind==='text') el.innerText=c.before;
    else if(c.kind==='image'){ if(el.tagName==='IMG') el.src=c.before; else el.style.backgroundImage=c.before; }
    else if(c.kind==='size') el.style.fontSize=c.before;
    else if(c.kind==='imgsize') el.style.width=c.before;
    else if(c.kind==='color') el.style.color=c.before;
    else if(c.kind==='hide') el.style.display=c.before;
    else if(c.kind==='annotation'){ el.removeAttribute('data-ark-annotation'); el.removeAttribute('title'); el.classList.remove('rv-annotated'); }
  }
  function record(kind, el, before, after, desc, extra){
    var key=el.getAttribute('data-rv-key') || uid();
    el.setAttribute('data-rv-key', key);
    var c={ id:uid(), page:page, kind:kind, sel:cssPath(el), key:key, before:before, after:after, desc:desc, at:Date.now(), undone:false };
    if(extra){ for(var k in extra){ c[k]=extra[k]; } }
    var arr=loadCh(); arr.push(c); saveCh(arr);
    applyChange(c); renderHist();
    showToast('Done - '+desc+'  (Undo available)');
  }
  function applyAll(){ loadCh().filter(function(c){return c.page===page && !c.undone;}).forEach(applyChange); }

  // ---- command parsing ----
  var pending=null; // {kind, value}
  var selectedEl=null;
  var COLORS={red:'#c0392b',blue:'#1565C0',green:'#2e7d32',gold:'#D4AF37',black:'#111',white:'#fff',gray:'#666',grey:'#666',orange:'#e67e22',purple:'#7c3aed'};
  function urlIn(t){ var m=t.match(/https?:\/\/[^\s"')]+/i); return m?m[0]:null; }
  function selectEditTarget(el){
    if(!isMine(el)) return;
    if(selectedEl) selectedEl.classList.remove('rv-selected');
    selectedEl=movableBlock(el);
    if(selectedEl) selectedEl.classList.add('rv-selected');
  }
  function annotateSelected(){
    var el=selectedEl || movableBlock(document.activeElement);
    if(!isMine(el)){ showToast('Highlight or click a section first'); return; }
    var note=window.prompt('Annotation for ARK to fix:');
    if(!note || !note.trim()) return;
    record('annotation', el, '', note.trim(), 'annotation: '+note.trim().slice(0,50));
  }
  function moveSelected(dir){
    var rangeEl=selectedRangeElement();
    var el=rangeEl ? movableBlock(rangeEl) : (selectedEl || movableBlock(document.activeElement));
    if(!isMine(el)){ showToast('Highlight or click a section first'); return; }
    selectedEl=el;
    var parent=el.parentElement, before=childIndex(el);
    var after=before+(dir==='up'?-1:1);
    if(!parent || after<0 || after>=parent.children.length){ showToast('That section cannot move further '+dir); return; }
    record('move', el, before, after, 'moved selected section '+dir, { parent:cssPath(parent) });
  }
  function doCommand(){
    var inp=byId('rv-cmd'); var t=inp.value.trim(); if(!t){ inp.focus(); return; }
    var low=t.toLowerCase();
    if(/\b(annotate|annotation|note)\b/i.test(low)){ inp.value=''; annotateSelected(); return; }
    if(/\bmove\b.*\b(up|higher)\b/i.test(low)){ inp.value=''; moveSelected('up'); return; }
    if(/\bmove\b.*\b(down|lower)\b/i.test(low)){ inp.value=''; moveSelected('down'); return; }
    // change X to Y (text) — applies immediately
    var m=t.match(/change\s+["']?(.+?)["']?\s+to\s+["']?(.+?)["']?\s*$/i);
    if(m && !/image|photo|picture|color|colour|size|bigger|smaller/i.test(m[1])){
      var oldT=m[1].trim(), newT=m[2].trim();
      var all=document.body.querySelectorAll('h1,h2,h3,h4,h5,p,span,a,li,button,strong,em,div');
      for(var i=0;i<all.length;i++){ if(isTextLeaf(all[i]) && all[i].innerText.trim()===oldT){ record('text',all[i],all[i].innerText,newT,'changed text to “'+newT+'”'); inp.value=''; return; } }
      // partial match
      for(var j=0;j<all.length;j++){ if(isTextLeaf(all[j]) && all[j].innerText.indexOf(oldT)>=0){ record('text',all[j],all[j].innerText,all[j].innerText.replace(oldT,newT),'updated text'); inp.value=''; return; } }
      showToast('Couldn’t find “'+oldT+'” — click the text instead'); return;
    }
    // image
    if(/\b(image|photo|picture|pic|fake|real car|car image)\b/i.test(low)){
      arm('image', urlIn(t)); inp.value=''; return;
    }
    if(/\b(bigger|larger|huge|increase)\b/i.test(low)){ arm('size',1.3); inp.value=''; return; }
    if(/\b(smaller|tiny|reduce|shrink)\b/i.test(low)){ arm('size',0.8); inp.value=''; return; }
    if(/\b(hide|remove|delete|take out)\b/i.test(low)){ arm('hide'); inp.value=''; return; }
    var col=null; for(var k in COLORS){ if(low.indexOf(k)>=0){ col=COLORS[k]; break; } } var hx=t.match(/#[0-9a-f]{3,6}/i);
    if(/\bcolor|colour\b/i.test(low) || col || hx){ arm('color', hx?hx[0]:col); inp.value=''; return; }
    // Unknown requests are sent to the team instead of pretending the page can self-edit.
    showToast('I will send that to the team to review.');
    var lines=['DO REQUEST for '+PROJECT,'('+page+')','', t]; openTeamMessage(lines.join('\n'));
    inp.value='';
  }
  function arm(kind, value){
    pending={kind:kind, value:value};
    var label={image:'image',size:(value>1?'thing to enlarge':'thing to shrink'),color:'text',hide:'thing to remove'}[kind];
    showToast('Now click the '+label+' on the page');
    setReviewOpen(false);
  }
  function applyPending(el, p){
    if(p.kind==='image'){
      var img = el.tagName==='IMG' ? el : (el.querySelector&&el.querySelector('img')) || el;
      var target = (img && img.tagName==='IMG') ? img : el;
      if(p.value){ doImageReplace(target, p.value); return; }
      imageDialog(target.tagName==='IMG'?target.src:'', function(url){ doImageReplace(target, url); });
    } else if(p.kind==='size'){
      if(el.tagName==='IMG'){ var w=el.getBoundingClientRect().width; record('imgsize', el, el.style.width||(w+'px'), Math.round(w*p.value)+'px', (p.value>1?'enlarged':'shrunk')+' image'); }
      else { var leaf=isTextLeaf(el)?el:el.closest('h1,h2,h3,h4,h5,p,span,a,li,button')||el; var fs=parseFloat(getComputedStyle(leaf).fontSize); record('size', leaf, leaf.style.fontSize||(fs+'px'), Math.round(fs*p.value)+'px', (p.value>1?'enlarged':'shrunk')+' text'); }
    } else if(p.kind==='color'){
      var lf=isTextLeaf(el)?el:el.closest('h1,h2,h3,h4,h5,p,span,a,li,button')||el; record('color', lf, lf.style.color||getComputedStyle(lf).color, p.value, 'recolored text');
    } else if(p.kind==='hide'){
      record('hide', el, el.style.display||'', 'none', 'removed a section');
    }
  }
  function flagToTeam(what, el){
    var lines=['DO REQUEST for '+PROJECT,'('+page+')','', what + (el? ' — near: "'+(el.innerText||el.alt||'image').slice(0,50)+'"':'')];
    openTeamMessage(lines.join('\n'));
  }
  function doImageReplace(el, url){
    if(!url) return;
    addAsset(url);
    if(el.tagName==='IMG') record('image', el, el.src, url, 'replaced image');
    else record('image', el, el.style.backgroundImage||'none', url, 'set background image');
  }
  function replaceImage(img){ imageDialog(img.src, function(url){ doImageReplace(img, url); }); }

  // ===== ASSET STORE — remembers images you use, for reuse + faster reload =====
  var ASSET_KEY='ark-assets';
  function loadAssets(){ try{return JSON.parse(localStorage.getItem(ASSET_KEY))||[];}catch(e){return [];} }
  function addAsset(url,name){
    if(!url || url.length>600000) return; // keep store light (skip huge data-urls)
    var a=loadAssets(); if(a.some(function(x){return x.url===url;})) return;
    a.unshift({url:url,name:name||'image',at:Date.now()}); localStorage.setItem(ASSET_KEY,JSON.stringify(a.slice(0,40)));
  }

  // ===== IMAGE PICKER — Upload / Paste link / Find online / Library =====
  var imgModal=null, imgCb=null;
  function buildImgModal(){
    var m=document.createElement('div'); m.id='rv-imgmodal';
    m.innerHTML=
      '<div class="im-card">'+
        '<div class="im-h">Choose an image <button id="im-x">×</button></div>'+
        '<div class="im-tabs"><button class="im-tab on" data-t="up">Upload</button><button class="im-tab" data-t="link">Paste link</button><button class="im-tab" data-t="lib">Library</button></div>'+
        '<div class="im-body">'+
          '<div class="im-pane on" data-p="up">'+
            '<label class="im-drop"><input type="file" id="im-file" accept="image/*" hidden><div>Click to choose a photo from your device<br><small>JPG, PNG, WebP</small></div></label>'+
          '</div>'+
          '<div class="im-pane" data-p="link">'+
            '<input id="im-url" placeholder="Paste an image URL (https://…)" />'+
            '<button id="im-find" class="im-find">Find a photo online (opens image search)</button>'+
            '<button id="im-useurl" class="im-use">Use this link</button>'+
          '</div>'+
          '<div class="im-pane" data-p="lib"><div id="im-lib" class="im-grid"></div></div>'+
        '</div>'+
        '<div class="im-prev" id="im-prev"></div>'+
      '</div>';
    document.body.appendChild(m);
    var st=document.createElement('style'); st.textContent=`
      #rv-imgmodal{position:fixed;inset:0;z-index:100001;background:rgba(8,9,12,.75);display:none;align-items:center;justify-content:center;padding:18px}
      #rv-imgmodal.show{display:flex}
      .im-card{background:#0f1219;border:1px solid rgba(255,255,255,.14);border-radius:16px;width:min(460px,96vw);color:#e6e9ef;font-family:'Inter',system-ui,sans-serif;overflow:hidden}
      .im-h{display:flex;align-items:center;padding:16px 18px;font:800 16px 'Plus Jakarta Sans';border-bottom:1px solid rgba(255,255,255,.08)}
      .im-h button{margin-left:auto;background:none;border:none;color:#9aa3b2;font-size:22px;cursor:pointer}
      .im-tabs{display:flex;gap:6px;padding:12px 14px 0}
      .im-tab{flex:1;background:#1a1d24;border:1px solid rgba(255,255,255,.12);color:#c2c8d2;border-radius:9px;padding:10px;font:600 13px 'Inter';cursor:pointer}
      .im-tab.on{background:#5b5bf5;color:#fff;border-color:#5b5bf5}
      .im-body{padding:14px}
      .im-pane{display:none}.im-pane.on{display:block}
      .im-drop{display:block;border:2px dashed rgba(91,91,245,.5);border-radius:12px;padding:34px 16px;text-align:center;cursor:pointer;color:#b8c0cc;font-size:14px}
      .im-drop:hover{background:rgba(91,91,245,.06)}.im-drop small{color:#6b7280}
      #im-url{width:100%;background:#1a1d24;border:1px solid rgba(255,255,255,.14);border-radius:9px;color:#e6e9ef;padding:12px;font:14px 'Inter';outline:none;margin-bottom:10px}
      .im-find{width:100%;background:#1a1d24;border:1px solid rgba(212,175,55,.4);color:#F5E6A3;border-radius:9px;padding:11px;font:600 13px 'Inter';cursor:pointer;margin-bottom:10px}
      .im-use{width:100%;background:#5b5bf5;color:#fff;border:none;border-radius:9px;padding:12px;font:700 14px 'Plus Jakarta Sans';cursor:pointer}
      .im-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:220px;overflow-y:auto}
      .im-grid img{width:100%;height:70px;object-fit:cover;border-radius:8px;cursor:pointer;border:2px solid transparent}
      .im-grid img:hover{border-color:#5b5bf5}
      .im-grid .empty{grid-column:1/-1;color:#6b7280;font-size:12.5px;text-align:center;padding:24px}
      .im-prev{padding:0 14px 14px}.im-prev img{width:100%;max-height:150px;object-fit:contain;border-radius:8px;margin-top:6px}
    `;
    document.head.appendChild(st);
    // tab switching
    Array.prototype.forEach.call(m.querySelectorAll('.im-tab'),function(b){ b.onclick=function(){
      m.querySelectorAll('.im-tab').forEach(function(x){x.classList.toggle('on',x===b);});
      m.querySelectorAll('.im-pane').forEach(function(p){p.classList.toggle('on',p.getAttribute('data-p')===b.getAttribute('data-t'));});
      if(b.getAttribute('data-t')==='lib') renderLib();
    };});
    byId('im-x').onclick=function(){ m.classList.remove('show'); };
    // upload
    byId('im-file').onchange=function(e){
      var f=e.target.files[0]; if(!f) return;
      var r=new FileReader(); r.onload=function(){ pick(r.result); }; r.readAsDataURL(f);
    };
    // paste link
    byId('im-useurl').onclick=function(){ var u=byId('im-url').value.trim(); if(u) pick(u); };
    byId('im-find').onclick=function(){ window.open('https://www.google.com/search?tbm=isch&q='+encodeURIComponent(PROJECT+' photo'),'_blank'); showToast('Find a photo → right-click it → Copy image address → paste here'); };
    imgModal=m;
    function renderLib(){
      var g=byId('im-lib'); var a=loadAssets();
      g.innerHTML = a.length ? a.map(function(x){return '<img src="'+x.url+'" title="'+(x.name||'')+'">';}).join('') : '<div class="empty">No saved images yet. Upload or paste one — it’ll be saved here for reuse.</div>';
      Array.prototype.forEach.call(g.querySelectorAll('img'),function(im){ im.onclick=function(){ pick(im.src); }; });
    }
    function pick(url){ if(imgCb){ var cb=imgCb; imgCb=null; m.classList.remove('show'); cb(url); } }
  }
  function imageDialog(currentSrc, cb){
    if(!imgModal) buildImgModal();
    imgCb=cb;
    byId('im-url').value=''; byId('im-prev').innerHTML = currentSrc ? '<div style="font-size:11px;color:#6b7280">Currently:</div><img src="'+currentSrc+'">' : '';
    imgModal.querySelector('.im-tab[data-t="up"]').click();
    imgModal.classList.add('show');
  }

  // ---- ONE click handler that runs the whole editor ----
  function editClick(e){
    var el=e.target;
    if(!isMine(el)) return;                          // ignore the widget's own UI
    // 1) a command is armed → apply it to whatever you click
    if(pending){ e.preventDefault(); e.stopPropagation(); var p=pending; pending=null; applyPending(el, p); return; }
    selectEditTarget(el);
    // 2) clicked an image → offer to replace it
    if(el.tagName==='IMG'){ e.preventDefault(); e.stopPropagation(); replaceImage(el); return; }
    // 3) clicked a link or button → stop it from navigating/submitting so you can edit its text
    var ab=el.closest('a,button'); if(ab){ e.preventDefault(); }
    // 4) otherwise it's text — contenteditable handles the click natively (place cursor, type)
  }

  // ---- edit mode bar ----
  var editing=false;
  var editbar=el('div','rv-editbar',
    '<input id="rv-cmd" placeholder="Tell ARK what to do… e.g. replace this image with a real car photo / make bigger / change Book to Schedule" />'+
    '<button id="rv-doit">Do</button><button id="rv-move-up">Move Up</button><button id="rv-move-down">Move Down</button><button id="rv-annotate">Annotate</button><button id="rv-undo">Undo</button><button id="rv-redo">Redo</button><button id="rv-hist">History</button>'+
    '<button id="rv-edit-pub" class="pubn">Publish</button><button id="rv-edit-exit">✓ Done</button>');
  document.body.appendChild(editbar);
  var histpanel=el('div','rv-histpanel','<div class="hh">Change history</div><div id="rv-hrows"></div>');
  document.body.appendChild(histpanel);

  function recordTextEdit(e){
    var el=e.target; if(!el.classList || !el.classList.contains('rv-editable')) return;
    var old=el.getAttribute('data-rv-old'); if(old==null) return;
    if(el.innerText.trim()!==String(old).trim()){
      record('text', el, old, el.innerText, 'edited text');
      el.setAttribute('data-rv-old', el.innerText);
    }
  }
  function enterEdit(){
    editing=true; byId('rv-editmode').classList.add('on'); byId('rv-editmode').textContent='Editing... tap Done to stop';
    setReviewOpen(false); editbar.classList.add('show');
    // kill the splash + scroll-lock if covering the page (so editing isn't blocked)
    var sp=document.getElementById('splash'); if(sp&&sp.parentNode) sp.parentNode.removeChild(sp);
    document.documentElement.style.overflow=''; document.body.style.overflow='';
    // make every text element directly typeable — click and type, like a document
    document.body.querySelectorAll('h1,h2,h3,h4,h5,p,span,a,li,button,strong,em,div').forEach(function(el){
      if(isTextLeaf(el)){ el.classList.add('rv-editable'); el.setAttribute('contenteditable','true'); el.setAttribute('data-rv-old', el.innerText); }
    });
    // make images visibly clickable-to-replace
    document.body.querySelectorAll('img').forEach(function(im){ if(isMine(im)) im.classList.add('rv-imgedit'); });
    document.addEventListener('click', editClick, true);          // the one handler that runs everything
    document.addEventListener('focusout', recordTextEdit, true);  // record text edits when you click away
    showToast('Click any text and type · click an image to replace it · or use the command bar');
  }
  function exitEdit(){
    editing=false; pending=null; byId('rv-editmode').classList.remove('on'); byId('rv-editmode').textContent='Edit / tell ARK what to do';
    editbar.classList.remove('show'); histpanel.classList.remove('show');
    document.removeEventListener('click', editClick, true);
    document.removeEventListener('focusout', recordTextEdit, true);
    if(selectedEl) selectedEl.classList.remove('rv-selected'); selectedEl=null;
    document.querySelectorAll('.rv-editable').forEach(function(el){ el.classList.remove('rv-editable'); el.removeAttribute('contenteditable'); el.removeAttribute('data-rv-old'); });
    document.querySelectorAll('.rv-imgedit').forEach(function(el){ el.classList.remove('rv-imgedit'); });
  }
  function undoLast(){
    var arr=loadCh(); for(var i=arr.length-1;i>=0;i--){ if(arr[i].page===page && !arr[i].undone){ revertChange(arr[i]); arr[i].undone=true; saveCh(arr); renderHist(); showToast('Undone - '+arr[i].desc); return; } }
    showToast('Nothing to undo');
  }
  function redoLast(){
    var arr=loadCh(); for(var i=arr.length-1;i>=0;i--){ if(arr[i].page===page && arr[i].undone){ arr[i].undone=false; applyChange(arr[i]); saveCh(arr); renderHist(); showToast('Redone - '+arr[i].desc); return; } }
    showToast('Nothing to redo');
  }
  function renderHist(){
    var rows=byId('rv-hrows'); var arr=loadCh().filter(function(c){return c.page===page;}).reverse();
    if(!arr.length){ rows.innerHTML='<div style="color:#5f6877;font-size:12px;padding:10px">No changes yet.</div>'; return; }
    rows.innerHTML=arr.map(function(c){
      return '<div class="rv-hrow '+(c.undone?'undone':'')+'"><span>'+c.desc+'</span>'+
        '<button class="u" data-id="'+c.id+'">'+(c.undone?'Redo':'Undo')+'</button></div>';
    }).join('');
    Array.prototype.forEach.call(rows.querySelectorAll('.u'),function(b){ b.onclick=function(){ toggleChange(b.getAttribute('data-id')); }; });
  }
  function toggleChange(id){
    var arr=loadCh(); for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ if(arr[i].undone){ arr[i].undone=false; applyChange(arr[i]); } else { arr[i].undone=true; revertChange(arr[i]); } saveCh(arr); renderHist(); return; } }
  }
  function publishPacket(arr){
    return {
      page: page,
      changes: arr.map(function(c){
        return {
          id:c.id, page:c.page, kind:c.kind, sel:c.sel, key:c.key, parent:c.parent,
          before:c.before, after:c.after, desc:c.desc, at:c.at
        };
      }),
      notes: notes.map(function(n){
        return { page:n.page, section:n.section, action:n.action, text:n.text, at:n.at };
      })
    };
  }
  function publishSummaryLines(prefix, arr){
    var lines=[prefix+' - '+PROJECT,'('+page+', '+arr.length+' changes)',''];
    arr.forEach(function(c,i){
      lines.push((i+1)+'. '+c.desc + (c.kind==='text'?(':\n   FROM "'+String(c.before).trim().slice(0,60)+'"\n   TO   "'+String(c.after).trim().slice(0,60)+'"'):' -> '+String(c.after).slice(0,80)));
    });
    return lines;
  }
  async function publishChanges(){
    var arr=loadCh().filter(function(c){return c.page===page && !c.undone;});
    if(!arr.length){ showToast('No changes to publish yet'); return; }
    var lines;
    if(!canUseCmsApi()){
      lines=publishSummaryLines('PUBLISH REQUEST', arr);
      lines.push('','Local preview cannot publish publicly because /api/cms is only available on the deployed site. Open the public New Vision URL, enter the admin token, and press Publish again.');
      openTeamMessage(lines.join('\n'));
      showToast('Public publish needs deployed site + admin token. Change packet opened.');
      return;
    }
    var token=readAdminToken();
    if(!token){ showToast('Publish canceled - admin token required'); return; }
    try{
      showToast('Publishing live...');
      var res=await fetch(CMS_REVIEW_ENDPOINT,{
        method:'PUT',
        headers:{'Content-Type':'application/json','x-newvision-admin-token':token},
        body:JSON.stringify(publishPacket(arr))
      });
      var data=await res.json();
      if(!res.ok || !data.ok) throw new Error(data.message || 'Publish failed');
      lines=publishSummaryLines('PUBLISHED LIVE', arr);
      lines.push('','Published live through New Vision CMS review patches at '+data.patches.publishedAt+'.');
      openTeamMessage(lines.join('\n'));
      showToast('Published live. WhatsApp change note opened.');
    }catch(err){
      lines=publishSummaryLines('PUBLISH BLOCKED', arr);
      lines.push('', 'Reason: '+err.message, 'No live claim was made. Fix the token/storage/API issue, then press Publish again.');
      openTeamMessage(lines.join('\n'));
      showToast('Publish blocked - '+err.message);
    }
  }

  async function loadPublishedChanges(){
    if(!canUseCmsApi()) return;
    try{
      var res=await fetch(CMS_REVIEW_ENDPOINT,{cache:'no-store'});
      var data=await res.json();
      if(data && data.ok && data.patches && Array.isArray(data.patches.changes)){
        data.patches.changes.filter(function(c){return c.page===page;}).forEach(applyChange);
        applyAll();
      }
    }catch(_){ }
  }

  byId('rv-editmode').onclick=function(){ editing?exitEdit():enterEdit(); };
  byId('rv-doit').onclick=doCommand;
  byId('rv-cmd').addEventListener('keydown',function(e){ if(e.key==='Enter') doCommand(); });
  byId('rv-move-up').onclick=function(){ moveSelected('up'); };
  byId('rv-move-down').onclick=function(){ moveSelected('down'); };
  byId('rv-annotate').onclick=annotateSelected;
  byId('rv-undo').onclick=undoLast;
  byId('rv-redo').onclick=redoLast;
  byId('rv-hist').onclick=function(){ histpanel.classList.toggle('show'); renderHist(); };
  byId('rv-edit-pub').onclick=publishChanges;
  byId('rv-edit-exit').onclick=exitEdit;

  renderCount(); renderList(); applyAll(); renderHist(); loadPublishedChanges();
  // auto-enter edit mode when opened with ?arkedit=1 (used by the ARK workspace "Edit directly" button)
  if(/[?&]arkedit=1/.test(location.search)){ setTimeout(function(){ try{ enterEdit(); }catch(_){ } }, 500); }

  // ---- HELP / how-it-works walkthrough ----
  var help = document.createElement('div');
  help.id = 'rv-help';
  help.innerHTML =
    '<div class="rv-help-card">'+
      '<div class="rv-help-h">How to leave feedback <button id="rv-help-x">×</button></div>'+
      '<div class="rv-step"><span class="n">1</span><div><b>Tap “Flag a section”</b><p>The big gold button, then click the part of the page you want to change.</p></div></div>'+
      '<div class="rv-step"><span class="n">2</span><div><b>Tap an action</b><p>Some buttons apply a draft preview with undo. Every button also creates a clear structured note for ARK.</p></div></div>'+
      '<div class="rv-step"><span class="n">3</span><div><b>Publish or send</b><p>Publish saves approved draft changes to the public New Vision CMS when the admin token is set. WhatsApp and Email send the change packet to the team.</p></div></div>'+
      '<div class="rv-help-note">Note: local preview cannot publish publicly. Use the deployed site with the admin token for live changes; blocked publishes send an honest change packet instead.</div>'+
      '<button id="rv-help-go">Got it — start reviewing</button>'+
    '</div>';
  document.body.appendChild(help);
  var hcss = document.createElement('style');
  hcss.textContent = `
   #rv-help{position:fixed;inset:0;z-index:100000;background:rgba(8,9,12,.72);display:none;align-items:center;justify-content:center;padding:20px}
   #rv-help.show{display:flex}
   .rv-help-card{background:#0f1219;border:1px solid rgba(212,175,55,.4);border-radius:18px;max-width:400px;width:100%;padding:26px;color:#e6e9ef;font-family:'Inter',system-ui,sans-serif;box-shadow:0 30px 80px rgba(0,0,0,.5)}
   .rv-help-h{font:800 19px 'Plus Jakarta Sans',sans-serif;color:#fff;display:flex;align-items:center;margin-bottom:18px}
   .rv-help-h button{margin-left:auto;background:none;border:none;color:#9aa3b2;font-size:24px;cursor:pointer}
   .rv-step{display:flex;gap:14px;margin-bottom:16px;align-items:flex-start}
   .rv-step .n{flex-shrink:0;width:30px;height:30px;border-radius:50%;background:#D4AF37;color:#0f1219;display:flex;align-items:center;justify-content:center;font:800 15px 'Plus Jakarta Sans'}
   .rv-step b{font-size:15px;color:#fff}
   .rv-step p{font-size:13px;color:#9aa3b2;line-height:1.5;margin-top:2px}
   .rv-help-note{background:rgba(212,175,55,.1);border:1px solid rgba(212,175,55,.3);border-radius:10px;padding:12px 14px;font-size:13px;color:#F5E6A3;line-height:1.55;margin:6px 0 18px}
   #rv-help-go{width:100%;background:#D4AF37;color:#0f1219;border:none;border-radius:10px;padding:14px;font:800 15px 'Plus Jakarta Sans';cursor:pointer}
  `;
  document.head.appendChild(hcss);
  byId('rv-help-x').onclick = function(){ help.classList.remove('show'); };
  byId('rv-help-go').onclick = function(){ help.classList.remove('show'); setReviewOpen(true); };
  byId('rv-help-btn').onclick = function(){ setReviewOpen(false); showHelp(); };
  function showHelp(){ help.classList.add('show'); }

  // ---- behaviors ----
  function setReviewOpen(open){
    panel.classList.toggle('open', !!open);
    document.body.classList.toggle('rv-open', !!open);
  }
  function openPanel(){
    setReviewOpen(true);
    if(!localStorage.getItem('ark-review-helped')){ localStorage.setItem('ark-review-helped','1'); setReviewOpen(false); showHelp(); }
  }
  function closePanel(){ setReviewOpen(false); stopFlag(); }

  var flagging = false, hoverEl = null;
  function toggleFlag(){ flagging ? stopFlag() : startFlag(); }
  function startFlag(){
    flagging = true; byId('rv-flag').classList.add('on'); byId('rv-flag').textContent='Click a section... (or tap here to cancel)';
    setReviewOpen(false);
    document.addEventListener('mouseover', onHover, true);
    document.addEventListener('click', onPick, true);
    showToast('Click the part of the page you want to comment on');
  }
  function stopFlag(){
    flagging = false; byId('rv-flag').classList.remove('on'); byId('rv-flag').textContent='Tap here, then click a section';
    document.removeEventListener('mouseover', onHover, true);
    document.removeEventListener('click', onPick, true);
    if(hoverEl){ hoverEl.classList.remove('rv-hi'); hoverEl = null; }
  }
  function onHover(e){
    if(panel.contains(e.target) || fab.contains(e.target)) return;
    if(hoverEl) hoverEl.classList.remove('rv-hi');
    hoverEl = pickTarget(e.target); if(hoverEl) hoverEl.classList.add('rv-hi');
  }
  function pickTarget(t){
    // climb to a meaningful block
    var n = t, hops=0;
    while(n && hops<4 && n.textContent && n.textContent.trim().length<3){ n=n.parentElement; hops++; }
    return n;
  }
  function onPick(e){
    if(panel.contains(e.target) || fab.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var t = pickTarget(e.target);
    var snippet = (t && t.textContent ? t.textContent.trim().replace(/\s+/g,' ').slice(0,80) : '');
    var sec = nearestHeading(t);
    tagged = { el: t, selector: cssPath(t), section: sec, snippet: snippet };
    if(selectedEl) selectedEl.classList.remove('rv-selected');
    selectedEl = movableBlock(t);
    if(selectedEl) selectedEl.classList.add('rv-selected');
    stopFlag(); openPanel();
    byId('rv-tagline').innerHTML = 'On: <b>'+ (sec||'this area') +'</b>'+ (snippet? ' — “'+snippet+'…”':'' );
    byId('rv-ta').focus();
  }
  function nearestHeading(t){
    var n=t;
    for(var i=0;i<8 && n;i++){
      var h = n.querySelector && n.querySelector('h1,h2,h3,h4');
      if(h && h.textContent.trim()) return h.textContent.trim().slice(0,50);
      var sec = n.closest && n.closest('section,header,nav,footer,div[id]');
      if(sec && sec.id) return sec.id;
      n = n.parentElement;
    }
    return '';
  }

  function addNote(){
    var txt = byId('rv-ta').value.trim(); if(!txt){ byId('rv-ta').focus(); return; }
    notes.unshift({ page:page, section: tagged? tagged.section:'', snippet: tagged? tagged.snippet:'', action:'Custom note', text:txt, at:new Date().toLocaleString() });
    save(notes); byId('rv-ta').value=''; tagged=null; byId('rv-tagline').textContent='';
    renderCount(); renderList(); showToast('Note added ✓');
  }
  function delNote(i){ notes.splice(i,1); save(notes); renderCount(); renderList(); }

  function renderCount(){ var c=byId('rv-count'); c.textContent=notes.length; c.classList.toggle('show', notes.length>0); }
  function renderList(){
    var L=byId('rv-list');
    if(!notes.length){ L.innerHTML='<div id="rv-empty">No notes yet.<br>Flag a section or just type a note above.</div>'; return; }
    L.innerHTML = notes.map(function(n,i){
      return '<div class="rv-note"><div class="meta"><span class="pg">'+n.page+'</span>'+(n.action?'<span>'+esc(n.action)+'</span>':'')+'<span>'+n.at+'</span><button class="del" data-i="'+i+'">x</button></div>'+
        (n.section? '<div class="sec">Section: '+n.section+ (n.snippet? ' — “'+n.snippet+'…”':'') +'</div>':'')+
        '<div class="body">'+esc(n.text)+'</div></div>';
    }).join('');
    Array.prototype.forEach.call(L.querySelectorAll('.del'), function(b){ b.onclick=function(){ delNote(+b.dataset.i); }; });
  }

  function compose(){
    if(!notes.length) return '';
    var lines = ['Review notes for '+PROJECT,'('+notes.length+' notes)',''];
    notes.forEach(function(n,i){
      lines.push((i+1)+'. ['+n.page+'] '+ (n.section? '('+n.section+') ':'') + (n.action? '['+n.action+'] ':'') + n.text);
      if(n.snippet) lines.push('    re: “'+n.snippet+'…”');
    });
    return lines.join('\n');
  }
  function sendAll(){
    if(!notes.length){ showToast('Add a note first'); return; }
    // Opens WhatsApp (app on phone, web on desktop) with all notes pre-filled.
    openTeamMessage(compose());
  }
  function toggleEmailMenu(){
    if(!notes.length){ showToast('Add a note first'); return; }
    byId('rv-emenu').classList.toggle('show');
  }
  function emailVia(provider){
    if(!notes.length){ showToast('Add a note first'); return; }
    var sub = encodeURIComponent(PROJECT+' — review notes ('+notes.length+')');
    var body = encodeURIComponent(compose());
    var to = TEAM_EMAIL, url;
    if(provider==='gmail')        url = 'https://mail.google.com/mail/?view=cm&fs=1&to='+to+'&su='+sub+'&body='+body;
    else if(provider==='outlook') url = 'https://outlook.live.com/mail/0/deeplink/compose?to='+to+'&subject='+sub+'&body='+body;
    else if(provider==='yahoo')   url = 'https://compose.mail.yahoo.com/?to='+to+'&subject='+sub+'&body='+body;
    else                          url = 'mailto:'+to+'?subject='+sub+'&body='+body;
    byId('rv-emenu').classList.remove('show');
    if(provider==='mail'){ location.href = url; } else { window.open(url, '_blank'); }
  }
  function copyAll(){
    var txt = compose(); if(!txt){ showToast('Add a note first'); return; }
    navigator.clipboard.writeText(txt).then(function(){ showToast('All notes copied ✓'); },
      function(){ showToast('Copy failed — use Send instead'); });
  }

  var toastT;
  function showToast(m){ toast.textContent=m; toast.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){toast.classList.remove('show');},2200); }

  function el(tag,id,html){ var e=document.createElement(tag); if(id)e.id=id; if(html!=null)e.innerHTML=html; return e; }
  function byId(id){ return document.getElementById(id); }
  function esc(s){ return (s||'').replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];}); }
})();
