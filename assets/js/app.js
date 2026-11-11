'use strict';
(() => {
// =============================================================
// Assets
// =============================================================
const IMG = {};
const FXM = { hit:{w:48,h:48,n:7,cols:7}, slash:{w:70,h:25,n:7,cols:7}, boom:{w:64,h:64,n:8,cols:8}, bigboom:{w:128,h:128,n:13,cols:13},
  zap:{w:64,h:64,n:7,cols:7}, spark:{w:48,h:48,n:10,cols:10}, heal:{w:64,h:64,n:16,cols:16}, sparkle:{w:32,h:32,n:18,cols:18},
  fire:{w:48,h:64,n:15,cols:5}, skull:{w:32,h:32,n:12,cols:12}, splat:{w:48,h:48,n:8,cols:5}, firework:{w:48,h:48,n:27,cols:10},
  alert:{w:40,h:40,n:14,cols:14}, coin:{w:64,h:64,n:31,cols:31}, warp:{w:48,h:48,n:10,cols:10}, smoke:{w:32,h:32,n:10,cols:10},
  purple:{w:48,h:48,n:10,cols:10}, shield:{w:64,h:64,n:18,cols:18}, aura:{w:48,h:48,n:16,cols:5}, poison:{w:64,h:64,n:17,cols:17}, attackup:{w:64,h:64,n:18,cols:18} };
const names = ['grass','grass_summer','grass_autumn','grass_winter','house','tree','tree_summer','tree_autumn','tree_winter',
  'crops','fence','chicken','cow','farmer','chest','road',
  'soldier_Idle','soldier_Walk','soldier_Attack01','soldier_Attack02','soldier_Attack03','soldier_Hurt','soldier_Death',
  'orc_Idle','orc_Walk','orc_Attack01','orc_Attack02','orc_Hurt','orc_Death',
  'demon_Idle','demon_Walk','demon_Attack01','demon_Attack02','demon_Hurt','demon_Death',
  'blood_Idle','blood_Walk','blood_Attack01','blood_Attack02','blood_Hurt','blood_Death',
  'woods','dungeon','cf_player','cf_skeleton','cf_slime','cf_grass','cf_water_mid','cf_path','cf_bridge','cf_house','cf_oak','cf_oak_small',
  'cf_fences','cf_decor','cf_sheep','cf_pig'].concat(Object.keys(FXM).map(k => 'fx/' + k));
let loaded = 0; const onReady = [];
names.forEach(n => { const i = new Image(); i.onload = i.onerror = () => { if (++loaded === names.length) onReady.forEach(f=>f()); }; i.src = 'assets/img/' + n + '.png'; IMG[n] = i; });
const ready = () => loaded === names.length;
const now = () => performance.now();
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const STORY = window.CODESHIRE_STORY || { cast:{}, chapters:[], prologue:[], epilogue:[] };

// =============================================================
// Characters: one registry for every sprite in every pack
// =============================================================
const TF = { // frame counts of the 100x100 "Tiny RPG" sheets
  soldier:{Idle:6,Walk:8,Attack01:6,Attack02:6,Attack03:9,Hurt:4,Death:4},
  orc:{Idle:6,Walk:8,Attack01:6,Attack02:6,Hurt:4,Death:4},
  demon:{Idle:6,Walk:8,Attack01:7,Attack02:7,Hurt:4,Death:4},
  blood:{Idle:6,Walk:8,Attack01:8,Attack02:8,Hurt:4,Death:4},
};
const dg = (ix, iy, rx, ry, w, h, extra) => Object.assign({t:'dg', idle:[ix,iy], run:[rx,ry], w, h, ax:w/2, ay:h}, extra||{});
const KINDS = {
  soldier:{t:'tiny', p:'soldier', ax:50, ay:60},
  orc:{t:'tiny', p:'orc', ax:54, ay:60, death:'boom'},
  demon:{t:'tiny', p:'demon', ax:53, ay:59, death:'purple'},
  blood:{t:'tiny', p:'blood', ax:52, ay:58, death:'boom'},
  skeleton:{t:'cf', img:'cf_skeleton', fw:32, ax:16, ay:25, rows:{Idle:[1,6],Walk:[4,6],Attack01:[7,4],Death:[9,4]}, death:'skull'},
  pip:{t:'cf', img:'cf_player', fw:32, ax:16, ay:25, rows:{Idle:[1,6],Walk:[4,6],Attack01:[7,4],Death:[9,4]}},
  slime:{t:'cf', img:'cf_slime', fw:64, ax:32, ay:42, rows:{Idle:[0,4],Walk:[1,8],Attack01:[1,8],Death:[2,8]}, lunge:true, death:'splat'},
  farmer:{t:'sheet', img:'farmer', fw:32, n:4, ax:16, ay:26},
  goblin:dg(368,40,432,40,16,16,{death:'smoke'}), imp:dg(368,64,432,64,16,16,{death:'boom'}), skelet:dg(368,88,432,88,16,16,{death:'skull'}),
  tiny_zombie:dg(368,16,432,16,16,16,{death:'poison'}), zombie:dg(368,136,368,136,16,16,{death:'poison'}),
  swampy:dg(432,112,432,112,16,16,{death:'splat'}), muddy:dg(368,112,368,112,16,16,{death:'splat'}),
  orc_shaman:dg(368,201,432,201,16,23,{death:'purple'}), masked_orc:dg(368,153,432,153,16,23,{death:'boom'}), orc_warrior:dg(368,177,432,177,16,23,{death:'boom'}),
  chort:dg(368,273,432,273,16,23,{death:'purple'}), necro:dg(368,225,368,225,16,23,{death:'skull'}), necro_minion:dg(368,225,368,225,16,23,{death:'skull'}),
  ogre:dg(16,380,144,380,32,36,{death:'boom'}), big_demon_minion:dg(16,428,144,428,32,36,{death:'purple'}), big_zombie:dg(16,332,144,332,32,36,{death:'poison'}),
  elf:dg(128,4,192,4,16,28), wizard:dg(128,164,192,164,16,28), knight:dg(128,100,192,100,16,28), dwarf:dg(128,260,192,260,16,28), lizard:dg(128,196,192,196,16,28),
};
const CAST_KIND = { hero:'soldier', tom:'farmer', elara:'elf', merlo:'wizard', pip:'pip', branch:'knight', brakka:'dwarf', vessa:'lizard',
  grukk:'orc', ogg:'ogre', glob:'slime', rebasius:'necro', cascade:'blood', nullk:'demon' };
const BOSSES = { grukk:{kind:'orc',scale:1.7,hp:3}, ogg:{kind:'ogre',scale:2,hp:3}, glob:{kind:'slime',scale:3,hp:3},
  rebasius:{kind:'necro',scale:2,hp:3}, cascade:{kind:'blood',scale:1.7,hp:3}, nullk:{kind:'demon',scale:1.9,hp:4} };

function animInfo(K, anim){
  if (K.t==='tiny'){ const fr = TF[K.p]; if (!fr[anim]) anim = anim.startsWith('Attack') ? 'Attack01' : 'Idle';
    const img = IMG[K.p+'_'+anim]; return { n:fr[anim], src:f=>[img, f*100, 0, 100, 100] }; }
  if (K.t==='cf'){ const a = K.rows[anim] ? anim : anim.startsWith('Attack') ? 'Attack01' : 'Idle'; const [row,n] = K.rows[a];
    return { n, src:f=>[IMG[K.img], f*K.fw, row*K.fw, K.fw, K.fw], lunge: K.lunge && a==='Attack01', fade: anim==='Death' && !K.rows.Death, hurt: anim==='Hurt' }; }
  if (K.t==='sheet') return { n:K.n, src:f=>[IMG[K.img], f*K.fw, 0, K.fw, K.fw] };
  // 0x72 dungeon sprites have idle + run only: attacks lunge, hurts knock back, deaths fade
  const run = anim==='Walk' || anim.startsWith('Attack'); const [x,y] = run ? K.run : K.idle;
  return { n:4, src:f=>[IMG.dungeon, x+f*K.w, y, K.w, K.h], lunge: anim.startsWith('Attack'), fade: anim==='Death', hurt: anim==='Hurt' };
}
const animDur = (e, anim) => { const n = animInfo(KINDS[e.kind], anim).n; return (anim.startsWith('Attack') && KINDS[e.kind].t==='dg' ? 6 : n)/12*1000; };
function ent(kind, x, o){ return Object.assign({ kind, x, y:0, anim:'Idle', t0:now(), loop:true, flip:false, scale:1, alpha:1, flash:0, hp:1, maxHp:1 }, o||{}); }
function setAnim(e, anim, loop=false){ e.anim = anim; e.t0 = now(); e.loop = loop; }
const scratch = document.createElement('canvas'), sctx = scratch.getContext('2d');
function drawEnt(ctx, e, gy){
  const K = KINDS[e.kind]; if (!K) return;
  const fi = animInfo(K, e.anim), t = now(), el = t - e.t0;
  const fps = e.anim==='Walk' ? 10 : 12; let f = Math.floor(el/1000*fps);
  f = e.loop ? f % fi.n : Math.min(f, fi.n-1);
  const [img, sx, sy, sw, sh] = fi.src(f); if (!img || !img.width) return;
  const s = e.scale || 1, dir = e.flip ? -1 : 1;
  let ox = 0, oy = 0, alpha = e.alpha;
  if (fi.lunge){ const k = Math.min(1, el/500); ox = Math.sin(k*Math.PI) * 10 * dir; }
  if (fi.hurt){ const k = Math.min(1, el/330); ox = -Math.sin(k*Math.PI) * 5 * dir; }
  if (fi.fade){ const k = Math.min(1, el/700); alpha *= 1-k; oy = k*3; }
  const x = Math.round(e.x + ox), y = Math.round(gy + e.y + oy);
  // soft shadow
  ctx.save(); ctx.globalAlpha = 0.22*alpha; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, gy + e.y + 1, 7*s, 2.4*s, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(dir*s, s);
  ctx.drawImage(img, sx, sy, sw, sh, -K.ax, -K.ay, sw, sh);
  if (t < e.flash){ scratch.width = sw; scratch.height = sh; sctx.clearRect(0,0,sw,sh); sctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    sctx.globalCompositeOperation = 'source-atop'; sctx.fillStyle = e.flashColor || '#fff'; sctx.fillRect(0,0,sw,sh); sctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.75; ctx.drawImage(scratch, -K.ax, -K.ay); }
  ctx.restore();
}
// head height of an entity (for effects and hp pips)
const headY = e => { const K = KINDS[e.kind]; const h = K.t==='tiny' ? 22 : K.t==='cf' ? (e.kind==='slime' ? 18 : 20) : K.h; return h * (e.scale||1); };

// ---- effects ----
const fxs = []; const pops = [];
function addFx(k, x, y, o){ fxs.push(Object.assign({ k, x, y, t0:now(), fps:22, scale:1, loop:false }, o||{})); }
function fxFrameDraw(ctx, k, f, cx, cy, s=1, alpha=1){ const m = FXM[k], img = IMG['fx/'+k]; if (!img || !img.width) return; f = ((f % m.n) + m.n) % m.n;
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(img, (f % m.cols)*m.w, Math.floor(f/m.cols)*m.h, m.w, m.h, Math.round(cx - m.w*s/2), Math.round(cy - m.h*s/2), m.w*s, m.h*s); ctx.restore(); }
function drawFx(ctx, t){
  for (let i = fxs.length-1; i >= 0; i--){ const p = fxs[i]; const m = FXM[p.k]; const f = Math.floor((t-p.t0)/1000*p.fps);
    if (!p.loop && f >= m.n){ fxs.splice(i,1); continue; } if (p.until && t > p.until){ fxs.splice(i,1); continue; }
    fxFrameDraw(ctx, p.k, f, p.follow ? p.follow.x + (p.dx||0) : p.x, p.y, p.scale, p.alpha==null?1:p.alpha); }
  for (let i = pops.length-1; i >= 0; i--){ const p = pops[i], k = (t-p.t0)/1100; if (k>=1){ pops.splice(i,1); continue; }
    ctx.save(); ctx.globalAlpha=1-k; ctx.font='bold 9px "Pixelify Sans", monospace'; ctx.textAlign='center';
    ctx.fillStyle='#0B0F14'; ctx.fillText(p.text,p.x+1,p.y-k*18+1); ctx.fillStyle=p.color; ctx.fillText(p.text,p.x,p.y-k*18); ctx.restore(); }
}

// =============================================================
// Seasons (Quick battle on Farmer Tom's farm)
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
const STAGE_SCALE = [1, 0.92, 0.85], BOSS_SCALE = 0.8;

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
// Farm world (Quick battle, prologue and epilogue)
// =============================================================
const GROUND = 160, SOLDIER_X = 196, ORC_STOP = 222;
function spr(ctx, img, sx, sy, sw, sh, dx, dy, flip=false, alpha=1){
  ctx.save(); ctx.globalAlpha = alpha;
  if (flip){ ctx.translate(dx+sw, dy); ctx.scale(-1,1); ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); }
  else ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
  ctx.restore();
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
  ctx.fillStyle = S.path; ctx.fillRect(170, GROUND-8, Math.max(160, view.x+view.w-170), 14);
  ctx.fillStyle = S.pathDot; for (let x=172; x<view.x+view.w; x+=11) ctx.fillRect(x, GROUND-2+((x*7)%5), 3, 2);
  ctx.drawImage(tr,96,1,32,46,214,12,32,46);
  ctx.drawImage(tr,96,1,32,46,250,2,32,46);
  ctx.drawImage(tr,71,14,20,33,288,20,20,33);
  ctx.drawImage(tr,96,1,32,46,92,-2,32,46);
  ctx.drawImage(tr,71,14,20,33,-14,96,20,33);
  ctx.drawImage(IMG.house,148,3,72,95,6,16,72,95);
  if (S.key==='winter'){ ctx.fillStyle='#eef4ff'; ctx.fillRect(16,20,52,3); ctx.fillRect(22,17,40,3); ctx.fillRect(30,14,24,3); }
  ctx.drawImage(IMG.chest,0,0,16,16,80,94,16,16);
  for (let r=0;r<2;r++) for (let c=0;c<5;c++){
    const x = 96+c*15, y = 112+r*13;
    if (S.key==='spring'){ const crop=[[48,16],[64,48],[64,16],[48,80],[64,80]]; const [sx,sy]=crop[(r*2+c)%5]; ctx.drawImage(IMG.crops,sx,sy,16,16,x,y,16,16); }
    else if (S.key==='summer'){ const crop=[[80,16],[80,48],[80,80],[80,112],[80,16]]; const [sx,sy]=crop[(r*2+c)%5]; ctx.drawImage(IMG.crops,sx,sy,16,16,x,y,16,16); }
    else if (S.key==='autumn'){ if ((r+c)%2===0) ctx.drawImage(IMG.crops,160,112,16,16,x,y,16,16); else { ctx.fillStyle='#7a5230'; ctx.fillRect(x+4,y+10,8,3); } }
    else { ctx.fillStyle='#e9f1ff'; ctx.fillRect(x+2,y+9,12,5); ctx.fillStyle='#c9d6ea'; ctx.fillRect(x+3,y+13,10,1); }
  }
  ctx.drawImage(IMG.fence,0,32,48,16,88,138,48,16);
  ctx.drawImage(IMG.fence,0,32,48,16,134,138,48,16);
  ctx.drawImage(tr,71,14,20,33,236,172,20,33);
  ctx.drawImage(tr,96,1,32,46,286,166,32,46);
  const cf = Math.floor(t/300)%4;
  ctx.drawImage(IMG.cow, cf*32, 0, 32, 32, 20, 150, 32, 32);
}
function drawTint(ctx, season, w, h){ const tint = SEASONS[season].tint; if (tint){ ctx.fillStyle = tint; ctx.fillRect(0,0,w,h); } }
function makeParticles(n){ return Array.from({length:n}, () => ({x:Math.random(), y:Math.random(), s:Math.random(), p:Math.random()*6.28})); }
function drawWeather(ctx, season, parts, w, h, dt, t){
  const k = typeof season === 'string' ? season : SEASONS[season].key;
  parts.forEach(p=>{
    if (k==='spring'){ p.x += dt*0.00002; p.y += dt*0.00004*(0.6+p.s); }
    else if (k==='summer' || k==='river'){ p.y -= dt*0.000008; p.x += Math.sin(t/900+p.p)*0.0003; }
    else if (k==='autumn' || k==='woods'){ p.y += dt*0.00005*(0.6+p.s); p.x += Math.sin(t/500+p.p)*0.0012; }
    else if (k==='forge' || k==='abyss'){ p.y -= dt*0.00006*(0.5+p.s); p.x += Math.sin(t/600+p.p)*0.0006; }
    else if (k==='crypt' || k==='fork'){ p.y += dt*0.000012*(p.s-0.5); p.x += dt*0.00001*(0.3+p.s); }
    else { p.y += dt*0.00006*(0.5+p.s); p.x += Math.sin(t/700+p.p)*0.0005; }
    if (p.y>1.02) { p.y = -0.02; p.x = Math.random(); } if (p.y<-0.02) p.y = 1.02; if (p.x>1.02) p.x = -0.02; if (p.x<-0.02) p.x = 1.02;
    const x = Math.round(p.x*w), y = Math.round(p.y*h);
    if (k==='spring'){ ctx.fillStyle = p.s>0.5 ? '#ffc4dc' : '#ffffff'; ctx.fillRect(x,y,2,1); ctx.fillRect(x+1,y+1,1,1); }
    else if (k==='summer' || k==='river'){ const a = 0.4+0.6*Math.abs(Math.sin(t/400+p.p)); ctx.fillStyle = `rgba(255,236,120,${a})`; ctx.fillRect(x,y,1,1); if (p.s>0.7) ctx.fillRect(x+1,y,1,1); }
    else if (k==='autumn'){ ctx.fillStyle = p.s>0.5 ? '#e0702a' : '#c2421f'; ctx.fillRect(x,y,2,2); ctx.fillStyle='#f2a24a'; ctx.fillRect(x,y,1,1); }
    else if (k==='woods'){ ctx.fillStyle = p.s>0.5 ? '#9fd64a' : '#e6c84a'; ctx.fillRect(x,y,2,1); ctx.fillRect(x+1,y+1,1,1); }
    else if (k==='crypt'){ ctx.fillStyle = `rgba(220,210,190,${0.25+0.3*p.s})`; ctx.fillRect(x,y,1,1); }
    else if (k==='fork'){ ctx.fillStyle = `rgba(210,215,240,${0.05+0.06*p.s})`; ctx.beginPath(); ctx.ellipse(x,y,20+p.s*20,5,0,0,Math.PI*2); ctx.fill(); }
    else if (k==='forge'){ ctx.fillStyle = p.s>0.5 ? '#ffb24a' : '#ff6a1a'; ctx.fillRect(x,y,1,p.s>0.8?2:1); }
    else if (k==='abyss'){ const a = 0.3+0.5*Math.abs(Math.sin(t/500+p.p)); ctx.fillStyle = `rgba(195,139,255,${a})`; ctx.fillRect(x,y,1,1); if (p.s>0.8) ctx.fillRect(x,y-1,1,1); }
    else { ctx.fillStyle = '#ffffff'; ctx.fillRect(x,y,p.s>0.6?2:1,p.s>0.6?2:1); }
  });
}

// =============================================================
// Adventure biomes: one long scrolling region per chapter
// =============================================================
const STAGE_W = 360, HX = s => 110 + s*STAGE_W, WORLD_W = HX(3) + 250;
const WD = { big:[275,10,59,70], med:[275,92,28,36], pine:[308,97,25,31], rock:[224,36,16,12], mush:[225,52,14,12], stump:[231,80,19,16],
  wrock:[240,98,16,13], lily:[226,132,13,12], lily2:[247,132,9,8], reed:[258,132,13,12], flY:[81,87,14,7], flP:[97,87,14,7], tuft:[121,88,15,8],
  bush:[228,70,10,9], pinkf:[258,54,11,10], darkblob:[151,23,66,66] };
const DGT = { wall:[32,16,16,16], wallTop:[32,0,16,16], door:[32,240,32,32], doorTop:[32,224,32,16], column:[80,80,16,48], bannerR:[16,32,16,16],
  bannerB:[32,32,16,16], bannerG:[16,48,16,16], bannerY:[32,48,16,16], skull:[288,432,16,16], crate:[288,408,16,24], hole:[96,144,16,16], chest:[304,416,16,16],
  bomb:[288,320,16,16], fountTop:[64,0,16,16], fountBasinR:[64,32,16,16], flaskR:[288,336,16,16], flaskB:[304,336,16,16] };
const CD = { stump:[0,32,16,16], rockS:[32,32,16,16], rock1:[0,48,16,16], rock2:[16,48,16,16], crystal:[48,48,16,16], gold:[0,80,16,16],
  log:[4,115,25,11], mush:[36,117,8,8], sign:[48,0,16,16], flower1:[0,16,16,16], flower2:[16,16,16,16], lamp:[68,72,10,40], potR:[32,160,16,18], potY:[48,160,16,18] };
const FLOORS = [[16,64],[16,64],[16,64],[32,64],[48,64],[16,80],[32,80],[48,80],[16,96],[32,96]];
const Wd = (c,k,x,y,s=1) => { const r = WD[k]; if (s===1) c.drawImage(IMG.woods, r[0],r[1],r[2],r[3], Math.round(x),Math.round(y), r[2],r[3]); else c.drawImage(IMG.woods, r[0],r[1],r[2],r[3], Math.round(x),Math.round(y), r[2]*s,r[3]*s); };
const Dd = (c,k,x,y,s=1) => { const r = DGT[k]; c.drawImage(IMG.dungeon, r[0],r[1],r[2],r[3], Math.round(x),Math.round(y), r[2]*s,r[3]*s); };
const Cd = (c,k,x,y) => { const r = CD[k]; c.drawImage(IMG.cf_decor, r[0],r[1],r[2],r[3], Math.round(x),Math.round(y), r[2],r[3]); };
const tilesIn = (v, step=16) => { const a = []; for (let x = Math.floor(v.x/step)*step; x < v.x+v.w; x += step) a.push(x); return a; };
const rowsIn = (v, step=16) => { const a = []; for (let y = Math.floor(v.y/step)*step; y < v.y+v.h; y += step) a.push(y); return a; };
// deterministic scatter: items every `gap` px with jitter, seeded by slot index
function scatter(v, gap, seed, fn){ const i0 = Math.floor((v.x-80)/gap), i1 = Math.ceil((v.x+v.w+80)/gap); for (let i=i0;i<=i1;i++) fn(i*gap + hash(i,seed)*gap*0.7, hash(i,seed+1), i); }

const BIOMES = {
  woods:{ weather:'woods', back(c,v,t){
      c.fillStyle = '#59c135'; c.fillRect(v.x, v.y, v.w, v.h);
      scatter(v, 170, 1, (x,h) => Wd(c,'darkblob', x, 20 + h*60));
      c.fillStyle = '#3f9a2e'; scatter(v, 23, 2, (x,h) => { const y = 10 + h*180; if (Math.abs(y-GROUND)>12){ c.fillRect(x,y,2,1); c.fillRect(x+3,y+1,1,2); } });
      c.fillStyle = '#b98a50'; c.fillRect(v.x, GROUND-10, v.w, 17); c.fillStyle = '#dba463'; c.fillRect(v.x, GROUND-9, v.w, 15);
      c.fillStyle = '#c99254'; scatter(v, 13, 3, (x,h) => c.fillRect(x, GROUND-6 + h*10, 2, 1));
      // tree line behind the path
      scatter(v, 46, 4, (x,h) => { if (h < 0.45) Wd(c,'big', x-30, -22 + h*30); });
      scatter(v, 38, 5, (x,h) => { const k = h<0.5 ? 'med' : 'pine'; const r = WD[k]; Wd(c,k, x-14, GROUND-14-r[3] - h*30); });
      scatter(v, 31, 6, (x,h) => { const k = ['mush','flY','flP','rock','stump','tuft','bush','pinkf'][Math.floor(h*8)]; Wd(c,k, x, h<0.5 ? 118 + h*20 : 176 + h*14); });
      // orc war banner at the forest edge, the Oracle Tree in the boss glade
      c.fillStyle = '#6b4a2e'; c.fillRect(HX(0)+150, GROUND-46, 2, 34); c.fillStyle = '#c2421f'; c.fillRect(HX(0)+152, GROUND-46, 14, 9);
      const ox = HX(3)+10; c.save(); c.globalAlpha = 0.25; c.fillStyle = '#c8ff7a'; c.beginPath(); c.ellipse(ox+59, GROUND-60, 70+Math.sin(t/600)*3, 50, 0, 0, Math.PI*2); c.fill(); c.restore();
      Wd(c,'big', ox, GROUND-150, 2);
    }, front(c,v){ scatter(v, 120, 7, (x,h) => { const r = WD.big; c.drawImage(IMG.woods, r[0],r[1],r[2],r[3], Math.round(x), Math.round(178 + h*12), r[2], r[3]); }); } },

  crypt:{ weather:'crypt', dark:0.42, back(c,v,t){
      c.fillStyle = '#17121c'; c.fillRect(v.x, v.y, v.w, v.h);
      for (const y of rowsIn(v)) for (const x of tilesIn(v)) { if (y < 48) continue; const f = FLOORS[Math.floor(hash(x>>4, y>>4)*FLOORS.length)]; c.drawImage(IMG.dungeon, f[0], f[1], 16, 16, x, y, 16, 16); }
      for (const x of tilesIn(v)) { const i = x>>4; Dd(c,'wallTop', x, 0); Dd(c,'wall', x, 16); Dd(c,'wall', x, 32);
        const h = hash(i, 11); if (h < 0.09) Dd(c,'bannerR', x, 16); else if (h < 0.16) Dd(c,'bannerB', x, 16); else if (h < 0.2) Dd(c,'bannerG', x, 32);
        else if (h > 0.95) { const f = Math.floor(t/160)%3; c.drawImage(IMG.dungeon, 64+f*16, 16, 16, 16, x, 16, 16, 16); Dd(c,'fountTop', x, 0); c.drawImage(IMG.dungeon, 64+f*16, 32, 16, 16, x, 32, 16, 16); } }
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(v.x, 48, v.w, 3);
      scatter(v, 150, 12, (x) => fxFrameDraw(c, 'fire', Math.floor(t/70 + x), x, 20, 0.3));
      scatter(v, 190, 13, (x) => Dd(c,'column', x, 54));
      // carpet runner
      c.fillStyle = '#3a1218'; c.fillRect(v.x, GROUND-10, v.w, 16); c.fillStyle = '#6a1e2a'; c.fillRect(v.x, GROUND-8, v.w, 12); c.fillStyle = '#c99a3a'; c.fillRect(v.x, GROUND-8, v.w, 1); c.fillRect(v.x, GROUND+3, v.w, 1);
      scatter(v, 44, 14, (x,h) => { const y = h < 0.5 ? 112 + h*24 : 174 + h*10; const k = ['skull','crate','bomb','hole','skull','flaskR'][Math.floor(h*6)]; if (k==='crate') Dd(c,k,x,y-8); else Dd(c,k,x,y); });
      scatter(v, 97, 15, (x,h) => { const f = Math.floor(t/220 + h*4)%4; c.drawImage(IMG.dungeon, 16+f*16, 192, 16, 16, Math.round(x), Math.round(126 + h*12), 16, 16); });
      Dd(c,'doorTop', HX(3)+40, 0); Dd(c,'door', HX(3)+40, 16); Dd(c,'chest', HX(3)+120, 120);
    }, front(c,v){ for (const x of tilesIn(v)) { Dd(c,'wallTop', x, 188); } } },

  river:{ weather:'river', back(c,v,t){
      for (const y of rowsIn(v)) for (const x of tilesIn(v)) c.drawImage(IMG.cf_grass, x, y);
      const water = (x0, y0, w, h) => { c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip(); for (let y = Math.floor(y0/16)*16; y < y0+h; y+=16) for (let x = Math.floor(x0/16)*16; x < x0+w; x+=16) c.drawImage(IMG.cf_water_mid, x, y); c.restore(); };
      water(v.x, Math.min(v.y, 0) - 4, v.w, 48 - Math.min(v.y, 0));
      scatter(v, 57, 23, (x,h) => { const y = Math.min(30, v.y + 10 + h*(40 - v.y)); if (h < 0.3) Wd(c,'lily', x, y); else if (h < 0.5) Wd(c,'lily2', x, y); else if (h < 0.62) Wd(c,'wrock', x, y);
        else { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(Math.round(x + Math.sin(t/700+h*9)*3), Math.round(y), 6, 1); c.fillRect(Math.round(x+3 + Math.sin(t/700+h*9)*3), Math.round(y+3), 4, 1); } });
      c.fillStyle = '#e8c98a'; c.fillRect(v.x, 44, v.w, 3); c.fillStyle = 'rgba(255,255,255,0.5)'; for (const x of tilesIn(v, 9)) c.fillRect(x + Math.sin(t/500 + x)*2, 42, 4, 1);
      for (let s = 0; s < 3; s++) { const rx = HX(s) + 196; if (rx + 60 < v.x || rx > v.x + v.w) continue;
        water(rx, 44, 52, 200); c.fillStyle = '#e8c98a'; c.fillRect(rx-3, 44, 3, 200); c.fillRect(rx+52, 44, 3, 200);
        Wd(c,'lily', rx+8, 70); Wd(c,'lily2', rx+34, 110); Wd(c,'wrock', rx+20, 180); Wd(c,'reed', rx-6, 130); }
      // path + bridges
      for (const x of tilesIn(v)) { let wet = false; for (let s=0;s<3;s++){ const rx = HX(s)+196; if (x+16 > rx && x < rx+52) wet = true; } if (!wet) c.drawImage(IMG.cf_path, x, GROUND-10); }
      for (let s = 0; s < 3; s++) { const rx = HX(s) + 192; for (let k = 0; k < 2; k++) c.drawImage(IMG.cf_bridge, 5, 0, 38, 16, rx + k*30, GROUND-10, 38, 16);
        c.fillStyle = '#4e2f1b'; c.fillRect(rx, GROUND-12, 68, 2); c.fillRect(rx, GROUND+5, 68, 2); }
      scatter(v, 64, 21, (x,h) => { if (h<0.35) c.drawImage(IMG.cf_oak_small, 37,3,23,34, Math.round(x), Math.round(64+h*40), 23, 34); else if (h<0.6) Cd(c, h<0.48?'flower1':'flower2', x, 120+h*20); else if (h<0.8) Cd(c,'rock1', x, 176+h*8); else Cd(c,'mush', x, 182); });
      [[HX(0)+60,'cf_sheep'],[HX(1)+90,'cf_pig'],[HX(2)+40,'cf_sheep']].forEach(([x,k],i) => c.drawImage(IMG[k], (Math.floor(t/400+i)%2)*32, 0, 32, 32, Math.round(x + Math.sin(t/2000+i)*10), 100, 32, 32));
      const bx = HX(0)-40, by = 24 + Math.sin(t/500)*1.2; c.fillStyle = '#6d4428'; c.fillRect(bx, by, 26, 7); c.fillStyle = '#8a5a36'; c.fillRect(bx+2, by-2, 22, 3);
      c.drawImage(IMG.cf_oak, 11,9,41,63, HX(3)+60, 46, 41, 63);
    }, front(c,v){ scatter(v, 140, 22, (x,h) => c.drawImage(IMG.cf_oak, 11,9,41,63, Math.round(x), Math.round(176+h*8), 41, 63)); } },

  fork:{ weather:'fork', tint:'rgba(50,30,90,0.16)', back(c,v,t){
      for (const y of rowsIn(v)) for (const x of tilesIn(v)) c.drawImage(IMG.cf_grass, x, y);
      for (const x of tilesIn(v)) c.drawImage(IMG.cf_path, x, GROUND-10);
      // the road forks into two branches and merges again before each camp
      for (let s = 0; s < 3; s++) { const a = HX(s)+70, b = HX(s)+290; for (let k = 0; k <= 1; k += 0.02) { const x = a + (b-a)*k, y = GROUND-10 - Math.sin(k*Math.PI)*48; c.drawImage(IMG.cf_path, 0, 0, 16, 16, Math.round(x), Math.round(y), 16, 14); } }
      c.drawImage(IMG.cf_house, 13,1,70,114, HX(0)-90, 20, 70, 114);
      for (let k = 0; k < 6; k++) c.drawImage(IMG.cf_fences, 21,3,38,11, HX(0)-40 + k*36, 128, 38, 11);
      scatter(v, 120, 31, (x) => Cd(c,'lamp', x, GROUND-50));
      scatter(v, 260, 32, (x,h,i) => { const col = i%2 ? '#e8822a' : '#3d7bd6'; c.fillStyle = '#4e3a2a'; c.fillRect(x, 64, 2, 34); const w = Math.round(Math.sin(t/300 + i)*1.5); c.fillStyle = col; c.fillRect(x+2, 65, 14, 9+w); c.fillStyle='rgba(0,0,0,0.2)'; c.fillRect(x+2, 72+w, 14, 2); });
      scatter(v, 34, 33, (x,h) => { if (x < HX(1)-120) return; const y = h<0.5 ? 70 + h*60 : 176 + h*14; c.fillStyle = '#5a5f6e'; c.fillRect(x, y, 10, 11); c.fillStyle = '#8b92a3'; c.fillRect(x+1, y, 8, 9); c.fillStyle = '#5a5f6e'; c.fillRect(x+4, y+2, 2, 6); c.fillRect(x+2, y+4, 6, 2); c.fillStyle='rgba(0,0,0,0.25)'; c.fillRect(x-1, y+11, 12, 2); });
      scatter(v, 150, 34, (x,h) => c.drawImage(IMG.cf_oak, 11,9,41,63, Math.round(x), Math.round(4+h*20), 41, 63));
      // Merge Gate in the boss arena
      const gx = HX(3)+40; Dd(c,'doorTop', gx, 40, 2); Dd(c,'door', gx, 72, 2); c.fillStyle = `rgba(160,90,255,${0.15+0.1*Math.sin(t/400)})`; c.fillRect(gx+6, 76, 52, 58);
    }, front(c,v){ scatter(v, 90, 35, (x) => c.drawImage(IMG.cf_fences, 21,3,38,11, Math.round(x), 190, 38, 11)); } },

  forge:{ weather:'forge', dark:0.28, tint:'rgba(120,30,10,0.12)', back(c,v,t){
      c.fillStyle = '#211618'; c.fillRect(v.x, v.y, v.w, v.h);
      for (const y of rowsIn(v)) for (const x of tilesIn(v)) { if (y < 40) continue; const f = FLOORS[Math.floor(hash(x>>4, y>>4)*FLOORS.length)]; c.drawImage(IMG.dungeon, f[0], f[1], 16, 16, x, y, 16, 16); }
      c.fillStyle = 'rgba(110,30,10,0.38)'; c.fillRect(v.x, 40, v.w, 200);
      // lava river at the top
      c.fillStyle = '#1a1012'; c.fillRect(v.x, v.y, v.w, -v.y + 4); scatter(v, 17, 44, (x,h) => { c.fillStyle = h<0.5 ? '#2a1a1c' : '#120a0c'; c.fillRect(Math.round(x), Math.round(-4 - h*Math.max(0,-v.y)), 6, 3); });
      for (const x of tilesIn(v, 4)) { const w = Math.sin(x*0.07 + t/500)*2; c.fillStyle = '#d8461a'; c.fillRect(x, 4, 4, 32 + w); c.fillStyle = '#ff9a2a'; c.fillRect(x, 8 + Math.sin(x*0.13 + t/300)*3, 4, 3); c.fillStyle = '#3a2426'; c.fillRect(x, 36 + w, 4, 5); }
      scatter(v, 60, 41, (x) => { const p = ((t/600 + x) % 1); c.fillStyle = `rgba(255,220,120,${1-p})`; c.fillRect(x, 20 - p*6, 2, 2); });
      // server racks along the back wall
      scatter(v, 26, 42, (x,h,i) => { if (h > 0.75) return; const y = 52; c.fillStyle = '#1d1a22'; c.fillRect(x, y, 18, 40); c.fillStyle = '#2f2b38'; c.fillRect(x+1, y+1, 16, 38);
        for (let k = 0; k < 7; k++) { const on = hash(i*9+k, Math.floor(t/300)) > 0.35; c.fillStyle = on ? (hash(i,k) > 0.75 ? '#ff3b3b' : '#4dff6a') : '#14321a'; c.fillRect(x+3, y+4+k*5, 2, 2); c.fillStyle = '#4a4458'; c.fillRect(x+7, y+4+k*5, 8, 2); } });
      // walkway
      c.fillStyle = '#4a3a3a'; c.fillRect(v.x, GROUND-10, v.w, 16); c.fillStyle = '#5c4a48'; c.fillRect(v.x, GROUND-9, v.w, 2); c.fillStyle = '#2a1e20'; for (const x of tilesIn(v, 12)) c.fillRect(x, GROUND-4, 1, 1);
      scatter(v, 70, 43, (x,h) => { if (h < 0.4) fxFrameDraw(c, 'fire', Math.floor(t/70 + x), x, 112, 0.45); else if (h < 0.6) { c.fillStyle = '#2a2a30'; c.fillRect(x, 124, 18, 6); c.fillRect(x+5, 130, 8, 6); c.fillStyle='#4a4a54'; c.fillRect(x, 124, 18, 2); } else if (h < 0.8) Dd(c,'crate', x, 106); else Dd(c,'bomb', x, 178); });
      const fx0 = HX(3)+50; c.fillStyle = '#3a2426'; c.fillRect(fx0, 50, 70, 90); c.fillStyle = '#2a1a1c'; c.fillRect(fx0+14, 80, 42, 50); fxFrameDraw(c, 'fire', Math.floor(t/60), fx0+35, 106, 0.9); c.fillStyle = '#ff6a1a'; c.fillRect(fx0+14, 128, 42, 2);
    }, front(c,v,t){ for (const x of tilesIn(v, 4)) { c.fillStyle = '#d8461a'; c.fillRect(x, 192 + Math.sin(x*0.09 + t/400)*2, 4, 20); c.fillStyle = '#ff9a2a'; c.fillRect(x, 194 + Math.sin(x*0.09 + t/400)*2, 4, 1); } } },

  abyss:{ weather:'abyss', dark:0.5, tint:'rgba(80,0,120,0.12)', back(c,v,t){
      c.fillStyle = '#0b0614'; c.fillRect(v.x, v.y, v.w, v.h);
      scatter(v, 9, 51, (x,h,i) => { const a = 0.2 + 0.6*Math.abs(Math.sin(t/900 + i)); c.fillStyle = `rgba(220,200,255,${a})`; c.fillRect(Math.round(x), Math.round(h*110), 1, 1); });
      // stack frames drifting in the void
      const frames = ['main()','dispatch()','handle()','parse()','alloc()','syscall','irq 0x21','0x7ffe..','ret addr','free()'];
      c.font = '6px "JetBrains Mono", monospace';
      scatter(v, 90, 52, (x,h,i) => { const y = 14 + h*70 + Math.sin(t/1200 + i)*3; c.fillStyle = 'rgba(150,80,255,0.16)'; c.fillRect(Math.round(x), Math.round(y), 46, 11); c.strokeStyle = 'rgba(190,130,255,0.45)'; c.strokeRect(Math.round(x)+0.5, Math.round(y)+0.5, 45, 10); c.fillStyle = 'rgba(230,210,255,0.75)'; c.fillText(frames[i % frames.length], Math.round(x)+3, Math.round(y)+8); });
      // floating platform
      for (const y of rowsIn(v)) for (const x of tilesIn(v)) { if (y < 112) continue; const f = FLOORS[Math.floor(hash(x>>4, y>>4)*FLOORS.length)]; c.drawImage(IMG.dungeon, f[0], f[1], 16, 16, x, y, 16, 16); }
      c.fillStyle = 'rgba(80,20,130,0.4)'; c.fillRect(v.x, 112, v.w, 120); c.fillStyle = '#1a0d26'; c.fillRect(v.x, 110, v.w, 3);
      scatter(v, 110, 53, (x) => Dd(c,'column', x, 66));
      scatter(v, 53, 54, (x,h) => { const y = 120 + h*20; if (h < 0.3) Dd(c,'hole', x, y); else if (h < 0.5) Dd(c,'skull', x, 178); else if (h < 0.7) { const f = Math.floor(t/220 + h*4)%4; c.drawImage(IMG.dungeon, 16+f*16, 192, 16, 16, Math.round(x), Math.round(y), 16, 16); } });
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(v.x, GROUND-8, v.w, 12);
      fxFrameDraw(c, 'warp', Math.floor(t/80), HX(3)+60, 96, 2, 0.55);
    }, front(c,v){ c.fillStyle = '#05020a'; c.fillRect(v.x, 196, v.w, 30); } },
};
function vignette(ctx, w, h, strength, cx, cy){
  const g = ctx.createRadialGradient(cx, cy, Math.min(w,h)*0.18, cx, cy, Math.max(w,h)*0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// =============================================================
// Landing island
// =============================================================
const isl = document.getElementById('island'), ictx = isl.getContext('2d'); ictx.imageSmoothingEnabled = false;
const ROWS = {2:[7,14],3:[5,16],4:[4,17],5:[3,18],6:[3,18],7:[3,18],8:[4,18],9:[4,17],10:[5,16],11:[7,14]};
const inIsland = (c,r) => ROWS[r] && c>=ROWS[r][0] && c<=ROWS[r][1];
const islParts = makeParticles(14);
const raftOrc = ent('orc', 0, {flip:true});
const dockSoldier = ent('soldier', 0);
let islLast = now();
function drawIsland(){
  const t = now(), dt = t-islLast; islLast = t;
  const c = ictx; c.clearRect(0,0,352,256);
  for (let i=0;i<26;i++){
    const x = (i*67 + Math.floor(t/90)%7) % 352, y = (i*41) % 256;
    if (inIsland(Math.floor(x/16), Math.floor(y/16)) || inIsland(Math.floor(x/16), Math.floor(y/16)-1)) continue;
    const a = 0.25 + 0.35*Math.abs(Math.sin(t/700 + i)); c.fillStyle = `rgba(190,225,255,${a})`; c.fillRect(x,y,4,1); c.fillRect(x+6,y,2,1);
  }
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++){
    if (!inIsland(col, +r+1)){
      const x = col*16, y = (+r+1)*16;
      c.fillStyle='#8a5a36'; c.fillRect(x,y,16,5); c.fillStyle='#6d4428'; c.fillRect(x,y+5,16,6); c.fillStyle='#4e2f1b'; c.fillRect(x,y+11,16,3);
      c.fillStyle='#a06a42'; c.fillRect(x+((col*5)%11),y+2,3,1);
      const fo = 0.35+0.25*Math.sin(t/500+col); c.fillStyle=`rgba(200,235,255,${fo})`; c.fillRect(x+1,y+15,14,1);
    }
  }}
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++) c.drawImage(IMG.grass,144,32,16,16,col*16,r*16,16,16); }
  c.fillStyle='#3f7a2e';
  for (const r in ROWS){ const [a,b] = ROWS[r]; for (let col=a; col<=b; col++){
    const x=col*16, y=r*16;
    if (!inIsland(col,+r-1)) c.fillRect(x,y,16,1);
    if (!inIsland(col-1,+r)) c.fillRect(x,y,1,16);
    if (!inIsland(col+1,+r)) c.fillRect(x+15,y,1,16);
  }}
  c.fillStyle='#5f9d43'; for (let i=0;i<30;i++){ const x=60+((i*37)%220), y=40+((i*53)%140); if (inIsland(Math.floor(x/16),Math.floor(y/16))) { c.fillRect(x,y,2,1); c.fillRect(x+3,y+1,1,2);} }
  c.fillStyle='#8b5a36'; c.fillRect(72,90,64,46); c.fillStyle='#6f4528'; for (let y=94;y<136;y+=8) c.fillRect(74,y,60,2);
  const crop=[[80,16],[80,48],[80,80],[96,16]];
  for (let r=0;r<3;r++) for (let col=0;col<4;col++){ const [sx,sy]=crop[(r+col)%4]; c.drawImage(IMG.crops,sx,sy,16,16,74+col*15,86+r*14,16,16); }
  c.fillStyle='#d9a066'; c.fillRect(196,124,22,68); c.fillStyle='#b9824b'; c.fillRect(196,124,2,68); c.fillRect(216,124,2,68);
  c.drawImage(IMG.road,0,0,16,16,198,150,16,16);
  c.fillStyle='#7a4a2e'; c.fillRect(194,192,26,44); c.fillStyle='#5e3822'; for (let y=196;y<236;y+=6) c.fillRect(194,y,26,1);
  c.fillStyle='#4e2f1b'; c.fillRect(194,236,4,6); c.fillRect(216,236,4,6);
  const bob = Math.round(Math.sin(t/600)*1.5);
  c.fillStyle='#6d4428'; c.fillRect(170,226+bob,20,7); c.fillStyle='#8a5a36'; c.fillRect(172,224+bob,16,3); c.fillStyle='#4e2f1b'; c.fillRect(173,233+bob,14,2);
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
  dockSoldier.x = 207; drawEnt(c, dockSoldier, 226);
  const rx = 300 + Math.round(Math.sin(t/1400)*6), ry = 214 + Math.round(Math.sin(t/650)*1.5);
  c.fillStyle='#6d4428'; c.fillRect(rx-14,ry,28,6); c.fillStyle='#8a5a36'; for (let i=0;i<4;i++) c.fillRect(rx-14+i*7,ry,6,2);
  raftOrc.x = rx; drawEnt(c, raftOrc, ry+2);
  drawWeather(c, 0, islParts, 352, 256, dt, t);
  if (!document.getElementById('landing').hidden) requestAnimationFrame(drawIsland);
}

