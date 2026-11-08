'use strict';
(() => {
// =============================================================
// Assets
// =============================================================
const IMG = {};
const names = ['grass','grass_summer','grass_autumn','grass_winter','house','tree','tree_summer','tree_autumn','tree_winter',
  'crops','fence','chicken','cow','farmer','chest','road',
  'soldier_Idle','soldier_Walk','soldier_Attack01','soldier_Hurt','soldier_Death',
  'orc_Idle','orc_Walk','orc_Attack01','orc_Hurt','orc_Death'];
let loaded = 0; const onReady = [];
names.forEach(n => { const i = new Image(); i.onload = () => { if (++loaded === names.length) onReady.forEach(f=>f()); }; i.src = 'assets/img/' + n + '.png'; IMG[n] = i; });
const ready = () => loaded === names.length;
const now = () => performance.now();
const FR = { Idle:6, Walk:8, Attack01:6, Hurt:4, Death:4 };

// =============================================================
// Seasons
// =============================================================
const SEASONS = [
  {key:'spring', name:'Spring Meadow', short:'Spring', grass:'grass', tree:'tree', tint:null, path:'#b08a5a', pathDot:'#9a7548', speck:'#5f9d43', blurb:'Blossoms, seedlings and the first scouts.'},
  {key:'summer', name:'Summer Fields', short:'Summer', grass:'grass_summer', tree:'tree_summer', tint:'rgba(255,220,120,0.06)', path:'#c29a5e', pathDot:'#a8804a', speck:'#7fae35', blurb:'Ripe crops, fireflies, bolder raiders.'},
  {key:'autumn', name:'Autumn Woods', short:'Autumn', grass:'grass_autumn', tree:'tree_autumn', tint:'rgba(255,140,60,0.07)', path:'#9c6f42', pathDot:'#7d5532', speck:'#8f8a3c', blurb:'Falling leaves and a shorter clock.'},
  {key:'winter', name:'Winter Frost', short:'Winter', grass:'grass_winter', tree:'tree_winter', tint:'rgba(170,200,255,0.10)', path:'#8f9bb0', pathDot:'#76839a', speck:'#b9c9de', blurb:'Snow, silence, and the Orc Chief.'},
];

// =============================================================
// Challenge content
// =============================================================
const TYPES = {
  output:{label:'Guess the Output', secs:20, desc:'Read a tricky snippet in your language and pick what it prints.',
    icon:'<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/>'},
  bug:{label:'Spot the Bug', secs:25, desc:'The orc found a bug in your code. Click the exact line that is broken.',
    icon:'<rect x="8" y="6" width="8" height="12" rx="4"/><path d="M12 6V3M8 10H4M8 14H4M16 10h4M16 14h4"/>'},
  regex:{label:'Regex Defuse', secs:45, desc:'Write a regex that matches every safe wire and none of the traps. Live feedback as you type.',
    icon:'<path d="M12 3v8M8.5 5l7 4M15.5 5l-7 4"/><circle cx="6" cy="18" r="2"/>'},
  merge:{label:'Merge Conflict', secs:20, desc:'Two branches collide. Keep ours, keep theirs, or combine them correctly.',
    icon:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M18 11c0 4-6 4-10 6"/>'},
  prod:{label:'Prod Is Down', secs:30, desc:'Read the logs, find the cause, run the one command that fixes production.',
    icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>'},
  dive:{label:'Stack Dive', secs:15, desc:'Name a git command, HTTP code, Linux command and more. Rare answers land critical hits.',
    icon:'<path d="M12 3v14M6 11l6 6 6-6"/><path d="M4 21h16"/>'},
};
const MIXED = {label:'Mixed', desc:'A different challenge type every orc. The full Codeshire experience.'};
const TIER_PTS = {common:50, uncommon:120, rare:250, legendary:450};
const TIME_SCALE = [1, 0.9, 0.8, 0.7];
const ORCS_PER_LEVEL = 3;

// ---- Question bank: loaded from questions.json (embedded by index.php) ----
const QBANK = (() => {
  const empty = { languages: [], pool: {output:[],bug:[],regex:[],merge:[],prod:[],dive:[]}, problems: [], loaded: false };
  let raw = null;
  try { raw = JSON.parse(document.getElementById('questions-data').textContent); } catch (e) { raw = null; }
  if (!raw || typeof raw !== 'object' || !raw.questions) { empty.problems.push('questions.json is missing or is not valid JSON.'); return empty; }
  const isStr = v => typeof v === 'string' && v.trim() !== '';
  const strArr = (v, min, max) => Array.isArray(v) && v.length >= min && v.length <= max && v.every(x => typeof x === 'string');
  const idx = (a, n) => Number.isInteger(a) && a >= 0 && a < n;
  const languages = (Array.isArray(raw.languages) ? raw.languages : []).filter(l => l && isStr(l.id) && isStr(l.name) && /^[a-z0-9+#_-]{1,24}$/i.test(l.id)).slice(0, 20);
  const langIds = new Set(languages.map(l => l.id));
  const okLang = q => isStr(q.lang) && (q.lang === 'any' || langIds.has(q.lang));
  const check = {
    output: q => isStr(q.code) && strArr(q.opts, 2, 6) && idx(q.a, q.opts.length),
    bug:    q => isStr(q.file) && strArr(q.lines, 2, 30) && idx(q.a, q.lines.length),
    regex:  q => isStr(q.rule) && strArr(q.yes, 1, 12) && strArr(q.no, 1, 12) && isStr(q.answer) && (()=>{ try { new RegExp(q.answer); return true; } catch(e){ return false; } })(),
    merge:  q => isStr(q.file) && q.ours && q.theirs && isStr(q.ours.code) && isStr(q.theirs.code) && strArr(q.opts, 2, 4) && idx(q.a, q.opts.length),
    prod:   q => isStr(q.alert) && isStr(q.log) && strArr(q.commands, 2, 8) && idx(q.a, q.commands.length),
    dive:   q => isStr(q.ask) && q.tiers && typeof q.tiers === 'object' && Object.keys(q.tiers).some(k => TIER_PTS[k] && isStr(q.tiers[k])) && (()=>{ try { new RegExp(q.strip || ''); return true; } catch(e){ return false; } })(),
  };
  const pool = {}; const problems = [];
  for (const type of Object.keys(check)) {
    const list = Array.isArray(raw.questions[type]) ? raw.questions[type] : [];
    pool[type] = [];
    list.forEach((q, i) => {
      if (q && typeof q === 'object' && okLang(q) && check[type](q)) pool[type].push(Object.assign({ why: '' }, q));
      else problems.push(`${type} #${i + 1} skipped (missing field, wrong "a" index, or unknown lang "${q && q.lang}")`);
    });
  }
  if (problems.length && window.console) console.warn('[Codeshire] question file problems:\n' + problems.join('\n'));
  return { languages, pool, problems, loaded: true };
})();
const langName = id => (QBANK.languages.find(l => l.id === id) || {name: id === 'any' ? 'Any language' : id}).name;

// =============================================================
// Shared world drawing
// =============================================================
const GROUND = 160, SOLDIER_X = 196, ORC_STOP = 222;
function spr(ctx, img, sx, sy, sw, sh, dx, dy, flip=false, alpha=1){
  ctx.save(); ctx.globalAlpha = alpha;
  if (flip){ ctx.translate(dx+sw, dy); ctx.scale(-1,1); ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); }
  else ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
  ctx.restore();
}
function frameOf(e){
  const n = FR[e.anim]; const fps = e.anim==='Walk' ? 10 : 12;
  const f = Math.floor((now()-e.t0)/1000*fps);
  return e.loop ? f % n : Math.min(f, n-1);
}
function drawChar(ctx, prefix, e, flip, ax, ay, groundY, alpha=1){
  const img = IMG[prefix+'_'+e.anim]; const f = frameOf(e);
  const dx = Math.round(flip ? e.x - (100-ax) : e.x - ax);
  spr(ctx, img, f*100, 0, 100, 100, dx, groundY - ay, flip, alpha);
}
// world is 320 x 200; view = {x,y,w,h} in world coords
function drawWorld(ctx, season, view, t){
  const S = SEASONS[season];
  const g = IMG[S.grass], tr = IMG[S.tree];
  const x0 = Math.floor(view.x/16)*16, y0 = Math.floor(view.y/16)*16;
  for (let y=y0; y<view.y+view.h; y+=16) for (let x=x0; x<view.x+view.w; x+=16) ctx.drawImage(g,144,32,16,16,x,y,16,16);
  ctx.fillStyle = S.speck;
  for (let y=y0; y<view.y+view.h; y+=37) for (let x=x0; x<view.x+view.w; x+=53){
    const jx = x + ((y*13 + x*7) % 29), jy = y + ((x*5) % 23);
    ctx.fillRect(jx,jy,2,1); ctx.fillRect(jx+3,jy+1,1,2);
  }
  // road toward the right edge
  ctx.fillStyle = S.path; ctx.fillRect(170, GROUND-8, Math.max(160, view.x+view.w-170), 14);
  ctx.fillStyle = S.pathDot; for (let x=172; x<view.x+view.w; x+=11) ctx.fillRect(x, GROUND-2+((x*7)%5), 3, 2);
  // trees (back)
  ctx.drawImage(tr,96,1,32,46,214,12,32,46);
  ctx.drawImage(tr,96,1,32,46,250,2,32,46);
  ctx.drawImage(tr,71,14,20,33,288,20,20,33);
  ctx.drawImage(tr,96,1,32,46,92,-2,32,46);
  ctx.drawImage(tr,71,14,20,33,-14,96,20,33);
  // house
  ctx.drawImage(IMG.house,148,3,72,95,6,16,72,95);
  if (S.key==='winter'){ ctx.fillStyle='#eef4ff'; ctx.fillRect(16,20,52,3); ctx.fillRect(22,17,40,3); ctx.fillRect(30,14,24,3); }
  ctx.drawImage(IMG.chest,0,0,16,16,80,94,16,16);
  // field
  for (let r=0;r<2;r++) for (let c=0;c<5;c++){
    const x = 96+c*15, y = 112+r*13;
    if (S.key==='spring'){ const crop=[[48,16],[64,48],[64,16],[48,80],[64,80]]; const [sx,sy]=crop[(r*2+c)%5]; ctx.drawImage(IMG.crops,sx,sy,16,16,x,y,16,16); }
    else if (S.key==='summer'){ const crop=[[80,16],[80,48],[80,80],[80,112],[80,16]]; const [sx,sy]=crop[(r*2+c)%5]; ctx.drawImage(IMG.crops,sx,sy,16,16,x,y,16,16); }
    else if (S.key==='autumn'){ if ((r+c)%2===0) ctx.drawImage(IMG.crops,160,112,16,16,x,y,16,16); else { ctx.fillStyle='#7a5230'; ctx.fillRect(x+4,y+10,8,3); } }
    else { ctx.fillStyle='#e9f1ff'; ctx.fillRect(x+2,y+9,12,5); ctx.fillStyle='#c9d6ea'; ctx.fillRect(x+3,y+13,10,1); }
  }
  ctx.drawImage(IMG.fence,0,32,48,16,88,138,48,16);
  ctx.drawImage(IMG.fence,0,32,48,16,134,138,48,16);
  // front trees
  ctx.drawImage(tr,71,14,20,33,236,172,20,33);
  ctx.drawImage(tr,96,1,32,46,286,166,32,46);
  // animals + farmer
  const cf = Math.floor(t/300)%4;
  ctx.drawImage(IMG.cow, cf*32, 0, 32, 32, 20, 150, 32, 32);
  const ff = Math.floor(t/220)%4;
  ctx.drawImage(IMG.farmer, ff*32, 0, 32, 32, 144, 80, 32, 32);
}
function drawTint(ctx, season, w, h){ const tint = SEASONS[season].tint; if (tint){ ctx.fillStyle = tint; ctx.fillRect(0,0,w,h); } }

// weather particles (view space)
function makeParticles(n){ return Array.from({length:n}, () => ({x:Math.random(), y:Math.random(), s:Math.random(), p:Math.random()*6.28})); }
function drawWeather(ctx, season, parts, w, h, dt, t){
  const k = SEASONS[season].key;
  parts.forEach(p=>{
    if (k==='spring'){ p.x += dt*0.00002; p.y += dt*0.00004*(0.6+p.s); }
    else if (k==='summer'){ p.y -= dt*0.000008; p.x += Math.sin(t/900+p.p)*0.0003; }
    else if (k==='autumn'){ p.y += dt*0.00005*(0.6+p.s); p.x += Math.sin(t/500+p.p)*0.0012; }
    else { p.y += dt*0.00006*(0.5+p.s); p.x += Math.sin(t/700+p.p)*0.0005; }
    if (p.y>1.02) { p.y = -0.02; p.x = Math.random(); } if (p.y<-0.02) p.y = 1.02; if (p.x>1.02) p.x = -0.02; if (p.x<-0.02) p.x = 1.02;
    const x = Math.round(p.x*w), y = Math.round(p.y*h);
    if (k==='spring'){ ctx.fillStyle = p.s>0.5 ? '#ffc4dc' : '#ffffff'; ctx.fillRect(x,y,2,1); ctx.fillRect(x+1,y+1,1,1); }
    else if (k==='summer'){ const a = 0.4+0.6*Math.abs(Math.sin(t/400+p.p)); ctx.fillStyle = `rgba(255,236,120,${a})`; ctx.fillRect(x,y,1,1); if (p.s>0.7) ctx.fillRect(x+1,y,1,1); }
    else if (k==='autumn'){ ctx.fillStyle = p.s>0.5 ? '#e0702a' : '#c2421f'; ctx.fillRect(x,y,2,2); ctx.fillStyle='#f2a24a'; ctx.fillRect(x,y,1,1); }
    else { ctx.fillStyle = '#ffffff'; ctx.fillRect(x,y,p.s>0.6?2:1,p.s>0.6?2:1); }
  });
}

// =============================================================
// Landing island
// =============================================================
const isl = document.getElementById('island'), ictx = isl.getContext('2d'); ictx.imageSmoothingEnabled = false;
const ROWS = {2:[7,14],3:[5,16],4:[4,17],5:[3,18],6:[3,18],7:[3,18],8:[4,18],9:[4,17],10:[5,16],11:[7,14]};
const inIsland = (c,r) => ROWS[r] && c>=ROWS[r][0] && c<=ROWS[r][1];
const islParts = makeParticles(14);
const raftOrc = {x:0, anim:'Idle', t0:0, loop:true};
const dockSoldier = {x:0, anim:'Idle', t0:0, loop:true};
let islLast = now();
function drawIsland(){
  const t = now(), dt = t-islLast; islLast = t;
  const c = ictx; c.clearRect(0,0,352,256);
  // water sparkles
  for (let i=0;i<26;i++){
    const x = (i*67 + Math.floor(t/90)%7) % 352, y = (i*41) % 256;
    if (inIsland(Math.floor(x/16), Math.floor(y/16)) || inIsland(Math.floor(x/16), Math.floor(y/16)-1)) continue;
    const a = 0.25 + 0.35*Math.abs(Math.sin(t/700 + i)); c.fillStyle = `rgba(190,225,255,${a})`; c.fillRect(x,y,4,1); c.fillRect(x+6,y,2,1);
  }
  // cliffs + foam
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++){
    if (!inIsland(col, +r+1)){
      const x = col*16, y = (+r+1)*16;
      c.fillStyle='#8a5a36'; c.fillRect(x,y,16,5); c.fillStyle='#6d4428'; c.fillRect(x,y+5,16,6); c.fillStyle='#4e2f1b'; c.fillRect(x,y+11,16,3);
      c.fillStyle='#a06a42'; c.fillRect(x+((col*5)%11),y+2,3,1);
      const fo = 0.35+0.25*Math.sin(t/500+col); c.fillStyle=`rgba(200,235,255,${fo})`; c.fillRect(x+1,y+15,14,1);
    }
  }}
  // grass
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++) c.drawImage(IMG.grass,144,32,16,16,col*16,r*16,16,16); }
  // grass rim
  c.fillStyle='#3f7a2e';
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++){
    const x=col*16, y=r*16;
    if (!inIsland(col,+r-1)) c.fillRect(x,y,16,1);
    if (!inIsland(col-1,+r)) c.fillRect(x,y,1,16);
    if (!inIsland(col+1,+r)) c.fillRect(x+15,y,1,16);
  }}
  c.fillStyle='#5f9d43'; for (let i=0;i<30;i++){ const x=60+((i*37)%220), y=40+((i*53)%140); if (inIsland(Math.floor(x/16),Math.floor(y/16))) { c.fillRect(x,y,2,1); c.fillRect(x+3,y+1,1,2);} }
  // tilled field
  c.fillStyle='#8b5a36'; c.fillRect(72,90,64,46); c.fillStyle='#6f4528'; for (let y=94;y<136;y+=8) c.fillRect(74,y,60,2);
  const crop=[[80,16],[80,48],[80,80],[96,16]];
  for (let r=0;r<3;r++) for (let col=0;col<4;col++){ const [sx,sy]=crop[(r+col)%4]; c.drawImage(IMG.crops,sx,sy,16,16,74+col*15,86+r*14,16,16); }
  // path + dock
  c.fillStyle='#d9a066'; c.fillRect(196,124,22,68); c.fillStyle='#b9824b'; c.fillRect(196,124,2,68); c.fillRect(216,124,2,68);
  c.drawImage(IMG.road,0,0,16,16,198,150,16,16);
  c.fillStyle='#7a4a2e'; c.fillRect(194,192,26,44); c.fillStyle='#5e3822'; for (let y=196;y<236;y+=6) c.fillRect(194,y,26,1);
  c.fillStyle='#4e2f1b'; c.fillRect(194,236,4,6); c.fillRect(216,236,4,6);
  // boat
  const bob = Math.round(Math.sin(t/600)*1.5);
  c.fillStyle='#6d4428'; c.fillRect(170,226+bob,20,7); c.fillStyle='#8a5a36'; c.fillRect(172,224+bob,16,3); c.fillStyle='#4e2f1b'; c.fillRect(173,233+bob,14,2);
  // trees, house, animals
  c.drawImage(IMG.tree,96,1,32,46,66,26,32,46);
  c.drawImage(IMG.tree,71,14,20,33,108,40,20,33);
  c.drawImage(IMG.tree,96,1,32,46,246,108,32,46);
  c.drawImage(IMG.tree,71,14,20,33,272,74,20,33);
  c.drawImage(IMG.tree,71,14,20,33,58,136,20,33);
  c.drawImage(IMG.house,148,3,72,95,162,32,72,95);
  c.drawImage(IMG.chest,0,0,16,16,236,112,16,16);
  const cf = Math.floor(t/300)%4; c.drawImage(IMG.cow, cf*32,0,32,32, 228,140,32,32);
  const ff = Math.floor(t/220)%4; c.drawImage(IMG.farmer, ff*32,0,32,32, 136,100,32,32);
  [[150,150,0],[124,160,1],[170,166,2]].forEach(([x,y,o])=>{ const f=Math.floor(t/180+o)%4; c.drawImage(IMG.chicken,f*16,0,16,16,x,y,16,16); });
  // soldier on dock, orc on raft
  dockSoldier.x = 207; drawChar(c,'soldier',dockSoldier,false,50,61,226);
  const rx = 300 + Math.round(Math.sin(t/1400)*6), ry = 214 + Math.round(Math.sin(t/650)*1.5);
  c.fillStyle='#6d4428'; c.fillRect(rx-14,ry,28,6); c.fillStyle='#8a5a36'; for (let i=0;i<4;i++) c.fillRect(rx-14+i*7,ry,6,2);
  raftOrc.x = rx; drawChar(c,'orc',raftOrc,true,54,60,ry+2);
  drawWeather(c, 0, islParts, 352, 256, dt, t);
  if (!document.getElementById('landing').hidden) requestAnimationFrame(drawIsland);
}

// season thumbnails
function renderThumb(canvas, season){
  canvas.width = 320; canvas.height = 200; const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  drawWorld(c, season, {x:0,y:0,w:320,h:200}, 0);
  drawChar(c,'soldier',{x:SOLDIER_X,anim:'Idle',t0:now(),loop:true},false,50,61,GROUND);
  drawChar(c,'orc',{x:ORC_STOP,anim:'Idle',t0:now(),loop:true},true,54,60,GROUND);
  drawTint(c, season, 320, 200);
  drawWeather(c, season, makeParticles(40), 320, 200, 0, 0);
}

// =============================================================
// Landing + select markup
// =============================================================
const esc = s => String(s).replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const icon = path => `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>`;
document.getElementById('cgrid').innerHTML = Object.values(TYPES).map(t=>`<div class="cinfo">${icon(t.icon)}<h3>${t.label}</h3><p>${t.desc}</p></div>`).join('');
document.getElementById('sgrid').innerHTML = SEASONS.map((s,i)=>`<div class="scard"><canvas class="px" data-season="${i}"></canvas><div><strong>Level ${i+1} · ${s.name}</strong><span>${s.blurb}</span></div></div>`).join('');
// ---- language choice ----
let selectedLang = 'all';
try { const saved = localStorage.getItem('codeshire.lang'); if (saved && (saved==='all' || QBANK.languages.some(l=>l.id===saved))) selectedLang = saved; } catch(e) {}
const langLabel = id => id==='all' ? 'All languages' : langName(id);
function poolFor(type, lang = selectedLang){ return QBANK.pool[type].filter(q => lang==='all' || q.lang==='any' || q.lang===lang); }
function renderLangs(){
  const opts = [{id:'all', name:'All languages'}].concat(QBANK.languages);
  document.getElementById('langs').innerHTML = opts.map(l=>`<button class="lang" data-lang="${esc(l.id)}" aria-pressed="${l.id===selectedLang}">${esc(l.name)}</button>`).join('');
}
function renderSelect(){
  renderLangs();
  const ln = langLabel(selectedLang);
  const avail = Object.keys(TYPES).filter(k=>poolFor(k).length>0);
  document.getElementById('selgrid').innerHTML =
    Object.entries(TYPES).map(([k,t])=>{ const n = poolFor(k).length;
      return `<button class="ccard" data-mode="${k}" ${n?'':'disabled'}>${icon(t.icon)}<h3>${t.label}</h3><p>${t.desc}</p><span class="meta">${n ? `${n} questions · ${t.secs}s each` : (QBANK.loaded ? `No ${esc(ln)} questions yet` : 'No questions loaded')}</span></button>`; }).join('') +
    `<button class="ccard mixed" data-mode="mixed" ${avail.length?'':'disabled'}>${icon('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>')}<div style="display:flex;flex-direction:column;gap:6px;flex:1"><h3>${MIXED.label}</h3><p>${MIXED.desc}</p></div><span class="btn" style="display:inline-flex;align-items:center">Play mixed</span></button>`;
  const warn = document.getElementById('qwarn');
  if (!QBANK.loaded) { warn.hidden = false; warn.textContent = 'The question file could not be loaded, so there is nothing to play yet. Check questions.json on the server.'; }
}
renderSelect();
document.getElementById('langs').addEventListener('click', e=>{
  const b = e.target.closest('[data-lang]'); if (!b) return;
  selectedLang = b.dataset.lang; try { localStorage.setItem('codeshire.lang', selectedLang); } catch(err) {}
  renderSelect();
});
document.getElementById('journey').innerHTML = SEASONS.map((s,i)=>`<div class="jstep"><canvas class="px" data-season="${i}"></canvas><span>Lv${i+1} · ${s.short}${i===3?' + Chief':''}</span></div>`).join('');
onReady.push(()=>{ document.querySelectorAll('canvas[data-season]').forEach(cv=>renderThumb(cv, +cv.dataset.season)); requestAnimationFrame(drawIsland); });