// season + chapter thumbnails
function renderThumb(canvas, season){
  canvas.width = 320; canvas.height = 200; const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  drawWorld(c, season, {x:0,y:0,w:320,h:200}, 0);
  drawEnt(c, ent('soldier', SOLDIER_X), GROUND);
  drawEnt(c, ent('orc', ORC_STOP, {flip:true}), GROUND);
  drawTint(c, season, 320, 200);
  drawWeather(c, season, makeParticles(40), 320, 200, 0, 0);
}
function renderChapterThumb(canvas, i){
  const ch = STORY.chapters[i]; if (!ch) return; const B = BIOMES[ch.biome];
  canvas.width = 320; canvas.height = 200; const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  const v = {x:HX(1)-140, y:0, w:320, h:200}; c.save(); c.translate(-v.x, 0); B.back(c, v, 0);
  drawEnt(c, ent(ALLY_KIND(ch), HX(1)-30), GROUND);
  drawEnt(c, ent('soldier', HX(1)), GROUND);
  const foe = ch.stages[1].foes[1]; drawEnt(c, ent(foe, HX(1)+30, {flip:true}), GROUND);
  if (B.front) B.front(c, v, 0); c.restore();
  if (B.tint){ c.fillStyle = B.tint; c.fillRect(0,0,320,200); }
  if (B.dark) vignette(c, 320, 200, B.dark, 160, 120);
  drawWeather(c, B.weather, makeParticles(40), 320, 200, 0, 0);
}
const ALLY_KIND = ch => CAST_KIND[ch.ally] || 'elf';

// =============================================================
// Landing + select markup
// =============================================================
const esc = s => String(s).replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const icon = path => `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>`;
document.getElementById('cgrid').innerHTML = Object.values(TYPES).map(t=>`<div class="cinfo">${icon(t.icon)}<h3>${t.label}</h3><p>${t.desc}</p></div>`).join('');
document.getElementById('sgrid').innerHTML = SEASONS.map((s,i)=>`<div class="scard"><canvas class="px" data-season="${i}"></canvas><div><strong>Level ${i+1} · ${s.name}</strong><span>${s.blurb}</span></div></div>`).join('');
const agrid = document.getElementById('agrid');
if (agrid) agrid.innerHTML = STORY.chapters.map((ch,i)=>`<div class="scard"><canvas class="px" data-chapter="${i}"></canvas><div><strong>Ch.${ch.num} · ${esc(ch.title)}</strong><span>${esc(TYPES[ch.type].label)} · ${esc(ch.blurb)}</span></div></div>`).join('');
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
  const P = loadProgress(); const doneN = P.done.filter(Boolean).length;
  const advLabel = doneN === 0 && !P.prologue ? 'Start the adventure' : doneN >= 6 ? 'Replay the adventure' : `Continue · Chapter ${Math.min(6, P.unlocked)}`;
  document.getElementById('advslot').innerHTML = `<button class="ccard adv" data-adv="1">${icon('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>')}
    <div style="display:flex;flex-direction:column;gap:6px;flex:1"><h3>Story mode · ${esc(STORY.title || 'The Six Shards')}</h3>
    <p>Walk the world map from Farmer Tom's farm to the Abyssal Stack. Six regions, six bosses, one story. Each chapter is a different challenge type.</p>
    <span class="meta">${doneN}/6 shards recovered · ${QBANK.loaded ? Object.values(QBANK.pool).reduce((n,a)=>n+a.length,0) + ' questions in the bank' : 'no questions loaded'}</span></div>
    <span class="btn gold" style="display:inline-flex;align-items:center">${advLabel}</span></button>`;
  document.getElementById('selgrid').innerHTML =
    Object.entries(TYPES).map(([k,t])=>{ const n = poolFor(k).length;
      return `<button class="ccard" data-mode="${k}" ${n?'':'disabled'}>${icon(t.icon)}<h3>${t.label}</h3><p>${t.desc}</p><span class="meta">${n ? `${n} questions · ${t.secs}s each` : (QBANK.loaded ? `No ${esc(ln)} questions yet` : 'No questions loaded')}</span></button>`; }).join('') +
    `<button class="ccard mixed" data-mode="mixed" ${avail.length?'':'disabled'}>${icon('<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>')}<div style="display:flex;flex-direction:column;gap:6px;flex:1"><h3>${MIXED.label}</h3><p>${MIXED.desc}</p></div><span class="btn" style="display:inline-flex;align-items:center">Play mixed</span></button>`;
  const warn = document.getElementById('qwarn');
  if (!QBANK.loaded) { warn.hidden = false; warn.textContent = 'The question file could not be loaded, so there is nothing to play yet. Check questions.json on the server.'; }
}
document.getElementById('langs').addEventListener('click', e=>{
  const b = e.target.closest('[data-lang]'); if (!b) return;
  selectedLang = b.dataset.lang; try { localStorage.setItem('codeshire.lang', selectedLang); } catch(err) {}
  renderSelect();
});
document.getElementById('journey').innerHTML = SEASONS.map((s,i)=>`<div class="jstep"><canvas class="px" data-season="${i}"></canvas><span>Lv${i+1} · ${s.short}${i===3?' + Chief':''}</span></div>`).join('');