// =============================================================
// Views
// =============================================================
const views = {landing:document.getElementById('landing'), select:document.getElementById('select'), game:document.getElementById('game'), suggest:document.getElementById('suggest')};
function show(v){
  Object.entries(views).forEach(([k,el])=>el.hidden = k!==v);
  window.scrollTo(0,0);
  try {
    if (v==='suggest' && location.hash!=='#suggest') history.replaceState(null, '', '#suggest');
    else if (v!=='suggest' && location.hash==='#suggest') history.replaceState(null, '', location.pathname + location.search);
  } catch(e) {}
  if (v==='suggest') openSuggest();
  if (v==='landing' && ready()) { islLast = now(); requestAnimationFrame(drawIsland); }
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click', ()=>{ if (b.dataset.go==='select') abortGame(); show(b.dataset.go); }));
isl.addEventListener('click', ()=>show('select'));
document.getElementById('selgrid').addEventListener('click', e=>{ const b = e.target.closest('[data-mode]'); if (b && !b.disabled) startGame(b.dataset.mode); });
document.getElementById('quit').addEventListener('click', ()=>{ abortGame(); show('select'); });

// ---- hash routing for the suggestions page ----
function route(){
  if (location.hash==='#suggest'){ abortGame(); show('suggest'); return; }
  if (!views.suggest.hidden || !views.select.hidden){
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    show('landing'); if (target && views.landing.contains(target)) target.scrollIntoView();
  }
}
window.addEventListener('hashchange', route);

// ---- suggestion form ----
const sgForm = document.getElementById('sgform'), sgStatus = document.getElementById('sg-status');
const sgMsg = document.getElementById('sg-msg'), sgSend = document.getElementById('sg-send');
function sgSay(text, ok){ sgStatus.textContent = text; sgStatus.className = 'sgmsg ' + (ok===true?'ok':ok===false?'no':''); }
async function sgToken(){
  try {
    const r = await fetch('suggest.php', {method:'GET', credentials:'same-origin', cache:'no-store'});
    const j = await r.json(); if (j && typeof j.token==='string') document.getElementById('sg-token').value = j.token;
  } catch(e) { /* offline: the submit will report it */ }
}
function openSuggest(){ sgToken(); }
sgMsg.addEventListener('input', ()=>{ document.getElementById('sg-count').textContent = sgMsg.value.length + ' / 1000'; });
sgForm.addEventListener('submit', async e=>{
  e.preventDefault();
  if (sgMsg.value.trim().length < 10){ sgSay('Please write at least 10 characters.', false); sgMsg.focus(); return; }
  const email = document.getElementById('sg-email');
  if (email.value && !email.checkValidity()){ sgSay('That email address does not look right.', false); email.focus(); return; }
  sgSend.disabled = true; sgSay('Sending…');
  try {
    const r = await fetch('suggest.php', {method:'POST', body:new FormData(sgForm), credentials:'same-origin', cache:'no-store'});
    let j = {}; try { j = await r.json(); } catch(err) {}
    if (r.ok && j.ok){ sgForm.reset(); document.getElementById('sg-count').textContent = '0 / 1000'; sgSay('Thank you! Your suggestion has been sent.', true); }
    else sgSay(typeof j.error==='string' ? j.error : 'Could not send right now. Please try again later.', false);
  } catch(err) { sgSay('Could not reach the server. Check your connection and try again.', false); }
  sgSend.disabled = false; sgToken();
});

// =============================================================
// Game
// =============================================================
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const gview = document.getElementById('gview'), panel = document.getElementById('panel');
const ov = document.getElementById('ov'), ocard = document.getElementById('ocard');
const cam = {x:0,y:0,w:320,h:200};
function fitCanvas(){
  const r = gview.getBoundingClientRect(); if (!r.width || !r.height) return;
  // aim to show ~300 world px across, keep height sane, and never zoom out past 130 px wide
  let s = Math.min(r.height/200, r.width/300);
  if (r.height/s > 330) s = r.height/330;
  if (r.width/s < 130) s = r.width/130;
  const w = r.width/s, h = r.height/s;
  cv.width = Math.round(w); cv.height = Math.round(h); ctx.imageSmoothingEnabled = false;
  cam.w = cv.width; cam.h = cv.height;
  cam.x = cam.w >= 320 ? (320-cam.w)/2 : Math.max(0, Math.min(320-cam.w, 302 - cam.w));
  cam.y = cam.h > 200 ? Math.min((200-cam.h)/2, GROUND + 60 - cam.h*0.72) : 0;
  cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
}
new ResizeObserver(fitCanvas).observe(gview);

const G = { lang:'all', mode:'mixed', level:0, orcIdx:0, hp:3, score:0, streak:0, used:{}, ch:null, deadline:0, phase:'off', token:0, mixedQueue:[] };
const soldier = { x:SOLDIER_X, anim:'Idle', t0:0, loop:true };
let orc = null; const fx = []; let shakeUntil = 0;
let weather = makeParticles(70);
const chickens = [{x:62,y:166,d:1,f:0},{x:106,y:160,d:-1,f:1},{x:130,y:171,d:1,f:2}];
function setAnim(e, anim, loop=false){ e.anim = anim; e.t0 = now(); e.loop = loop; }
const animDur = anim => FR[anim]/12*1000;
function later(fn, ms){ const tok = G.token; setTimeout(()=>{ if (tok===G.token) fn(); }, ms); }

let last = now();
function loop(){
  const t = now(), dt = Math.min(50, t-last); last = t;
  if (!views.game.hidden && ready() && cv.width){
    ctx.save();
    ctx.clearRect(0,0,cv.width,cv.height);
    if (t < shakeUntil) ctx.translate(Math.round((Math.random()-.5)*4), Math.round((Math.random()-.5)*3));
    ctx.translate(-cam.x, -cam.y);
    drawWorld(ctx, G.level, cam, t);
    if (SEASONS[G.level].key!=='winter' || true){
      chickens.forEach(c=>{ c.x += c.d*dt*0.006; if (c.x<62||c.x>150) c.d*=-1; const f=Math.floor(t/180+c.f)%4; spr(ctx, IMG.chicken, f*16,0,16,16, Math.round(c.x), c.y, c.d<0); });
    }
    if (orc && orc.hp>0 && G.phase!=='off'){ ctx.fillStyle='#fff'; ctx.fillRect(158,72,7,9); ctx.fillStyle='#e0402a'; ctx.fillRect(160,73,3,5); ctx.fillRect(160,79,3,1); }
    if (orc && G.phase==='walking'){
      orc.x -= dt*0.05;
      if (orc.x <= ORC_STOP){ orc.x = ORC_STOP; setAnim(orc,'Idle',true); startChallenge(); }
    }
    drawChar(ctx,'soldier',soldier,false,50,61,GROUND);
    if (orc){
      if (orc.boss){ ctx.save(); ctx.translate(orc.x,GROUND); ctx.scale(1.4,1.4); ctx.translate(-orc.x,-GROUND); drawChar(ctx,'orc',orc,true,54,60,GROUND,orc.alpha); ctx.restore(); }
      else drawChar(ctx,'orc',orc,true,54,60,GROUND,orc.alpha);
      if (orc.hp>0){ const w=orc.maxHp*7, x0=Math.round(orc.x-w/2-2), y0=GROUND-30-(orc.boss?10:0);
        for (let i=0;i<orc.maxHp;i++){ ctx.fillStyle='#0B0F14'; ctx.fillRect(x0+i*7,y0,6,4); ctx.fillStyle=i<orc.hp?'#e0402a':'#3a2222'; ctx.fillRect(x0+i*7+1,y0+1,4,2); } }
    }
    for (let i=fx.length-1;i>=0;i--){
      const p = fx[i], k = (t-p.t0)/1100; if (k>=1){ fx.splice(i,1); continue; }
      ctx.save(); ctx.globalAlpha=1-k; ctx.font='bold 9px "Pixelify Sans", monospace'; ctx.textAlign='center';
      ctx.fillStyle='#0B0F14'; ctx.fillText(p.text,p.x+1,p.y-k*18+1); ctx.fillStyle=p.color; ctx.fillText(p.text,p.x,p.y-k*18); ctx.restore();
    }
    ctx.restore();
    drawTint(ctx, G.level, cv.width, cv.height);
    drawWeather(ctx, G.level, weather, cv.width, cv.height, dt, t);
    if (G.phase==='challenge' && G.ch) tickTimer();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pick(type){
  const pool = poolFor(type, G.lang); G.used[type] = G.used[type] || [];
  if (G.used[type].length >= pool.length) G.used[type] = [];
  let i; do { i = Math.floor(Math.random()*pool.length); } while (G.used[type].includes(i));
  G.used[type].push(i); return pool[i];
}
function nextMixedType(){ if (!G.mixedQueue.length) G.mixedQueue = shuffle(Object.keys(TYPES).filter(k=>poolFor(k, G.lang).length)); return G.mixedQueue.pop(); }

function abortGame(){ G.token++; G.phase='off'; orc=null; ov.hidden=true; }
function startGame(mode){
  abortGame();
  Object.assign(G, {lang:selectedLang, mode, level:0, orcIdx:0, hp:3, score:0, streak:0, used:{}, ch:null, phase:'walking', mixedQueue:[]});
  weather = makeParticles(70);
  setAnim(soldier,'Idle',true);
  show('game'); fitCanvas(); updateHud();
  document.getElementById('modeChip').textContent = (mode==='mixed' ? MIXED.label : TYPES[mode].label) + ' · ' + langLabel(G.lang);
  const portrait = innerWidth < 560 && innerHeight > innerWidth;
  levelIntro(portrait);
}
function levelIntro(tip){
  const S = SEASONS[G.level];
  G.phase = 'intro';
  ocard.innerHTML = `<h2>Level ${G.level+1} · ${S.name}</h2><p>${S.blurb}</p>
    <p class="mono" style="font-size:13px">${ORCS_PER_LEVEL} orcs${G.level===3?', the last one is the Orc Chief':''} · timer ×${TIME_SCALE[G.level]}</p>
    ${tip?'<p class="tip">Tip: turn your phone sideways for more room.</p>':''}
    <div class="row"><button class="btn" id="go1">Begin</button></div>`;
  ov.hidden = false;
  renderIdle(`${S.name} begins`, 'Press Begin when you\'re ready.');
  document.getElementById('go1').onclick = ()=>{ ov.hidden = true; G.orcIdx = 0; spawnOrc(); };
}
function spawnOrc(){
  updateHud();
  const boss = G.level===3 && G.orcIdx===ORCS_PER_LEVEL-1;
  orc = { x: cam.x + cam.w + 30, anim:'Walk', t0:now(), loop:true, hp:boss?2:1, maxHp:boss?2:1, boss, alpha:1 };
  G.phase = 'walking';
  renderIdle(boss ? 'The Orc Chief approaches!' : `Orc ${G.orcIdx+1} of ${ORCS_PER_LEVEL} is coming…`, boss ? 'Two correct answers to bring him down.' : 'Its challenge appears when it reaches your soldier.');
}
function startChallenge(){
  G.phase = 'challenge';
  const type = G.mode==='mixed' ? nextMixedType() : G.mode;
  const q = pick(type);
  const secs = Math.round(TYPES[type].secs * TIME_SCALE[G.level]);
  G.ch = { type, q, secs, answered:false };
  G.deadline = now() + secs*1000;
  renderChallenge();
}
function orcDefeated(){
  G.orcIdx++;
  if (G.orcIdx >= ORCS_PER_LEVEL){
    if (G.level === 3){ endCard(true); return; }
    const S = SEASONS[G.level], N = SEASONS[G.level+1];
    const healed = G.hp < 3; if (healed) G.hp++; updateHud();
    G.phase = 'between';
    ocard.innerHTML = `<h2>${S.short} cleared!</h2><p>${healed?'You recovered a heart. ':''}The season turns… next up: <strong style="color:var(--leaf)">${N.name}</strong>.</p>
      <p class="mono" style="font-size:14px;color:var(--text)">Score ${G.score.toLocaleString('en-IN')}</p>
      <div class="row"><button class="btn" id="go2">Continue</button></div>`;
    ov.hidden = false;
    renderIdle(`${S.short} cleared`, 'The season is changing.');
    document.getElementById('go2').onclick = ()=>{ G.level++; weather = makeParticles(70); updateHud(); levelIntro(false); };
  } else spawnOrc();
}
function resolve(correct, info){
  if (!G.ch || G.ch.answered) return;
  G.ch.answered = true; G.phase = 'resolve';
  const left = Math.max(0, (G.deadline - now())/1000);
  showFeedback(correct, info);
  if (correct){
    G.streak++;
    const mult = Math.min(3, 1 + (G.streak-1)*0.25);
    const gained = Math.round(((info && info.pts) || 100) + Math.round(left)*10) * mult | 0;
    G.score += gained; updateHud();
    setAnim(soldier,'Attack01');
    later(()=>{ orc.hp--; setAnim(orc,'Hurt'); fx.push({text:(info&&info.crit?'CRITICAL! ':'')+'+'+gained, x:orc.x, y:GROUND-32, t0:now(), color:info&&info.crit?'#F2C94C':'#B8F35A'}); }, animDur('Attack01')*0.5);
    later(()=>{ setAnim(soldier,'Idle',true);
      if (orc.hp<=0){ setAnim(orc,'Death'); fadeOrc(); later(()=>{ orc=null; orcDefeated(); }, 1600); }
      else { setAnim(orc,'Idle',true); later(startChallenge, 1600); }
    }, animDur('Attack01')+250);
  } else {
    G.streak = 0; updateHud();
    setAnim(orc,'Attack01');
    later(()=>{ G.hp--; updateHud(); setAnim(soldier,'Hurt'); shakeUntil=now()+300; fx.push({text:'-1 HP', x:soldier.x, y:GROUND-32, t0:now(), color:'#FF8A3D'}); }, animDur('Attack01')*0.5);
    later(()=>{ setAnim(orc,'Idle',true);
      if (G.hp<=0){ setAnim(soldier,'Death'); later(()=>endCard(false), 1400); }
      else { setAnim(soldier,'Idle',true); later(startChallenge, 2400); }
    }, animDur('Attack01')+350);
  }
}
function fadeOrc(){ const t0=now(), o=orc; const step=()=>{ if(orc!==o) return; const k=(now()-t0)/1500; o.alpha=Math.max(0,1-Math.max(0,k-0.4)/0.6); if(k<1) requestAnimationFrame(step); }; step(); }
function tickTimer(){
  const left = Math.max(0, G.deadline - now()), total = G.ch.secs*1000;
  const el = document.getElementById('tm'), bar = document.getElementById('tb');
  if (el){ el.textContent = (left/1000).toFixed(1)+'s'; bar.style.width = (left/total*100)+'%'; el.parentElement.classList.toggle('low', left<5000); }
  if (left<=0) resolve(false, {timeout:true});
}

// HUD
const heart = full => full
 ? '<svg viewBox="0 0 24 24" fill="#FF8A3D" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>'
 : '<svg viewBox="0 0 24 24" fill="none" stroke="#5A6675" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>';
function updateHud(){
  const h = document.getElementById('hearts'); h.innerHTML = [0,1,2].map(i=>heart(i<G.hp)).join(''); h.setAttribute('aria-label', G.hp+' of 3 lives');
  document.getElementById('orcs').textContent = Math.min(G.orcIdx+1, ORCS_PER_LEVEL)+'/'+ORCS_PER_LEVEL;
  document.getElementById('streak').textContent = '×'+(Math.min(3, 1+Math.max(0,G.streak-1)*0.25)).toString().slice(0,4);
  document.getElementById('score').textContent = G.score.toLocaleString('en-IN');
  const S = SEASONS[G.level]; const sc = document.getElementById('seasonChip'); sc.textContent = `Lv${G.level+1} · ${S.short}`;
}

// Panel
function head(){
  const t = TYPES[G.ch.type];
  return `<div class="ptop"><span class="badge">${t.label}${orc && orc.boss ? ' · Chief' : ''}</span>
    <span class="timer"><span class="tbar"><i id="tb" style="width:100%"></i></span><span id="tm">${G.ch.secs}.0s</span></span></div>`;
}
function renderIdle(title, sub){ panel.innerHTML = `<div class="idle"><strong>${esc(title)}</strong><span>${esc(sub)}</span></div>`; }
function renderChallenge(){
  const {type,q} = G.ch; let html = head();
  if (type==='output'){
    html += `<p class="prompt">What does this print? <span class="sub mono">(${esc(langName(q.lang))})</span></p><pre class="code">${esc(q.code)}</pre>
      <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd>${esc(o)}</button>`).join('')}</div>`;
  } else if (type==='bug'){
    html += `<p class="prompt">The orc found a bug in <code class="hl">${esc(q.file)}</code>. Click the broken line.</p>
      <div class="lines">${q.lines.map((l,i)=>`<button class="line" data-i="${i}"><span class="n">${i+1}</span>${esc(l)||' '}</button>`).join('')}</div>`;
  } else if (type==='regex'){
    html += `<p class="prompt">Defuse the bomb: <span class="hl">${esc(q.rule)}</span></p>
      <div class="field"><label class="rxwrap" for="rx">/<input id="rx" maxlength="120" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="regex">/</label><button class="btn" id="go">Defuse</button></div>
      <div id="rxmsg" class="sub">Green rows must match, orange rows must not.</div><div class="cases" id="cases"></div>`;
  } else if (type==='merge'){
    html += `<p class="prompt">Conflict in <code class="hl">${esc(q.file)}</code>. Pick the right resolution.</p>
      <pre class="code"><span style="color:var(--muted)">&lt;&lt;&lt;&lt;&lt;&lt;&lt; ${esc(q.ours.branch || 'ours')}</span>
<span style="color:#7cc7f7">${esc(q.ours.code)}</span>
<span style="color:var(--muted)">=======</span>
<span style="color:#ffb27a">${esc(q.theirs.code)}</span>
<span style="color:var(--muted)">&gt;&gt;&gt;&gt;&gt;&gt;&gt; ${esc(q.theirs.branch || 'theirs')}</span></pre>
      <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd>${esc(o)}</button>`).join('')}</div>`;
  } else if (type==='prod'){
    html += `<p class="prompt"><span style="color:var(--orange)">SEV-1:</span> ${esc(q.alert)}</p><div class="term"><pre>${esc(q.log)}</pre></div>
      <div class="field"><input class="inp" id="cmd" maxlength="160" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="$ type or pick a command" aria-label="command"><button class="btn" id="go">Run</button></div>
      <div class="chips">${q.commands.map((c,i)=>`<button class="chip" data-i="${i}">${esc(c)}</button>`).join('')}</div>`;
  } else if (type==='dive'){
    html += `<p class="prompt">${esc(q.ask).replace(/\{([^}]{1,40})\}/g,'<span class="hl">$1</span>')}.</p><p class="sub" style="margin:0">Any valid answer hits. Rare answers land critical hits.</p>
      <div class="field"><input class="inp" id="dv" maxlength="60" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="your answer" aria-label="your answer"><button class="btn" id="go">Strike</button></div>
      <div class="tiers"><span>common +50</span><span style="color:#7cc7f7">uncommon +120</span><span class="hl">rare +250</span><span style="color:var(--gold)">legendary +450</span></div>`;
  }
  panel.innerHTML = html; panel.scrollTop = 0; wire();
}
function wire(){
  const {type,q} = G.ch;
  const focus = el => { if (matchMedia('(pointer:fine)').matches) el.focus(); };
  if (type==='output' || type==='merge' || type==='bug'){
    const sel = type==='bug' ? '.line' : '.opt';
    panel.querySelectorAll(sel).forEach(b=>b.onclick=()=>{
      const i=+b.dataset.i, ok = i===q.a;
      b.classList.add(ok?'right':'wrong'); if(!ok) panel.querySelector(`${sel}[data-i="${q.a}"]`).classList.add('right');
      panel.querySelectorAll(sel).forEach(x=>x.disabled=true);
      resolve(ok, {why:q.why});
    });
  } else if (type==='regex'){
    const inp = document.getElementById('rx'); focus(inp);
    const check = ()=>{
      let re=null, err=''; const src = inp.value;
      if (src){ try { re = new RegExp(src); } catch(e){ err='Invalid regex'; } }
      let all = !!re;
      document.getElementById('cases').innerHTML = q.yes.map(s=>({s,want:true})).concat(q.no.map(s=>({s,want:false}))).map(r=>{
        const got = re ? re.test(r.s) : null, ok = got===r.want; if(!ok) all=false;
        return `<div class="case ${re?(ok?'ok':'bad'):''}"><span>${esc(r.s)}</span><em>${r.want?'<span class="okc">match</span>':'<span class="err">skip</span>'}${re?(ok?' ✓':' ✗'):''}</em></div>`;
      }).join('');
      document.getElementById('rxmsg').innerHTML = err ? `<span class="err">${err}</span>` : re ? (all?'<span class="okc">All wires correct. Defuse!</span>':'Not yet: fix the ✗ rows.') : 'Green rows must match, orange rows must not.';
      return all;
    };
    inp.oninput = check; check();
    const go = ()=>{ const ok = check(); inp.disabled = true; resolve(ok, {why: ok ? 'Clean regex.' : 'One answer: /'+q.answer+'/'}); };
    document.getElementById('go').onclick = go; inp.onkeydown = e=>{ if(e.key==='Enter') go(); };
  } else if (type==='prod'){
    const inp = document.getElementById('cmd'); focus(inp);
    panel.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{ inp.value = q.commands[+c.dataset.i]; });
    const go = ()=>{ const v = inp.value.trim().replace(/\s+/g,' '); if(!v) return; const ok = v===q.commands[q.a]; inp.disabled = true;
      resolve(ok, {why:(ok?'':'The fix: '+q.commands[q.a]+'. ')+q.why}); };
    document.getElementById('go').onclick = go; inp.onkeydown = e=>{ if(e.key==='Enter') go(); };
  } else if (type==='dive'){
    const inp = document.getElementById('dv'); focus(inp);
    const go = ()=>{
      let v = inp.value.trim(); if(!v) return; v = v.replace(new RegExp(q.strip || '^\\b$', 'gi'),'').trim();
      let tier = null;
      for (const [tn,list] of Object.entries(q.tiers)) if (list.split(' ').some(w=>w.toLowerCase()===v.toLowerCase())){ tier=tn; break; }
      inp.disabled = true;
      const col = {legendary:'var(--gold)',rare:'var(--lime)',uncommon:'#7cc7f7',common:'var(--text)'};
      if (tier) resolve(true, {pts:TIER_PTS[tier], crit:tier==='rare'||tier==='legendary', html:true, why:`<strong>${esc(v)}</strong> is <strong style="color:${col[tier]}">${tier}</strong>.`});
      else resolve(false, {html:true, why:`“${esc(v)}” isn't on the list.`});
    };
    document.getElementById('go').onclick = go; inp.onkeydown = e=>{ if(e.key==='Enter') go(); };
  }
}
function showFeedback(ok, info){
  const msg = info && info.timeout ? 'Too slow! The orc swings.' : ok ? 'Direct hit!' : 'Miss! The orc strikes back.';
  const why = info && info.why ? (info.html ? info.why : esc(info.why)) : '';
  const d = document.createElement('div'); d.className = 'feedback ' + (ok?'ok':'no'); d.innerHTML = `<strong>${msg}</strong> ${why}`;
  panel.appendChild(d); d.scrollIntoView({block:'nearest', behavior:'smooth'});
  const tm = document.getElementById('tm'); if (tm) tm.parentElement.style.visibility='hidden';
}
function endCard(win){
  G.phase = 'off';
  const label = (G.mode==='mixed' ? 'Mixed' : TYPES[G.mode].label) + ' · ' + langLabel(G.lang);
  const txt = `Codeshire · ${label}: ${win?'all 4 seasons cleared':'fell in '+SEASONS[G.level].short} · ${G.score} pts · ${'♥'.repeat(Math.max(0,G.hp))}${'♡'.repeat(3-Math.max(0,G.hp))}`;
  ocard.innerHTML = `<h2>${win?'The farm survives the year!':'The orcs got through…'}</h2>
    <p>${win?'The Orc Chief is down and Farmer Tom owes you a basket of strawberries.':'Farmer Tom is hiding in the barn. Have another go?'}</p>
    <p class="mono" style="color:var(--text);font-size:22px">${G.score.toLocaleString('en-IN')} pts</p>
    <div class="row"><button class="btn" id="again">Play again</button><button class="btn ghost small" id="other">Other challenge</button><button class="btn ghost small" id="copy">Copy result</button></div>
    <p id="copied" class="mono" style="font-size:12px;min-height:16px"></p>`;
  ov.hidden = false;
  renderIdle(win?'Victory':'Game over', txt);
  document.getElementById('again').onclick = ()=>startGame(G.mode);
  document.getElementById('other').onclick = ()=>{ abortGame(); show('select'); };
  document.getElementById('copy').onclick = async ()=>{ const m = document.getElementById('copied'); try { await navigator.clipboard.writeText(txt); m.textContent='Copied!'; } catch(e){ m.textContent = txt; } };
}

if (location.hash==='#suggest') show('suggest');

document.addEventListener('keydown', e=>{
  if (G.phase!=='challenge' || views.game.hidden) return;
  if ((document.activeElement||{}).tagName==='INPUT') return;
  const n = parseInt(e.key,10); if (!n) return;
  const b = panel.querySelector(`.opt[data-i="${n-1}"]`); if (b && !b.disabled) b.click();
});

})();