// =============================================================
// Progress (saved in this browser only)
// =============================================================
const PKEY = 'codeshire.adventure.v1';
function loadProgress(){
  let p = null; try { p = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch(e) {}
  if (!p || typeof p !== 'object') p = {};
  const n = STORY.chapters.length || 6;
  return { unlocked: Math.max(1, Math.min(n, +p.unlocked || 1)), done: Array.from({length:n}, (_,i)=>!!(p.done && p.done[i])),
    stars: Array.from({length:n}, (_,i)=>Math.max(0, Math.min(3, +(p.stars && p.stars[i]) || 0))), best: Array.from({length:n}, (_,i)=>Math.max(0, +(p.best && p.best[i]) || 0)),
    at: Math.max(0, Math.min(n, +p.at || 0)), prologue: !!p.prologue, finale: !!p.finale };
}
function saveProgress(p){ try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch(e) {} }
let PROG = loadProgress();
renderSelect();

// =============================================================
// Views
// =============================================================
const views = {landing:document.getElementById('landing'), select:document.getElementById('select'), map:document.getElementById('map'), game:document.getElementById('game'), suggest:document.getElementById('suggest')};
let landingMap = null, worldMap = null;
function show(v){
  Object.entries(views).forEach(([k,el])=>el.hidden = k!==v);
  views.game.classList.toggle('scene', G.mode === 'scene');
  window.scrollTo(0,0);
  try {
    if (v==='suggest' && location.hash!=='#suggest') history.replaceState(null, '', '#suggest');
    else if (v!=='suggest' && location.hash==='#suggest') history.replaceState(null, '', location.pathname + location.search);
  } catch(e) {}
  if (v==='suggest') openSuggest();
  if (v==='landing' && ready()) { islLast = now(); requestAnimationFrame(drawIsland); }
  if (landingMap) { if (v==='landing') landingMap.start(); else landingMap.stop(); }
  if (worldMap) { if (v==='map') worldMap.start(); else worldMap.stop(); }
  if (v==='select') renderSelect();
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click', ()=>{ if (b.dataset.go==='select' || b.dataset.go==='map') abortGame(); if (b.dataset.go==='map') openMap(); else show(b.dataset.go); }));
isl.addEventListener('click', ()=>show('select'));
document.getElementById('selgrid').addEventListener('click', e=>{ const b = e.target.closest('[data-mode]'); if (b && !b.disabled) startQuick(b.dataset.mode); });
document.getElementById('advslot').addEventListener('click', e=>{ if (e.target.closest('[data-adv]')) enterAdventure(); });
document.getElementById('quit').addEventListener('click', ()=>{ const adv = G.mode !== 'quick'; abortGame(); if (adv) openMap(); else show('select'); });

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
// World map view
// =============================================================
const mapside = document.getElementById('mapside');
let mapSel = 1;
function shardRow(){ return STORY.chapters.map((ch,i)=>`<span class="gem ${PROG.done[i]?'on':''} g${i}" title="${esc(ch.shard)}${PROG.done[i]?' (recovered)':''}"></span>`).join(''); }
function renderMapSide(){
  document.getElementById('shards').innerHTML = shardRow();
  document.getElementById('maplang').textContent = langLabel(selectedLang);
  const moving = worldMap && worldMap.isTravelling();
  const list = STORY.chapters.map((ch,i)=>{ const locked = i+1 > PROG.unlocked, done = PROG.done[i];
    return `<button class="chrow ${mapSel===i+1?'sel':''}" data-ch="${i}" ${locked?'disabled':''}><span class="num">${ch.num}</span><span class="t"><strong>${locked?'???':esc(ch.title)}</strong><em>${esc(TYPES[ch.type].label)}</em></span>
      <span class="st">${done ? '★'.repeat(PROG.stars[i]) + '☆'.repeat(3-PROG.stars[i]) : locked ? 'locked' : 'new'}</span></button>`; }).join('');
  const i = mapSel-1, ch = STORY.chapters[i];
  let detail = '';
  if (ch){
    const cast = STORY.cast;
    const here = worldMap && !moving && PROG.at === mapSel;
    detail = `<div class="chdetail"><span class="badge">Chapter ${ch.num} · ${esc(TYPES[ch.type].label)}</span><h3 class="pix">${esc(ch.title)}</h3><p>${esc(ch.blurb)}</p>
      <ul class="facts"><li><span>Ally</span>${esc(cast[ch.ally] ? cast[ch.ally].name : '')}</li><li><span>Boss</span>${esc(cast[ch.boss] ? cast[ch.boss].name : '')}</li><li><span>Prize</span>${esc(ch.shard)}</li>
      <li><span>Stages</span>${ch.stages.map(s=>esc(s.name)).join(' → ')} → Boss</li>${PROG.best[i] ? `<li><span>Best</span>${PROG.best[i].toLocaleString('en-IN')} pts</li>` : ''}</ul>
      <button class="btn gold" id="chgo" ${here?'':'disabled'}>${moving ? 'Travelling…' : here ? (PROG.done[i] ? 'Replay chapter' : 'Enter ' + esc(ch.region.split('· ')[1] || 'region')) : 'Walk there first'}</button></div>`;
  }
  mapside.innerHTML = detail + `<div class="chlist">${list}</div>` +
    `<div class="mapfoot"><button class="btn ghost small" id="replayPro">Replay prologue</button>${PROG.done.every(Boolean)?'<button class="btn ghost small" id="replayEpi">Ending</button>':''}<button class="btn ghost small" id="resetProg">Reset progress</button></div>`;
  const go = document.getElementById('chgo'); if (go) go.onclick = () => startChapter(mapSel-1);
  document.getElementById('replayPro').onclick = () => playFarmScene(STORY.prologue, 'prologue', () => openMap());
  const re = document.getElementById('replayEpi'); if (re) re.onclick = () => playFarmScene(STORY.epilogue, 'epilogue', () => openMap());
  document.getElementById('resetProg').onclick = () => { if (!confirmReset()) return; PROG = { unlocked:1, done:PROG.done.map(()=>false), stars:PROG.stars.map(()=>0), best:PROG.best.map(()=>0), at:0, prologue:true, finale:false }; saveProgress(PROG); mapSel = 1; openMap(); };
}
let resetArmed = 0;
function confirmReset(){ const b = document.getElementById('resetProg'); if (now() - resetArmed < 4000) { resetArmed = 0; return true; } resetArmed = now(); b.textContent = 'Click again to reset'; return false; }
mapside.addEventListener('click', e=>{ const b = e.target.closest('[data-ch]'); if (!b || b.disabled) return; selectNode(+b.dataset.ch + 1); });
function selectNode(i){
  if (!worldMap || i > PROG.unlocked) return;
  if (i === 0){ worldMap.travelTo(0, ()=>{ PROG.at = 0; saveProgress(PROG); renderMapSide(); }); renderMapSide(); return; }
  mapSel = i; renderMapSide();
  worldMap.travelTo(i, ()=>{ PROG.at = i; saveProgress(PROG); renderMapSide(); });
  renderMapSide();
}
function ensureWorldMap(){
  if (worldMap || !window.CodeshireMap) return;
  worldMap = window.CodeshireMap.create(document.getElementById('mapcv'), { onSelect: selectNode });
}
function syncMap(){ worldMap.setProgress({ unlocked: PROG.unlocked, done: PROG.done.slice(), stars: PROG.stars.slice(), at: PROG.at }); }
function openMap(after){
  ensureWorldMap(); show('map'); if (!worldMap) return;
  syncMap(); mapSel = Math.max(1, Math.min(PROG.unlocked, PROG.at || 1));
  renderMapSide();
  if (after) after();
}
function toastMap(text){ const el = document.getElementById('maptoast'); el.textContent = text; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); clearTimeout(toastMap.tm); toastMap.tm = setTimeout(()=>{ el.hidden = true; }, 4200); }
// walk to the next open place on the road, the heart of "moving through the story"
function autoWalk(to, msg){
  if (!worldMap) return; mapSel = Math.max(1, to); renderMapSide();
  if (msg) toastMap(msg);
  setTimeout(()=>worldMap.travelTo(to, ()=>{ PROG.at = to; saveProgress(PROG); renderMapSide(); }), 600);
  renderMapSide();
}
function enterAdventure(){
  abortGame();
  if (!PROG.prologue){ playFarmScene(STORY.prologue, 'prologue', ()=>{ PROG.prologue = true; saveProgress(PROG);
    openMap(()=>autoWalk(1, 'Your journey begins: the road to the Whispering Woods is open.')); }); return; }
  openMap(()=>{ if (PROG.at === 0 && PROG.unlocked >= 1) autoWalk(Math.min(PROG.unlocked, 6)); });
}

// =============================================================
// Game state and loop
// =============================================================
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const gview = document.getElementById('gview'), panel = document.getElementById('panel');
const ov = document.getElementById('ov'), ocard = document.getElementById('ocard');
const cam = {x:0,y:0,w:320,h:200};
function fitCanvas(){
  const r = gview.getBoundingClientRect(); if (!r.width || !r.height) return;
  let s = Math.min(r.height/200, r.width/300);
  if (r.height/s > 330) s = r.height/330;
  if (r.width/s < 130) s = r.width/130;
  const w = r.width/s, h = r.height/s;
  cv.width = Math.round(w); cv.height = Math.round(h); ctx.imageSmoothingEnabled = false;
  cam.w = cv.width; cam.h = cv.height;
  if (G.mode === 'adv') cam.x = camTarget();
  else cam.x = cam.w >= 320 ? (320-cam.w)/2 : Math.max(0, Math.min(320-cam.w, 302 - cam.w));
  cam.y = cam.h > 200 ? Math.min((200-cam.h)/2, GROUND + 60 - cam.h*0.72) : 0;
  cam.x = Math.round(cam.x); cam.y = Math.round(cam.y);
}
new ResizeObserver(fitCanvas).observe(gview);

const G = { mode:'off', type:'mixed', lang:'all', level:0, foeIdx:0, hp:3, score:0, streak:0, used:{}, cq:null, deadline:0, phase:'off', token:0, mixedQueue:[],
  ch:null, chIdx:0, stage:0, boss:false, bossTalked:false, timeScale:1, scene:null, actors:[] };
const hero = ent('soldier', SOLDIER_X);
let foe = null, shakeUntil = 0, weather = makeParticles(70);
const chickens = [{x:62,y:166,d:1,f:0},{x:106,y:160,d:-1,f:1},{x:130,y:171,d:1,f:2}];
function later(fn, ms){ const tok = G.token; setTimeout(()=>{ if (tok===G.token) fn(); }, ms); }
const camTarget = () => Math.round(Math.max(0, Math.min(WORLD_W - cam.w, hero.x - cam.w*0.45)));

let last = now();
function loop(){
  const t = now(), dt = Math.min(50, t-last); last = t;
  if (!views.game.hidden && ready() && cv.width){
    const adv = G.mode === 'adv';
    // movement
    if (G.phase==='travel' && G.travel){ const dir = Math.sign(G.travel.to - hero.x); hero.x += dir * dt * 0.075;
      G.actors.forEach(a => { a.x = hero.x - 30; });
      if ((dir > 0 && hero.x >= G.travel.to) || (dir < 0 && hero.x <= G.travel.to) || dir === 0){ hero.x = G.travel.to; G.actors.forEach(a=>{ a.x = hero.x - 30; setAnim(a,'Idle',true); }); setAnim(hero,'Idle',true); const cb = G.travel.cb; G.travel = null; G.phase = 'idle'; cb(); } }
    if (adv) cam.x += (camTarget() - cam.x) * Math.min(1, dt*0.006);
    if (foe && G.phase==='walking'){ foe.x -= dt * (foe.boss ? 0.035 : 0.05);
      if (foe.x <= foe.stop){ foe.x = foe.stop; setAnim(foe,'Idle',true); foeArrived(); } }
    ctx.save(); ctx.clearRect(0,0,cv.width,cv.height);
    if (t < shakeUntil) ctx.translate(Math.round((Math.random()-.5)*4), Math.round((Math.random()-.5)*3));
    const vx = Math.round(cam.x); ctx.translate(-vx, -cam.y);
    const view = {x:vx, y:cam.y, w:cam.w, h:cam.h};
    const biome = adv ? BIOMES[G.ch.biome] : null;
    if (biome) biome.back(ctx, view, t); else drawWorld(ctx, G.mode==='quick' ? G.level : 0, view, t);
    if (!biome){
      chickens.forEach(c=>{ c.x += c.d*dt*0.006; if (c.x<62||c.x>150) c.d*=-1; const f=Math.floor(t/180+c.f)%4; spr(ctx, IMG.chicken, f*16,0,16,16, Math.round(c.x), c.y, c.d<0); });
      if (G.mode !== 'scene') { const ff = Math.floor(t/220)%4; ctx.drawImage(IMG.farmer, ff*32, 0, 32, 32, 144, 80, 32, 32); }
      if (G.mode==='quick' && foe && foe.hp>0 && G.phase!=='off'){ ctx.fillStyle='#fff'; ctx.fillRect(158,72,7,9); ctx.fillStyle='#e0402a'; ctx.fillRect(160,73,3,5); ctx.fillRect(160,79,3,1); }
    }
    G.actors.forEach(a => drawEnt(ctx, a, GROUND - 2));
    if (G.mode !== 'off') drawEnt(ctx, hero, GROUND);
    if (foe){ drawEnt(ctx, foe, GROUND);
      if (foe.hp>0){ const w=foe.maxHp*7, x0=Math.round(foe.x-w/2-2), y0=Math.round(GROUND - headY(foe) - 12);
        for (let i=0;i<foe.maxHp;i++){ ctx.fillStyle='#0B0F14'; ctx.fillRect(x0+i*7,y0,6,4); ctx.fillStyle=i<foe.hp?'#e0402a':'#3a2222'; ctx.fillRect(x0+i*7+1,y0+1,4,2); } } }
    drawFx(ctx, t);
    if (biome && biome.front) biome.front(ctx, view, t);
    ctx.restore();
    if (biome){ if (biome.tint){ ctx.fillStyle = biome.tint; ctx.fillRect(0,0,cv.width,cv.height); }
      if (biome.dark) vignette(ctx, cv.width, cv.height, biome.dark, hero.x - vx, GROUND - 20 - cam.y);
      drawWeather(ctx, biome.weather, weather, cv.width, cv.height, dt, t); }
    else { const season = G.mode==='quick' ? G.level : 0; drawTint(ctx, season, cv.width, cv.height); drawWeather(ctx, season, weather, cv.width, cv.height, dt, t); }
    if (G.phase==='challenge' && G.cq) tickTimer();
    if (G.dlg) tickDialogue(dt);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pick(type){
  let pool = poolFor(type, G.lang); if (!pool.length) pool = QBANK.pool[type];
  G.used[type] = G.used[type] || [];
  if (G.used[type].length >= pool.length) G.used[type] = [];
  let i; do { i = Math.floor(Math.random()*pool.length); } while (G.used[type].includes(i));
  G.used[type].push(i); return pool[i];
}
function nextMixedType(){ if (!G.mixedQueue.length) G.mixedQueue = shuffle(Object.keys(TYPES).filter(k=>poolFor(k, G.lang).length)); return G.mixedQueue.pop(); }

function abortGame(){ G.token++; G.phase='off'; G.mode='off'; foe=null; ov.hidden=true; closeDialogue(); fxs.length = 0; pops.length = 0; G.actors = []; }
function resetRun(o){ Object.assign(G, {lang:selectedLang, level:0, foeIdx:0, hp:3, score:0, streak:0, used:{}, cq:null, mixedQueue:[], stage:0, boss:false, bossTalked:false, timeScale:1}, o); weather = makeParticles(70); }

// ---------- Quick battle (the original four seasons) ----------
function startQuick(mode){
  abortGame(); resetRun({mode:'quick', type:mode, phase:'idle'});
  hero.x = SOLDIER_X; hero.scale = 1; setAnim(hero,'Idle',true); hero.flip = false;
  show('game'); fitCanvas(); updateHud();
  document.getElementById('modeChip').textContent = (mode==='mixed' ? MIXED.label : TYPES[mode].label) + ' · ' + langLabel(G.lang);
  const portrait = innerWidth < 560 && innerHeight > innerWidth;
  levelIntro(portrait);
}
function levelIntro(tip){
  const S = SEASONS[G.level];
  G.phase = 'intro'; G.timeScale = TIME_SCALE[G.level];
  ocard.innerHTML = `<h2>Level ${G.level+1} · ${S.name}</h2><p>${S.blurb}</p>
    <p class="mono" style="font-size:13px">${ORCS_PER_LEVEL} orcs${G.level===3?', the last one is the Orc Chief':''} · timer ×${TIME_SCALE[G.level]}</p>
    ${tip?'<p class="tip">Tip: turn your phone sideways for more room.</p>':''}
    <div class="row"><button class="btn" id="go1">Begin</button></div>`;
  ov.hidden = false;
  renderIdle(`${S.name} begins`, 'Press Begin when you\'re ready.');
  document.getElementById('go1').onclick = ()=>{ ov.hidden = true; G.foeIdx = 0; spawnFoe(); };
}

// ---------- Adventure chapters ----------
function startChapter(i){
  const ch = STORY.chapters[i]; if (!ch) return;
  abortGame(); resetRun({mode:'adv', ch, chIdx:i, type:ch.type, phase:'story'});
  hero.x = HX(0); hero.scale = 1; hero.flip = false; setAnim(hero,'Idle',true);
  G.actors = [ent(ALLY_KIND(ch), HX(0)-30)];
  show('game'); fitCanvas(); cam.x = camTarget(); updateHud();
  document.getElementById('modeChip').textContent = `Ch.${ch.num} · ${TYPES[ch.type].label} · ${langLabel(G.lang)}`;
  renderStoryPanel();
  playDialogue(ch.intro, ()=>stageStart(0));
}
function stageStart(s){
  G.stage = s; G.foeIdx = 0; G.timeScale = STAGE_SCALE[s]; updateHud(); renderStoryPanel();
  playDialogue(G.ch.stages[s].say || [], ()=>stageCard());
}
function stageCard(){
  const st = G.ch.stages[G.stage];
  G.phase = 'intro';
  ocard.innerHTML = `<span class="badge" style="align-self:center">Stage ${G.stage+1} of ${G.ch.stages.length}</span><h2>${esc(st.name)}</h2>
    <p>${st.foes.length} foes · ${TYPES[G.ch.type].label} · timer ×${G.timeScale}</p><div class="row"><button class="btn" id="go1">Fight</button></div>`;
  ov.hidden = false;
  document.getElementById('go1').onclick = ()=>{ ov.hidden = true; spawnFoe(); };
}
function travelTo(x, cb){ G.phase = 'travel'; G.travel = {to:x, cb}; setAnim(hero,'Walk',true); G.actors.forEach(a=>setAnim(a,'Walk',true)); renderIdle('On the move', G.stage < 2 ? 'Heading deeper into ' + G.ch.title + '…' : 'Something big is waiting ahead…'); }
function bossStart(){
  G.boss = true; G.bossTalked = false; G.foeIdx = 0; G.timeScale = BOSS_SCALE; updateHud(); renderStoryPanel(); spawnFoe();
}

// ---------- shared battle flow ----------
function spawnFoe(){
  updateHud();
  let kind, o = {flip:true};
  if (G.mode === 'quick'){ const boss = G.level===3 && G.foeIdx===ORCS_PER_LEVEL-1; kind = 'orc'; if (boss) Object.assign(o, {boss:true, scale:1.4, hp:2, maxHp:2}); }
  else if (G.boss){ const B = BOSSES[G.ch.boss] || {kind:'orc', scale:1.6, hp:3}; kind = B.kind; Object.assign(o, {boss:true, scale:B.scale, hp:B.hp, maxHp:B.hp}); }
  else kind = G.ch.stages[G.stage].foes[G.foeIdx];
  foe = ent(kind, cam.x + cam.w + 30, Object.assign(o, {anim:'Walk', loop:true}));
  foe.stop = hero.x + 24 + (foe.scale-1)*12 + (KINDS[kind].t==='dg' && KINDS[kind].w < 20 ? -4 : 0);
  if (foe.boss && G.mode==='adv'){ addFx('alert', foe.stop, GROUND - 60, {scale:0.8, fps:16}); if (kind==='demon' || kind==='necro') addFx('warp', foe.stop, GROUND - 20, {scale:1.4}); }
  G.phase = 'walking';
  if (G.mode==='quick') renderIdle(o.boss ? 'The Orc Chief approaches!' : `Orc ${G.foeIdx+1} of ${ORCS_PER_LEVEL} is coming…`, o.boss ? 'Two correct answers to bring him down.' : 'Its challenge appears when it reaches your soldier.');
  else if (o.boss) renderIdle(STORY.cast[G.ch.boss].name + ' approaches!', `${foe.maxHp} correct answers to bring the boss down.`);
  else renderIdle(`Foe ${G.foeIdx+1} of ${G.ch.stages[G.stage].foes.length} is coming…`, 'Its challenge appears when it reaches you.');
}
function foeArrived(){
  G.phase = 'idle';
  if (G.mode==='adv' && foe.boss && !G.bossTalked){ G.bossTalked = true; playDialogue(G.ch.preBoss, startChallenge); return; }
  startChallenge();
}
function startChallenge(){
  G.phase = 'challenge';
  const type = G.mode==='quick' ? (G.type==='mixed' ? nextMixedType() : G.type) : G.ch.type;
  const q = pick(type);
  const secs = Math.round(TYPES[type].secs * G.timeScale);
  G.cq = { type, q, secs, answered:false };
  G.deadline = now() + secs*1000;
  renderChallenge();
}
function foeDefeated(){
  G.foeIdx++;
  if (G.mode === 'quick'){
    if (G.foeIdx >= ORCS_PER_LEVEL){
      if (G.level === 3){ endCard(true); return; }
      const S = SEASONS[G.level], N = SEASONS[G.level+1];
      const healed = G.hp < 3; if (healed){ G.hp++; addFx('heal', hero.x, GROUND - 14); } updateHud();
      G.phase = 'between';
      ocard.innerHTML = `<h2>${S.short} cleared!</h2><p>${healed?'You recovered a heart. ':''}The season turns… next up: <strong style="color:var(--leaf)">${N.name}</strong>.</p>
        <p class="mono" style="font-size:14px;color:var(--text)">Score ${G.score.toLocaleString('en-IN')}</p>
        <div class="row"><button class="btn" id="go2">Continue</button></div>`;
      ov.hidden = false;
      renderIdle(`${S.short} cleared`, 'The season is changing.');
      document.getElementById('go2').onclick = ()=>{ G.level++; weather = makeParticles(70); updateHud(); levelIntro(false); };
    } else spawnFoe();
    return;
  }
  if (G.boss){ chapterWin(); return; }
  if (G.foeIdx < G.ch.stages[G.stage].foes.length){ spawnFoe(); return; }
  // stage cleared: recover a heart and walk on
  if (G.hp < 3){ G.hp++; addFx('heal', hero.x, GROUND - 14); pops.push({text:'+1 ♥', x:hero.x, y:GROUND-30, t0:now(), color:'#FF8A3D'}); }
  addFx('sparkle', hero.x, GROUND - 30, {scale:1.5}); updateHud();
  const next = G.stage + 1;
  later(()=>{ if (next < G.ch.stages.length) travelTo(HX(next), ()=>stageStart(next)); else travelTo(HX(3), ()=>{ renderStoryPanel(); bossStart(); }); }, 900);
}
function chapterWin(){
  G.phase = 'story';
  for (let k=0;k<5;k++) later(()=>addFx('firework', hero.x - 60 + Math.random()*140, 30 + Math.random()*70, {scale:1.4}), k*350);
  addFx('coin', hero.x + 20, GROUND - 30, {scale:1.2});
  later(()=>playDialogue(G.ch.outro, chapterCard), 1400);
}
function chapterCard(){
  const i = G.chIdx, ch = G.ch, stars = Math.max(1, G.hp), first = !PROG.done[i];
  PROG.done[i] = true; PROG.stars[i] = Math.max(PROG.stars[i], stars); PROG.best[i] = Math.max(PROG.best[i], G.score);
  const nextIdx = i + 1, opensNew = nextIdx < STORY.chapters.length && PROG.unlocked < nextIdx + 1;
  if (opensNew) PROG.unlocked = nextIdx + 1;
  PROG.at = i + 1; saveProgress(PROG);
  const allDone = PROG.done.every(Boolean);
  G.phase = 'off';
  ocard.innerHTML = `<span class="badge" style="align-self:center;color:var(--gold)">${esc(ch.shard)} recovered</span><h2>${esc(ch.title)} cleared!</h2>
    <p class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</p>
    <p class="mono" style="color:var(--text);font-size:20px">${G.score.toLocaleString('en-IN')} pts</p>
    <p>${allDone && !PROG.finale ? 'All six shards are yours. Time to go home.' : nextIdx < STORY.chapters.length ? (opensNew || first ? 'A new road opens on the map: ' : 'Next: ') + '<strong style="color:var(--leaf)">' + esc(STORY.chapters[nextIdx].title) + '</strong>' : ''}</p>
    <div class="row"><button class="btn gold" id="cont">${allDone && !PROG.finale ? 'Return to the farm' : 'Continue the journey'}</button><button class="btn ghost small" id="again">Replay chapter</button></div>`;
  ov.hidden = false;
  renderIdle('Chapter complete', `${ch.shard} recovered · ${G.score} pts`);
  document.getElementById('again').onclick = ()=>startChapter(i);
  document.getElementById('cont').onclick = ()=>{
    if (allDone && !PROG.finale){ playFarmScene(STORY.epilogue, 'epilogue', ()=>{ PROG.finale = true; saveProgress(PROG); openMap(()=>{ worldMap.travelTo(0, ()=>{ PROG.at = 0; saveProgress(PROG); renderMapSide(); }); toastMap('Codeshire is saved! Replay any chapter to beat your best score.'); }); }); return; }
    abortGame();
    openMap(()=>{ if (nextIdx < STORY.chapters.length) autoWalk(nextIdx + 1, opensNew ? `New road open: ${STORY.chapters[nextIdx].title}` : null); });
  };
}
function resolve(correct, info){
  if (!G.cq || G.cq.answered) return;
  G.cq.answered = true; G.phase = 'resolve';
  const left = Math.max(0, (G.deadline - now())/1000);
  showFeedback(correct, info);
  const e = foe;
  if (correct){
    G.streak++;
    const mult = Math.min(3, 1 + (G.streak-1)*0.25);
    const gained = Math.round(((info && info.pts) || 100) + Math.round(left)*10) * mult | 0;
    G.score += gained; updateHud();
    const atk = info && info.crit ? 'Attack03' : ['Attack01','Attack02','Attack01'][G.streak % 3];
    setAnim(hero, atk);
    const hitAt = animDur(hero, atk)*0.5;
    later(()=>{ e.hp--; setAnim(e,'Hurt'); e.flash = now() + 160;
      const hy = GROUND - headY(e)*0.55;
      addFx('slash', e.x - 4, hy, {fps:28}); addFx('hit', e.x, hy, {scale:0.8});
      const spell = G.mode==='adv' ? {crypt:'spark', river:'zap', fork:'shield', forge:'boom', abyss:'purple'}[G.ch.biome] : null;
      if (spell) addFx(spell, e.x, spell==='zap' ? GROUND - 30 : hy, {scale: spell==='shield' ? 0.6 : 0.8});
      if (info && info.crit) addFx('attackup', hero.x, GROUND - 20, {scale:0.7});
      pops.push({text:(info&&info.crit?'CRITICAL! ':'')+'+'+gained, x:e.x, y:GROUND - headY(e) - 14, t0:now(), color:info&&info.crit?'#F2C94C':'#B8F35A'}); }, hitAt);
    later(()=>{ setAnim(hero,'Idle',true);
      if (e.hp<=0){ setAnim(e,'Death'); const d = KINDS[e.kind].death || 'boom'; addFx(e.boss ? 'bigboom' : d, e.x, GROUND - headY(e)*0.5, {scale: e.boss ? 0.9 : 1});
        addFx('coin', e.x, GROUND - 24, {scale:0.6, fps:30}); shakeUntil = e.boss ? now()+500 : shakeUntil;
        fadeFoe(); later(()=>{ foe=null; foeDefeated(); }, e.boss ? 1700 : 1300); }
      else { setAnim(e,'Idle',true); later(startChallenge, 1600); }
    }, animDur(hero, atk)+250);
  } else {
    G.streak = 0; updateHud();
    const atk = Math.random() < 0.5 ? 'Attack01' : 'Attack02';
    setAnim(e, atk);
    later(()=>{ G.hp--; updateHud(); setAnim(hero,'Hurt'); hero.flash = now() + 160; hero.flashColor = '#ff5040'; shakeUntil=now()+300;
      addFx('smoke', hero.x, GROUND - 10); addFx('hit', hero.x + 4, GROUND - 14, {scale:0.6});
      pops.push({text:'-1 HP', x:hero.x, y:GROUND-32, t0:now(), color:'#FF8A3D'}); }, animDur(e, atk)*0.5);
    later(()=>{ setAnim(e,'Idle',true);
      if (G.hp<=0){ setAnim(hero,'Death'); later(()=>endCard(false), 1400); }
      else { setAnim(hero,'Idle',true); later(startChallenge, 2400); }
    }, animDur(e, atk)+350);
  }
}
function fadeFoe(){ const t0=now(), o=foe; const step=()=>{ if(foe!==o) return; const k=(now()-t0)/1500; o.alpha=Math.max(0,1-Math.max(0,k-0.4)/0.6); if(k<1) requestAnimationFrame(step); }; step(); }
function tickTimer(){
  const left = Math.max(0, G.deadline - now()), total = G.cq.secs*1000;
  const el = document.getElementById('tm'), bar = document.getElementById('tb');
  if (el){ el.textContent = (left/1000).toFixed(1)+'s'; bar.style.width = (left/total*100)+'%'; el.parentElement.classList.toggle('low', left<5000); }
  if (left<=0) resolve(false, {timeout:true});
}

// =============================================================
// Story scenes and dialogue
// =============================================================
const dlg = document.getElementById('dlg'), dlgP = document.getElementById('dlgp'), dlgN = document.getElementById('dlgn'), dlgT = document.getElementById('dlgt');
const dpctx = dlgP.getContext('2d'); dpctx.imageSmoothingEnabled = false;
function drawPortrait(who){
  const K = KINDS[CAST_KIND[who] || 'soldier']; dpctx.clearRect(0,0,40,40);
  const g = dpctx.createLinearGradient(0,0,0,40); g.addColorStop(0,'#1c2a3e'); g.addColorStop(1,'#0e1520'); dpctx.fillStyle = g; dpctx.fillRect(0,0,40,40);
  const [img, sx, sy, sw, sh] = animInfo(K, 'Idle').src(0); if (!img || !img.width) return;
  let cx = sx + K.ax - 16, cy = sy + K.ay - 30, cw = 32, chh = 32;
  if (K.t==='dg'){ const top = sy + (K.h >= 28 ? 6 : 0), ph = Math.min(K.h, 20); dpctx.drawImage(img, sx, top, K.w, ph, 20 - K.w, 38 - ph*2, K.w*2, ph*2); return; }
  if (K.t==='cf' && K.fw===64){ cx = sx + 16; cy = sy + 12; }
  if (K.t==='sheet'){ cx = sx; cy = sy; }
  dpctx.drawImage(img, cx, cy, cw, chh, 4, 6, 32, 32);
}
function playDialogue(lines, done){
  if (!lines || !lines.length){ done(); return; }
  G.dlg = { lines, i:0, shown:0, done }; G.phase = G.phase === 'challenge' ? G.phase : 'story';
  dlg.hidden = false; views.game.classList.add('talking'); showLine();
}
function showLine(){ const d = G.dlg; const [who] = d.lines[d.i]; const c = STORY.cast[who] || {name:who, color:'#fff'};
  dlgN.textContent = c.name; dlgN.style.color = c.color; d.shown = 0; dlgT.textContent = ''; drawPortrait(who);
  document.getElementById('dlgc').textContent = (d.i+1) + '/' + d.lines.length;
  const speaker = who === 'hero' ? hero : (foe && CAST_KIND[who] === foe.kind) ? foe : G.actors.find(a => a.kind === CAST_KIND[who]); if (speaker) speaker.flash = 0;
  G.dlg.speaker = speaker || null; }
function tickDialogue(dt){ const d = G.dlg; const text = d.lines[d.i][1]; if (d.shown < text.length){ d.shown = Math.min(text.length, d.shown + dt*0.05); dlgT.textContent = text.slice(0, Math.floor(d.shown)); }
  if (d.speaker) d.speaker.y = -Math.abs(Math.sin(now()/140)) * (d.shown < text.length ? 2 : 0); }
function nextLine(){ const d = G.dlg; if (!d) return; const text = d.lines[d.i][1];
  if (d.shown < text.length){ d.shown = text.length; dlgT.textContent = text; return; }
  if (d.speaker) d.speaker.y = 0;
  d.i++; if (d.i >= d.lines.length) { const cb = d.done; closeDialogue(); cb(); } else showLine(); }
function skipDialogue(){ const d = G.dlg; if (!d) return; if (d.speaker) d.speaker.y = 0; const cb = d.done; closeDialogue(); cb(); }
function closeDialogue(){ if (G.dlg && G.dlg.speaker) G.dlg.speaker.y = 0; G.dlg = null; dlg.hidden = true; views.game.classList.remove('talking'); }
document.getElementById('dlgnext').addEventListener('click', e=>{ e.stopPropagation(); nextLine(); });
document.getElementById('dlgskip').addEventListener('click', e=>{ e.stopPropagation(); skipDialogue(); });
dlg.addEventListener('click', ()=>nextLine());

// Farm scenes: prologue (Tom asks for help) and epilogue (everyone comes home)
function playFarmScene(lines, which, after){
  abortGame(); resetRun({mode:'scene', phase:'story'});
  hero.x = SOLDIER_X - 6; hero.scale = 1; hero.flip = true; setAnim(hero,'Idle',true);
  G.actors = [ent('farmer', 168)];
  if (which === 'epilogue'){ ['elf','wizard','pip','knight','dwarf','lizard'].forEach((k,i)=>G.actors.push(ent(k, 214 + i*16, {flip:true})));
    hero.flip = true; for (let k=0;k<8;k++) later(()=>addFx('firework', 120 + Math.random()*180, 20 + Math.random()*60, {scale:1.3}), 400 + k*600); }
  show('game'); fitCanvas(); updateHud(); views.game.classList.add('scene');
  document.getElementById('modeChip').textContent = which === 'epilogue' ? 'Epilogue · Home' : 'Prologue · ' + (STORY.title || 'The Six Shards');
  document.getElementById('seasonChip').textContent = "Tom's Farm";
  renderIdle(which === 'epilogue' ? 'Home at last' : STORY.title || 'The Six Shards', which === 'epilogue' ? 'The Source Crystal shines over Codeshire again.' : 'A new adventure begins on Farmer Tom\'s farm.');
  playDialogue(lines, ()=>{ abortGame(); after(); });
}
function renderStoryPanel(){
  if (G.mode !== 'adv') return; const ch = G.ch;
  const steps = ch.stages.map((s,i)=>`<li class="${i<G.stage||G.boss?'done':i===G.stage&&!G.boss?'cur':''}">${esc(s.name)}</li>`).join('') + `<li class="${G.boss?'cur':''}">Boss · ${esc(STORY.cast[ch.boss].name)}</li>`;
  panel.innerHTML = `<div class="storyp"><span class="badge">Chapter ${ch.num} · ${esc(TYPES[ch.type].label)}</span><h2 class="pix">${esc(ch.title)}</h2><p>${esc(ch.blurb)}</p>
    <ol class="route">${steps}</ol><p class="sub">Prize: <strong style="color:var(--gold)">${esc(ch.shard)}</strong></p></div>`;
}

// HUD
const heart = full => full
 ? '<svg viewBox="0 0 24 24" fill="#FF8A3D" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>'
 : '<svg viewBox="0 0 24 24" fill="none" stroke="#5A6675" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>';
function updateHud(){
  const h = document.getElementById('hearts'); h.innerHTML = [0,1,2].map(i=>heart(i<G.hp)).join(''); h.setAttribute('aria-label', G.hp+' of 3 lives');
  const sc = document.getElementById('seasonChip'), lbl = document.getElementById('foeLbl');
  if (G.mode === 'adv'){
    const n = G.boss ? 1 : G.ch.stages[G.stage].foes.length;
    lbl.textContent = G.boss ? 'Boss ' : 'Foe '; document.getElementById('orcs').textContent = G.boss ? '1/1' : Math.min(G.foeIdx+1, n)+'/'+n;
    sc.textContent = G.boss ? 'Boss fight' : `Stage ${G.stage+1}/${G.ch.stages.length} · ${G.ch.stages[G.stage].name}`;
  } else {
    lbl.textContent = 'Orc '; document.getElementById('orcs').textContent = Math.min(G.foeIdx+1, ORCS_PER_LEVEL)+'/'+ORCS_PER_LEVEL;
    const S = SEASONS[G.level]; sc.textContent = `Lv${G.level+1} · ${S.short}`;
  }
  document.getElementById('streak').textContent = '×'+(Math.min(3, 1+Math.max(0,G.streak-1)*0.25)).toString().slice(0,4);
  document.getElementById('score').textContent = G.score.toLocaleString('en-IN');
}

// Panel
function head(){
  const t = TYPES[G.cq.type];
  return `<div class="ptop"><span class="badge">${t.label}${foe && foe.boss ? ' · Boss' : ''}</span>
    <span class="timer"><span class="tbar"><i id="tb" style="width:100%"></i></span><span id="tm">${G.cq.secs}.0s</span></span></div>`;
}
function renderIdle(title, sub){ if (G.mode==='adv' && G.phase!=='challenge' && G.phase!=='resolve' && (G.phase==='story' || G.phase==='travel')) { renderStoryPanel(); const p = document.createElement('div'); p.className = 'idle'; p.innerHTML = `<strong>${esc(title)}</strong><span>${esc(sub)}</span>`; panel.appendChild(p); return; }
  panel.innerHTML = `<div class="idle"><strong>${esc(title)}</strong><span>${esc(sub)}</span></div>`; }
function renderChallenge(){
  const {type,q} = G.cq; let html = head();
  if (type==='output'){
    html += `<p class="prompt">What does this print? <span class="sub mono">(${esc(langName(q.lang))})</span></p><pre class="code">${esc(q.code)}</pre>
      <div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}"><kbd>${i+1}</kbd>${esc(o)}</button>`).join('')}</div>`;
  } else if (type==='bug'){
    html += `<p class="prompt">The bug hides in <code class="hl">${esc(q.file)}</code>. Click the broken line.</p>
      <div class="lines">${q.lines.map((l,i)=>`<button class="line" data-i="${i}"><span class="n">${i+1}</span>${esc(l)||' '}</button>`).join('')}</div>`;
  } else if (type==='regex'){
    html += `<p class="prompt">Defuse the trap: <span class="hl">${esc(q.rule)}</span></p>
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
  const {type,q} = G.cq;
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
  const msg = info && info.timeout ? 'Too slow! The foe strikes.' : ok ? 'Direct hit!' : 'Miss! The foe strikes back.';
  const why = info && info.why ? (info.html ? info.why : esc(info.why)) : '';
  const d = document.createElement('div'); d.className = 'feedback ' + (ok?'ok':'no'); d.innerHTML = `<strong>${msg}</strong> ${why}`;
  panel.appendChild(d); d.scrollIntoView({block:'nearest', behavior:'smooth'});
  const tm = document.getElementById('tm'); if (tm) tm.parentElement.style.visibility='hidden';
}
function endCard(win){
  G.phase = 'off';
  if (G.mode === 'adv'){
    const ch = G.ch;
    ocard.innerHTML = `<h2>You fell in ${esc(ch.title)}…</h2><p>${esc(STORY.cast[ch.ally] ? STORY.cast[ch.ally].name : 'Your ally')} drags you back to camp. The ${esc(ch.shard)} is still out there.</p>
      <p class="mono" style="color:var(--text);font-size:20px">${G.score.toLocaleString('en-IN')} pts</p>
      <div class="row"><button class="btn" id="again">Try again</button><button class="btn ghost small" id="tomap">World map</button></div>`;
    ov.hidden = false; renderIdle('Defeated', 'Every chapter can be retried as many times as you like.');
    document.getElementById('again').onclick = ()=>startChapter(G.chIdx);
    document.getElementById('tomap').onclick = ()=>{ abortGame(); openMap(); };
    return;
  }
  const label = (G.type==='mixed' ? 'Mixed' : TYPES[G.type].label) + ' · ' + langLabel(G.lang);
  const txt = `Codeshire · ${label}: ${win?'all 4 seasons cleared':'fell in '+SEASONS[G.level].short} · ${G.score} pts · ${'♥'.repeat(Math.max(0,G.hp))}${'♡'.repeat(3-Math.max(0,G.hp))}`;
  ocard.innerHTML = `<h2>${win?'The farm survives the year!':'The orcs got through…'}</h2>
    <p>${win?'The Orc Chief is down and Farmer Tom owes you a basket of strawberries.':'Farmer Tom is hiding in the barn. Have another go?'}</p>
    <p class="mono" style="color:var(--text);font-size:22px">${G.score.toLocaleString('en-IN')} pts</p>
    <div class="row"><button class="btn" id="again">Play again</button><button class="btn ghost small" id="other">Other challenge</button><button class="btn ghost small" id="copy">Copy result</button></div>
    <p id="copied" class="mono" style="font-size:12px;min-height:16px"></p>`;
  ov.hidden = false;
  renderIdle(win?'Victory':'Game over', txt);
  document.getElementById('again').onclick = ()=>startQuick(G.type);
  document.getElementById('other').onclick = ()=>{ abortGame(); show('select'); };
  document.getElementById('copy').onclick = async ()=>{ const m = document.getElementById('copied'); try { await navigator.clipboard.writeText(txt); m.textContent='Copied!'; } catch(e){ m.textContent = txt; } };
}

onReady.push(()=>{
  document.querySelectorAll('canvas[data-season]').forEach(c=>renderThumb(c, +c.dataset.season));
  document.querySelectorAll('canvas[data-chapter]').forEach(c=>renderChapterThumb(c, +c.dataset.chapter));
  requestAnimationFrame(drawIsland);
});
// landing page map preview
const lmc = document.getElementById('landmap');
if (lmc && window.CodeshireMap){ landingMap = window.CodeshireMap.create(lmc, { onSelect: ()=>enterAdventure() }); landingMap.setProgress({ unlocked:PROG.unlocked, done:PROG.done.slice(), stars:PROG.stars.slice(), at:PROG.at }); landingMap.start(); }

if (location.hash==='#suggest') show('suggest');
// test hook (only with ?debug in the URL): lets automated play-throughs read the current answer
if (/[?&]debug\b/.test(location.search)) window.__codeshire = { G, get foe(){ return foe; }, get PROG(){ return PROG; }, startChapter, openMap };

document.addEventListener('keydown', e=>{
  if (views.game.hidden) return;
  if (G.dlg && (e.key===' ' || e.key==='Enter')){ e.preventDefault(); nextLine(); return; }
  if (G.dlg && e.key==='Escape'){ skipDialogue(); return; }
  if (G.phase!=='challenge') return;
  if ((document.activeElement||{}).tagName==='INPUT') return;
  const n = parseInt(e.key,10); if (!n) return;
  const b = panel.querySelector(`.opt[data-i="${n-1}"]`); if (b && !b.disabled) b.click();
});

})();
