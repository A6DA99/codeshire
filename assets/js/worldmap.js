'use strict';
/*
 * Codeshire world map: one hand-placed pixel continent built from every art pack.
 *   Farm RPG tiny pack ......... Farmer Tom's farm (home)
 *   pixel_16_woods ............. the Whispering Woods
 *   0x72 Dungeon Tileset II .... the Bugged Catacombs, Abyss floor, allies and minions
 *   Cute Fantasy ............... Slimewater Crossing and the Forked Kingdom
 *   Tiny RPG packs 01 + 02 ..... soldier, orcs, Blood Monster (forge), Demon (abyss)
 *   Super Pixel Effects ........ fire, lava, warp, sparkles, fireworks
 *
 * Usage: const m = CodeshireMap.create(canvas, {onSelect(i){}, onArrive(i){}});
 *        m.setProgress({unlocked, done:[...], at}); m.travelTo(i); m.start(); m.stop();
 */
window.CodeshireMap = (() => {
  const W = 576, H = 352, T = 16, COLS = W / T, ROWS = H / T;
  const SRC = 'assets/img/';
  const files = ['grass', 'house', 'crops', 'fence', 'cow', 'chicken', 'farmer', 'chest', 'tree', 'woods', 'dungeon',
    'cf_grass', 'cf_water_mid', 'cf_house', 'cf_oak', 'cf_oak_small', 'cf_fences', 'cf_decor', 'cf_bridge', 'cf_sheep', 'cf_pig',
    'cf_slime', 'cf_skeleton', 'cf_player', 'cf_path', 'cf_chest',
    'soldier_Idle', 'soldier_Walk', 'orc_Idle', 'demon_Idle', 'blood_Idle',
    'fx/fire', 'fx/sparkle', 'fx/warp', 'fx/firework', 'fx/aura', 'fx/alert', 'fx/poison',
    'clouds/puffy', 'clouds/storm1'];
  const IMG = {}; let loaded = 0; const waiters = [];
  files.forEach(f => { const i = new Image(); i.onload = i.onerror = () => { if (++loaded === files.length) waiters.splice(0).forEach(w => w()); }; i.src = SRC + f + '.png'; IMG[f] = i; });
  const whenReady = fn => loaded === files.length ? fn() : waiters.push(fn);
  const FX = { fire: { w: 48, h: 64, n: 15, cols: 5 }, sparkle: { w: 32, h: 32, n: 18, cols: 18 }, warp: { w: 48, h: 48, n: 10, cols: 10 },
    firework: { w: 48, h: 48, n: 27, cols: 10 }, aura: { w: 48, h: 48, n: 16, cols: 5 }, alert: { w: 40, h: 40, n: 14, cols: 14 }, poison: { w: 64, h: 64, n: 17, cols: 17 } };

  // ---- deterministic noise ----
  const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ---- the route: home + six chapters ----
  const NODES = [
    { id: 'farm',  name: "Tom's Farm",          x: 92,  y: 286 },
    { id: 'woods', name: 'Whispering Woods',    x: 104, y: 178 },
    { id: 'crypt', name: 'Bugged Catacombs',    x: 120, y: 74 },
    { id: 'river', name: 'Slimewater Crossing', x: 232, y: 182 },
    { id: 'fork',  name: 'Forked Kingdom',      x: 330, y: 96 },
    { id: 'forge', name: 'Mount Prod',          x: 474, y: 116 },
    { id: 'abyss', name: 'Abyssal Stack',       x: 440, y: 270 },
  ];
  // waypoints from node i to node i+1
  const LEGS = [
    [[92, 286], [70, 252], [100, 222], [104, 178]],
    [[104, 178], [146, 146], [140, 108], [120, 74]],
    [[120, 74], [176, 82], [204, 124], [214, 182], [232, 182]],
    [[232, 182], [276, 170], [300, 128], [330, 96]],
    [[330, 96], [372, 126], [424, 136], [474, 116]],
    [[474, 116], [500, 168], [470, 220], [440, 270]],
  ];

  // ---- terrain: a continent made of one lobe per region (pixel coordinates) ----
  const LOBES = [
    { z: 'farm',   x: 92,  y: 272, rx: 92,  ry: 62 },
    { z: 'woods',  x: 96,  y: 168, rx: 92,  ry: 62 },
    { z: 'crypt',  x: 118, y: 72,  rx: 96,  ry: 56 },
    { z: 'meadow', x: 236, y: 196, rx: 76,  ry: 120 },
    { z: 'fork',   x: 336, y: 92,  rx: 100, ry: 72 },
    { z: 'meadow', x: 318, y: 238, rx: 84,  ry: 70 },
    { z: 'forge',  x: 482, y: 98,  rx: 86,  ry: 80 },
    { z: 'abyss',  x: 448, y: 264, rx: 104, ry: 66 },
  ];
  const wob = (x, y) => 0.06 * Math.sin(x * 0.09 + y * 0.05) + 0.05 * Math.cos(y * 0.11 - x * 0.07) + 0.03 * Math.sin(x * 0.23 + y * 0.31);
  const lobeD = (L, x, y) => Math.hypot((x - L.x) / L.rx, (y - L.y) / L.ry);
  function landPx(x, y) { if (x < 10 || y < 8 || x > W - 10 || y > H - 22) return false; let m = 9; for (const L of LOBES) m = Math.min(m, lobeD(L, x, y)); return m < 1 + wob(x, y); }
  const isLand = (c, r) => landPx(c * T + 8, r * T + 8);
  const RIVER_X = r => 12.9 + Math.sin(r * 0.55) * 0.9;           // river centre column for row r
  const onRiver = (x, y) => Math.abs(x - RIVER_X(y / T) * T) < 1.15 * T + 3;
  function isRiver(c, r) { const cx = RIVER_X(r); return r < ROWS - 1 && Math.abs(c + 0.5 - cx) < 1.15; }
  function zoneAt(x, y) {
    const n = 14 * Math.sin(x * 0.05 + y * 0.03) + 9 * Math.cos(y * 0.07 - x * 0.04);
    let best = null, bd = 99; for (const L of LOBES) { const d = lobeD(L, x + n, y - n * 0.6) * (L.z === 'meadow' ? 1.08 : 1); if (d < bd) { bd = d; best = L.z; } }
    return best;
  }
  const zone = (c, r) => zoneAt(c * T + 8, r * T + 8);

  // ---- drawing helpers ----
  const sp = (c, img, sx, sy, sw, sh, dx, dy, flip = false, s = 1) => {
    if (!img || !img.width) return;
    if (!flip && s === 1) { c.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh); return; }
    c.save(); c.translate(Math.round(dx + (flip ? sw * s : 0)), Math.round(dy)); c.scale(flip ? -s : s, s); c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); c.restore();
  };
  const WD = { big: [275, 10, 59, 70], med: [275, 92, 28, 36], pine: [308, 97, 25, 31], rock: [224, 36, 16, 12], mush: [225, 52, 14, 12],
    stump: [231, 80, 19, 16], wrock: [240, 98, 16, 13], lily: [226, 132, 13, 12], lily2: [247, 132, 9, 8], reed: [258, 132, 13, 12],
    flY: [81, 87, 14, 7], flP: [97, 87, 14, 7], tuft: [121, 88, 15, 8], bush: [228, 70, 10, 9], pinkf: [258, 54, 11, 10], darkblob: [151, 23, 66, 66] };
  const DG = { wall: [32, 16, 16, 16], wallTop: [32, 0, 16, 16], door: [32, 240, 32, 32], doorTop: [32, 224, 32, 16], column: [80, 80, 16, 48],
    bannerR: [16, 32, 16, 16], bannerB: [32, 32, 16, 16], bannerG: [16, 48, 16, 16], skull: [288, 432, 16, 16], crate: [288, 408, 16, 24],
    hole: [96, 144, 16, 16], stairs: [80, 192, 16, 16], chest: [304, 416, 16, 16], bomb: [288, 320, 16, 16], spikes: [16, 192, 16, 16],
    fount: [64, 16, 16, 16], fountTop: [64, 0, 16, 16], fountBasin: [64, 32, 16, 16] };
  const FLOORS = [[16, 64], [16, 64], [16, 64], [32, 64], [48, 64], [16, 80], [32, 80], [48, 80], [16, 96], [32, 96]];
  const W16 = (c, k, x, y, flip) => { const r = WD[k]; sp(c, IMG.woods, r[0], r[1], r[2], r[3], x, y, flip); };
  const D16 = (c, k, x, y) => { const r = DG[k]; sp(c, IMG.dungeon, r[0], r[1], r[2], r[3], x, y); };
  // animated dungeon character (4 frames, 16 px apart)
  const dgChar = (c, x0, y0, w, h, x, y, t, flip, speed = 140, off = 0) => { const f = Math.floor(t / speed + off) % 4; sp(c, IMG.dungeon, x0 + f * w, y0, w, h, x - w / 2, y - h, flip); };
  const tiny = (c, name, x, y, t, flip, s = 1, n = 6) => { const f = Math.floor(t / 110) % n; const img = IMG[name];
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(flip ? -s : s, s); c.drawImage(img, f * 100, 0, 100, 100, -52, -60, 100, 100); c.restore(); };
  const fxFrame = (c, k, f, cx, cy, s = 1, alpha = 1) => { const m = FX[k], img = IMG['fx/' + k]; f = f % m.n;
    c.save(); c.globalAlpha = alpha; c.drawImage(img, (f % m.cols) * m.w, Math.floor(f / m.cols) * m.h, m.w, m.h, Math.round(cx - m.w * s / 2), Math.round(cy - m.h * s / 2), m.w * s, m.h * s); c.restore(); };
  const shadow = (c, x, y, w) => { c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x, y, w, w * 0.35, 0, 0, Math.PI * 2); c.fill(); };

  // =========================================================================
  // Static terrain (drawn once to an offscreen canvas)
  // =========================================================================
  function buildTerrain() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    // ocean
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) c.drawImage(IMG.cf_water_mid, 0, 0, 16, 16, col * T, r * T, T, T);
    c.fillStyle = 'rgba(20,40,90,0.18)'; c.fillRect(0, 0, W, H);
    // ---- ground on a fine 4px grid: smooth coastline and soft region borders ----
    const G = 4, GC = W / G, GR = H / G;
    const land = [], zn = [];
    for (let r = 0; r < GR; r++) { land[r] = []; zn[r] = []; for (let q = 0; q < GC; q++) { const x = q * G + 2, y = r * G + 2; land[r][q] = landPx(x, y); zn[r][q] = land[r][q] ? zoneAt(x, y) : null; } }
    const L = (q, r) => r >= 0 && r < GR && q >= 0 && q < GC && land[r][q];
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) {
      if (!L(q, r) || L(q, r + 1)) continue; const x = q * G, y = (r + 1) * G;
      c.fillStyle = '#8a5a36'; c.fillRect(x, y, G, 5); c.fillStyle = '#6d4428'; c.fillRect(x, y + 5, G, 5); c.fillStyle = '#4e2f1b'; c.fillRect(x, y + 10, G, 2);
      if (hash(q, r) > 0.6) { c.fillStyle = '#a06a42'; c.fillRect(x + 1, y + 2, 2, 1); }
    }
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) {
      if (L(q, r) || L(q, r - 1) || L(q, r - 2) || L(q, r - 3)) continue;
      if (L(q - 1, r) || L(q + 1, r) || L(q, r + 1)) { c.fillStyle = 'rgba(225,245,255,0.40)'; c.fillRect(q * G, r * G, G, G); }
    }
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) {
      if (L(q, r) || !L(q, r - 4) || L(q, r - 1)) continue; c.fillStyle = 'rgba(225,245,255,0.5)'; c.fillRect(q * G, r * G + 1, G, 1);
    }
    const FLOORPICK = (x, y) => FLOORS[Math.floor(hash(x / 16 | 0, y / 16 | 0) * FLOORS.length)];
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) {
      if (!L(q, r)) continue;
      const x = q * G, y = r * G, z = zn[r][q], ox = x % 16, oy = y % 16;
      if (z === 'farm') c.drawImage(IMG.grass, 144 + ox, 32 + oy, G, G, x, y, G, G);
      else if (z === 'woods') { c.fillStyle = '#59c135'; c.fillRect(x, y, G, G); }
      else if (z === 'crypt' || z === 'abyss') { const f = FLOORPICK(x, y); c.drawImage(IMG.dungeon, f[0] + ox, f[1] + oy, G, G, x, y, G, G); }
      else if (z === 'forge') { const h = hash(x >> 3, y >> 3); c.fillStyle = h < 0.5 ? '#3b2a2c' : '#35252a'; c.fillRect(x, y, G, G); }
      else c.drawImage(IMG.cf_grass, ox, oy, G, G, x, y, G, G);
    }
    const stone = z => z === 'crypt' || z === 'abyss' || z === 'forge';
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) {
      if (!L(q, r)) continue; const z = zn[r][q];
      const nb = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dq, dr]) => L(q + dq, r + dr) ? zn[r + dr][q + dq] : z);
      if (nb.every(n => n === z)) continue;
      const x = q * G, y = r * G;
      if (stone(z) && nb.some(n => !stone(n))) { c.fillStyle = z === 'abyss' ? 'rgba(40,10,60,0.6)' : 'rgba(25,18,20,0.5)'; c.fillRect(x, y, G, G); }
      else if (!stone(z) && nb.some(stone)) { c.fillStyle = '#3f7a2e'; c.fillRect(x, y + (hash(q, r) * 3 | 0), G, 1); if (hash(r, q) > 0.5) c.fillRect(x + 1, y - 1, 1, 2); }
      else { c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(x, y, G, G); }
    }
    c.fillStyle = '#3f7a2e';
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) { if (!L(q, r)) continue; if (stone(zn[r][q])) continue;
      if (!L(q, r - 1)) c.fillRect(q * G, r * G, G, 1); if (!L(q - 1, r)) c.fillRect(q * G, r * G, 1, G); if (!L(q + 1, r)) c.fillRect(q * G + G - 1, r * G, 1, G); }
    const tint = { abyss: 'rgba(70,10,110,0.38)', crypt: 'rgba(20,20,40,0.12)', forge: 'rgba(120,30,10,0.10)' };
    for (let r = 0; r < GR; r++) for (let q = 0; q < GC; q++) { const z = zn[r][q]; if (z && tint[z]) { c.fillStyle = tint[z]; c.fillRect(q * G, r * G, G, G); } }
    // woods: dark grass blobs
    [[28, 130], [74, 182], [120, 140]].forEach(([x, y]) => W16(c, 'darkblob', x, y));
    // grass specks everywhere green
    for (let i = 0; i < 420; i++) { const x = hash(i, 7) * W | 0, y = hash(i, 9) * H | 0, col = x / T | 0, r = y / T | 0;
      if (!isLand(col, r) || isRiver(col, r)) continue; const z = zone(col, r);
      if (z === 'woods' || z === 'meadow' || z === 'fork' || z === 'farm') { c.fillStyle = z === 'woods' ? '#3f9a2e' : '#5f9d43'; c.fillRect(x, y, 2, 1); c.fillRect(x + 3, y + 1, 1, 2); } }
    // forge: lava cracks
    for (let i = 0; i < 26; i++) { const x = 420 + hash(i, 3) * 140, y = 20 + hash(i, 5) * 160, col = x / T | 0, r = y / T | 0;
      if (!isLand(col, r) || zone(col, r) !== 'forge') continue; c.fillStyle = '#ff6a1a'; c.fillRect(x, y, 6, 1); c.fillRect(x + 5, y + 1, 4, 1); c.fillStyle = '#ffcf4a'; c.fillRect(x + 2, y, 2, 1); }
    // the river (Cute Fantasy water) with sandy banks
    for (let y = 0; y < H; y += 2) { const cx = RIVER_X(y / T) * T, l = Math.round(cx - 1.15 * T), rr = Math.round(cx + 1.15 * T);
      for (let x = l; x < rr; x += 2) { if (!landPx(x, y)) continue; c.drawImage(IMG.cf_water_mid, x % 16, y % 16, 2, 2, x, y, 2, 2); }
      if (landPx(l - 2, y)) { c.fillStyle = '#e8c98a'; c.fillRect(l - 3, y, 3, 2); }
      if (landPx(rr + 2, y)) { c.fillStyle = '#e8c98a'; c.fillRect(rr, y, 3, 2); }
    }
    // abyss chasm
    const ax = 448, ay = 290;
    const g = c.createRadialGradient(ax, ay, 4, ax, ay, 46); g.addColorStop(0, '#000000'); g.addColorStop(0.55, '#12051f'); g.addColorStop(1, 'rgba(18,5,31,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(ax, ay, 58, 26, 0, 0, Math.PI * 2); c.fill();
    // roads
    LEGS.forEach(leg => roadPath(c, leg));
    return cv;
  }
  function roadPath(c, leg) {
    const pts = sampleLeg(leg, 2);
    pts.forEach(([x, y]) => { if (onRiver(x, y)) return; c.fillStyle = '#9a7548'; c.fillRect(x - 6, y - 4, 12, 9); });
    pts.forEach(([x, y]) => { if (onRiver(x, y)) return;
      const z = zoneAt(x, y); c.fillStyle = z === 'crypt' || z === 'abyss' ? '#6b5a66' : z === 'forge' ? '#5a3f36' : '#d9a066'; c.fillRect(x - 5, y - 3, 10, 7); });
    pts.forEach(([x, y], i) => { if (i % 5) return; if (onRiver(x, y)) return; c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x - 2 + (i % 3), y, 2, 1); });
  }
  // Catmull-Rom sampling of a leg, roughly `step` px apart
  function sampleLeg(leg, step) {
    const out = []; const P = [leg[0]].concat(leg, [leg[leg.length - 1]]);
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(2, Math.ceil(len / step));
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    out.push(leg[leg.length - 1]); return out;
  }
  const ROUTE = LEGS.map(l => sampleLeg(l, 1));

  // =========================================================================
  // Region scenery (drawn every frame, sorted so it layers nicely)
  // =========================================================================
  function scenery(c, t, st) {
    const items = []; // [y, fn]
    const add = (y, fn) => items.push([y, fn]);

    // ---- FARM (Farm RPG tiny pack) ----
    add(300, () => c.drawImage(IMG.house, 148, 3, 72, 95, 6, 206, 72, 95));
    add(292, () => c.drawImage(IMG.chest, 0, 0, 16, 16, 76, 284, 16, 16));
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const crop = [[80, 16], [80, 48], [80, 80], [96, 16]][(r + k) % 4];
      add(256 + r * 12, () => c.drawImage(IMG.crops, crop[0], crop[1], 16, 16, 108 + k * 14, 242 + r * 12, 16, 16)); }
    add(270, () => { c.drawImage(IMG.fence, 0, 32, 48, 16, 104, 268, 48, 16); c.drawImage(IMG.fence, 0, 32, 48, 16, 148, 268, 22, 16); });
    add(312, () => c.drawImage(IMG.cow, (Math.floor(t / 300) % 4) * 32, 0, 32, 32, 120, 282, 32, 32));
    [[150, 298, 0], [164, 304, 1], [140, 310, 2]].forEach(([x, y, o]) => add(y, () => sp(c, IMG.chicken, (Math.floor(t / 180 + o) % 4) * 16, 0, 16, 16, x + Math.sin(t / 900 + o) * 4, y - 14, Math.sin(t / 900 + o) < 0)));
    add(282, () => c.drawImage(IMG.farmer, (Math.floor(t / 220) % 4) * 32, 0, 32, 32, 58, 256, 32, 32));
    [[150, 214], [24, 316]].forEach(([x, y]) => add(y, () => c.drawImage(IMG.tree, 96, 1, 32, 46, x, y - 46, 32, 46)));

    // ---- WHISPERING WOODS (pixel_16_woods) ----
    [[2, 118, 'big'], [48, 132, 'pine'], [140, 168, 'big'], [24, 196, 'med'], [150, 132, 'pine'], [62, 210, 'big'], [128, 214, 'med'], [6, 186, 'pine'],
      [86, 118, 'med'], [168, 210, 'pine']].forEach(([x, y, k]) => { const r = WD[k]; add(y + r[3], () => W16(c, k, x, y)); });
    [[30, 168, 'mush'], [70, 158, 'flY'], [124, 196, 'flP'], [44, 232, 'stump'], [16, 248, 'rock'], [150, 196, 'mush'], [94, 236, 'tuft'], [116, 168, 'pinkf'], [62, 186, 'bush']]
      .forEach(([x, y, k]) => add(y, () => W16(c, k, x, y)));
    // orc war camp
    add(176, () => { c.fillStyle = '#6b4a2e'; c.fillRect(36, 150, 2, 22); c.fillStyle = '#c2421f'; c.fillRect(38, 150, 10, 7); c.fillStyle = '#7a1e10'; c.fillRect(38, 157, 6, 2); });

    // ---- BUGGED CATACOMBS (0x72 Dungeon II) ----
    // ruined wall with door
    for (let k = 0; k < 9; k++) { const x = 40 + k * 16; if (k === 4) continue;
      add(54, () => { D16(c, 'wallTop', x, 22); D16(c, 'wall', x, 38); if (k === 2) D16(c, 'bannerR', x, 38); if (k === 6) D16(c, 'bannerB', x, 38); }); }
    add(56, () => { D16(c, 'doorTop', 104, 22); D16(c, 'door', 104, 38); });
    [[26, 30], [188, 30]].forEach(([x, y]) => add(y + 48, () => D16(c, 'column', x, y)));
    add(54, () => { const f = Math.floor(t / 160) % 3; sp(c, IMG.dungeon, 64 + f * 16, 16, 16, 16, 152, 38); D16(c, 'fountTop', 152, 22); });
    [[60, 92, 'skull'], [168, 84, 'crate'], [40, 110, 'bomb'], [180, 108, 'hole'], [80, 104, 'stairs']].forEach(([x, y, k]) => add(y + 12, () => D16(c, k, x, y)));
    add(106, () => { const f = Math.floor(t / 200) % 4; sp(c, IMG.dungeon, 16 + f * 16, 192, 16, 16, 140, 96); });
    // torches (fire fx) on the wall
    [[58, 34], [174, 34]].forEach(([x, y], i) => add(55, () => fxFrame(c, 'fire', Math.floor(t / 70) + i * 4, x, y, 0.32)));

    // ---- SLIMEWATER CROSSING (Cute Fantasy) ----
    // bridge where the road crosses the river
    add(186, () => { for (let k = 0; k < 3; k++) sp(c, IMG.cf_bridge, 5, 0, 38, 16, 190 + k * 16, 174, false); c.fillStyle = '#4e2f1b'; c.fillRect(190, 172, 48, 2); c.fillRect(190, 189, 48, 2); });
    [[205, 70, 'lily'], [196, 250, 'lily2'], [214, 300, 'wrock'], [190, 130, 'reed'], [218, 120, 'lily']].forEach(([x, y, k]) => add(y, () => W16(c, k, x, y)));
    [[252, 200, 0], [268, 236, 1], [298, 248, 0]].forEach(([x, y, k]) => add(y, () => sp(c, IMG.cf_oak_small, k ? 69 : 37, 3, 23, k ? 26 : 34, x, y - (k ? 26 : 34))));
    add(318, () => sp(c, IMG.cf_oak, 11, 9, 41, 63, 262, 252));
    [[262, 282, 'sheep'], [326, 232, 'pig'], [290, 306, 'sheep']].forEach(([x, y, k], i) => add(y, () => sp(c, IMG['cf_' + k], (Math.floor(t / 400 + i) % 2) * 32, 0, 32, 32, x - 16, y - 24, i === 1)));
    add(212, () => { const x = 196, y = 206 + Math.sin(t / 500) * 1.2; c.fillStyle = '#6d4428'; c.fillRect(x, y, 22, 6); c.fillStyle = '#8a5a36'; c.fillRect(x + 2, y - 2, 18, 3); });
    [[270, 160, 'flY'], [306, 196, 'flP'], [250, 230, 'tuft']].forEach(([x, y, k]) => add(y, () => W16(c, k, x, y)));

    // meadow between river and abyss
    const CD = { stump: [0, 32, 16, 16], rockS: [32, 32, 16, 16], rock1: [0, 48, 16, 16], rock2: [16, 48, 16, 16], crystal: [48, 48, 16, 16], gold: [0, 80, 16, 16],
      log: [4, 115, 25, 11], mush: [36, 117, 8, 8], sign: [48, 0, 16, 16], flower1: [0, 16, 16, 16], flower2: [16, 16, 16, 16], potR: [32, 160, 16, 18], potY: [48, 160, 16, 18] };
    const CDd = (k, x, y) => { const r = CD[k]; sp(c, IMG.cf_decor, r[0], r[1], r[2], r[3], x, y); };
    [[262, 262, 'log'], [340, 250, 'rock1'], [356, 258, 'rock2'], [336, 286, 'crystal'], [224, 316, 'mush'], [286, 222, 'flower1'], [242, 292, 'flower2'],
      [352, 296, 'gold'], [314, 200, 'stump'], [254, 150, 'sign'], [368, 220, 'rockS'], [228, 230, 'potR'], [240, 232, 'potY']].forEach(([x, y, k]) => add(y + 12, () => CDd(k, x, y)));
    add(322, () => sp(c, IMG.cf_oak, 11, 9, 41, 63, 346, 260));
    add(244, () => { // a little pond with lilies
      c.fillStyle = '#e8c98a'; c.beginPath(); c.ellipse(300, 250, 19, 9, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.ellipse(300, 250, 17, 7.5, 0, 0, Math.PI * 2); c.clip(); for (let x = 280; x < 320; x += 16) c.drawImage(IMG.cf_water_mid, x, 240); c.restore();
      W16(c, 'lily2', 292, 246); W16(c, 'lily2', 304, 250); });
    // ---- FORKED KINGDOM (Cute Fantasy + graveyard) ----
    add(122, () => sp(c, IMG.cf_house, 13, 1, 70, 114, 262, 8));
    add(64, () => sp(c, IMG.cf_oak, 11, 9, 41, 63, 360, 4));
    [[350, 70], [400, 66]].forEach(([x, y]) => add(y + 40, () => sp(c, IMG.cf_decor, 68, 72, 10, 40, x, y)));
    for (let k = 0; k < 3; k++) add(150, () => sp(c, IMG.cf_fences, 21, 3, 38, 11, 248 + k * 36, 140));
    // the two banners of Main and Feature
    [[316, 30, '#3d7bd6'], [372, 30, '#e8822a']].forEach(([x, y, col]) => add(y + 30, () => { c.fillStyle = '#4e3a2a'; c.fillRect(x, y, 2, 30);
      const wave = Math.round(Math.sin(t / 300 + x) * 1.5); c.fillStyle = col; c.fillRect(x + 2, y + 1, 12, 8 + wave); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(x + 2, y + 7 + wave, 12, 2); }));
    // graves
    [[396, 128], [414, 138], [380, 142], [404, 152], [360, 150]].forEach(([x, y]) => add(y + 10, () => { c.fillStyle = '#5a5f6e'; c.fillRect(x, y, 10, 11); c.fillRect(x + 1, y - 1, 8, 1); c.fillStyle = '#8b92a3'; c.fillRect(x + 1, y, 8, 9); c.fillStyle = '#5a5f6e'; c.fillRect(x + 4, y + 2, 2, 6); c.fillRect(x + 2, y + 4, 6, 2); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x - 1, y + 11, 12, 2); }));
    [[300, 150, 0], [344, 132, 16]].forEach(([x, y, o]) => add(y, () => sp(c, IMG.cf_decor, 0 + o, 16, 16, 16, x, y - 16)));

    // ---- MOUNT PROD (forge volcano + server racks) ----
    add(96, () => {
      const vx = 506, vy = 96, H2 = 70;
      for (let k = 0; k < H2; k += 2) { const half = 12 + (H2 - k) * 0.85, y = vy - k;
        c.fillStyle = k % 6 < 2 ? '#553638' : '#4a2f31'; c.fillRect(Math.round(vx - half), y - 2, Math.round(half * 2), 2);
        c.fillStyle = '#6a4442'; c.fillRect(Math.round(vx - half), y - 2, Math.round(half * 0.55), 2);      // lit west face
        c.fillStyle = '#3a2426'; c.fillRect(Math.round(vx + half * 0.55), y - 2, Math.round(half * 0.45), 2); }  // shaded east face
      c.fillStyle = '#2a1a1c'; c.fillRect(vx - 13, vy - H2 - 3, 26, 3);
      c.fillStyle = '#ff6a1a'; c.fillRect(vx - 11, vy - H2 - 4, 22, 3); c.fillStyle = '#ffcf4a'; c.fillRect(vx - 6, vy - H2 - 5, 12, 2);
      const k = (t / 45) % 50;
      [[-3, 0, 34], [-7, 30, 22], [4, 8, 18]].forEach(([dx, y0, len]) => { c.fillStyle = '#d8461a'; c.fillRect(vx + dx, vy - H2 + y0, 3, len); c.fillStyle = '#ff9a2a'; c.fillRect(vx + dx + 1, vy - H2 + y0, 1, len); });
      c.fillStyle = '#ffe07a'; c.fillRect(vx - 2, vy - H2 + (k % 34), 1, 3);
      fxFrame(c, 'fire', Math.floor(t / 70), vx, vy - H2 - 20, 0.7); fxFrame(c, 'fire', Math.floor(t / 70) + 7, vx - 10, vy - H2 - 14, 0.45); fxFrame(c, 'fire', Math.floor(t / 70) + 3, vx + 10, vy - H2 - 12, 0.4);
      // smoke puffs
      for (let i = 0; i < 4; i++) { const p = ((t / 30) + i * 25) % 100; c.fillStyle = `rgba(60,50,55,${0.45 * (1 - p / 100)})`; c.beginPath(); c.ellipse(vx + Math.sin(p / 14 + i) * 6 + p * 0.25, vy - H2 - 30 - p * 0.5, 6 + p * 0.1, 4 + p * 0.06, 0, 0, Math.PI * 2); c.fill(); }
    });
    // server racks with blinking LEDs
    [[420, 150], [436, 150], [452, 150], [508, 150]].forEach(([x, y], i) => add(y + 22, () => { c.fillStyle = '#1d1a22'; c.fillRect(x, y, 14, 22); c.fillStyle = '#2f2b38'; c.fillRect(x + 1, y + 1, 12, 20);
      for (let k = 0; k < 4; k++) { const on = hash(i * 9 + k, Math.floor(t / 300)) > 0.4; c.fillStyle = on ? (hash(i, k) > 0.7 ? '#ff3b3b' : '#4dff6a') : '#14321a'; c.fillRect(x + 3, y + 3 + k * 5, 2, 2); c.fillStyle = '#4a4458'; c.fillRect(x + 6, y + 3 + k * 5, 6, 2); } }));
    [[470, 160, 'crate'], [490, 168, 'bomb']].forEach(([x, y, k]) => add(y + 16, () => D16(c, k, x, y)));
    [[540, 168], [412, 186]].forEach(([x, y], i) => add(y, () => fxFrame(c, 'fire', Math.floor(t / 70) + i * 5, x, y - 14, 0.4)));

    // ---- ABYSSAL STACK ----
    add(296, () => { // stack frames floating up out of the chasm
      for (let k = 0; k < 4; k++) { const y = 290 - ((t / 40 + k * 18) % 72), a = Math.max(0, 1 - (290 - y) / 72);
        c.fillStyle = `rgba(190,120,255,${0.35 * a})`; c.fillRect(424 - k * 2, y, 32 + k * 4, 6); c.fillStyle = `rgba(255,255,255,${0.5 * a})`; c.fillRect(428 - k * 2, y + 2, 10, 1); }
      fxFrame(c, 'warp', Math.floor(t / 90), 440, 290, 0.8, 0.7);
    });
    [[384, 238], [500, 240]].forEach(([x, y]) => add(y + 48, () => D16(c, 'column', x, y)));
    [[396, 300, 'skull'], [486, 300, 'skull'], [372, 276, 'spikes']].forEach(([x, y, k]) => add(y + 10, () => D16(c, k, x, y)));

    // ---- characters per region: enemies until cleared, allies always, boss marker on the next fight ----
    const NPCS = [
      null,
      { ally: () => dgChar(c, 128, 4, 16, 28, 122, 182, t, true), foes: () => { tiny(c, 'orc_Idle', 52, 172, t, false); tiny(c, 'orc_Idle', 70, 166, t + 300, true); dgChar(c, 368, 40, 16, 16, 30, 176, t, false, 150, 1); } },
      { ally: () => dgChar(c, 128, 164, 16, 28, 140, 78, t, true), foes: () => { dgChar(c, 16, 380, 32, 36, 120, 116, t, false, 180); dgChar(c, 368, 88, 16, 16, 86, 92, t, false, 140, 2); dgChar(c, 368, 40, 16, 16, 158, 100, t, true, 150); } },
      { ally: () => sp(c, IMG.cf_player, (Math.floor(t / 150) % 6) * 32, 32, 32, 32, 236, 154, true), foes: () => { [[260, 186, 0], [284, 196, 2], [206, 236, 1]].forEach(([x, y, o]) => sp(c, IMG.cf_slime, (Math.floor(t / 150 + o) % 4) * 64, 0, 64, 64, x - 32, y - 42)); } },
      { ally: () => dgChar(c, 128, 100, 16, 28, 312, 104, t, false), foes: () => { [[372, 116, 0], [392, 108, 2]].forEach(([x, y, o]) => sp(c, IMG.cf_skeleton, (Math.floor(t / 150 + o) % 6) * 32, 32, 32, 32, x - 16, y - 25, true)); dgChar(c, 368, 225, 16, 23, 418, 120, t, true); } },
      { ally: () => dgChar(c, 128, 260, 16, 28, 456, 136, t, false), foes: () => { tiny(c, 'blood_Idle', 520, 140, t, true); dgChar(c, 368, 273, 16, 23, 492, 194, t, true); dgChar(c, 368, 64, 16, 16, 430, 200, t, false); } },
      { ally: () => dgChar(c, 128, 196, 16, 28, 412, 262, t, false), foes: () => { tiny(c, 'demon_Idle', 470, 268, t, true, 1.2); dgChar(c, 368, 273, 16, 23, 404, 300, t, false); dgChar(c, 368, 64, 16, 16, 494, 296, t, true); } },
    ];
    NPCS.forEach((n, i) => { if (!n) return; const node = NODES[i];
      if (!st.done[i - 1]) add(node.y + 2, n.foes);
      if (st.unlocked >= i) add(node.y + 4, n.ally);
    });

    items.sort((a, b) => a[0] - b[0]).forEach(([, fn]) => fn());
  }

  // =========================================================================
  // Map instance
  // =========================================================================
  function create(canvas, opts = {}) {
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    let terrain = null, running = false, hover = -1;
    const st = { unlocked: 1, done: [false, false, false, false, false, false], at: 0 };
    const hero = { node: 0, path: null, k: 0, facing: false, onArrive: null };
    const DARK = z => z === 'crypt' || z === 'forge' || z === 'abyss';
    const clouds = Array.from({ length: 6 }, (_, i) => ({ x: hash(i, 1) * (W + 80), y: 14 + hash(i, 2) * (H - 70), v: 0.05 + hash(i, 3) * 0.06 }));
    const parts = Array.from({ length: 30 }, (_, i) => ({ x: hash(i, 11) * W, y: hash(i, 12) * H, p: hash(i, 13) * 6.28 }));

    function heroPos() {
      if (hero.path) { const i = Math.min(hero.path.length - 1, Math.floor(hero.k)); return hero.path[i]; }
      const n = NODES[hero.node]; return [n.x, n.y];
    }
    function drawMarkers(t) {
      NODES.forEach((n, i) => {
        const locked = i > st.unlocked, done = i > 0 && st.done[i - 1], isNext = i === Math.min(st.unlocked, 6) && !done && i > 0;
        if (locked) return;
        c.fillStyle = done ? 'rgba(242,201,76,0.9)' : 'rgba(184,243,90,0.9)';
        c.beginPath(); c.ellipse(n.x, n.y + 3, 9, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(n.x, n.y + 3, 6, 2.5, 0, 0, Math.PI * 2); c.fill();
        if (isNext) fxFrame(c, 'alert', Math.floor(t / 70), n.x, n.y - 30, 0.6);
        if (done) fxFrame(c, 'sparkle', Math.floor(t / 60) + i * 3, n.x, n.y - 6, 0.8);
      });
    }
    function drawLabels() {
      c.textAlign = 'center'; c.font = '8px "Pixelify Sans", monospace';
      NODES.forEach((n, i) => {
        const locked = i > st.unlocked, done = i > 0 && st.done[i - 1];
        const label = locked ? (i + '. ???') : (i > 0 ? i + '. ' : '') + n.name;
        const w = c.measureText(label).width + 8, ly = n.y + 16;
        c.fillStyle = hover === i && !locked ? 'rgba(242,201,76,0.95)' : 'rgba(10,14,22,0.82)';
        c.fillRect(Math.round(n.x - w / 2), ly - 8, Math.round(w), 11);
        c.fillStyle = hover === i && !locked ? '#10141c' : locked ? '#7d8796' : done ? '#F2C94C' : '#e9f1ff';
        c.fillText(label, n.x, ly);
        if (done) { c.fillStyle = '#F2C94C'; for (let k = 0; k < (st.stars ? st.stars[i - 1] || 0 : 0); k++) c.fillRect(Math.round(n.x - 7 + k * 6), ly + 5, 4, 4); }
        if (locked) { c.fillStyle = '#c9d6ea'; c.fillRect(n.x - 3, n.y - 6, 6, 5); c.strokeStyle = '#c9d6ea'; c.lineWidth = 1; c.strokeRect(n.x - 1.5, n.y - 9.5, 3, 4); }
      });
    }
    // clouds hide the places you haven't reached yet: sky-blue clouds over green land, black clouds over dark land
    const FOG = [[-26, -14], [8, -18], [-8, -4], [16, 0], [-30, 4], [-2, -26]];
    function drawFog(t) {
      NODES.forEach((n, i) => { if (i <= st.unlocked) return;
        const img = IMG[DARK(zoneAt(n.x, n.y)) ? 'clouds/storm1' : 'clouds/puffy'];
        FOG.forEach(([dx, dy], j) => { if (!img || !img.width) return;
          const x = Math.round(n.x + dx * 1.2 - img.width / 2 + Math.sin(t / 1600 + j + i) * 2), y = Math.round(n.y - 8 + dy + Math.cos(t / 1900 + j) * 1.5);
          c.save(); c.globalAlpha = 0.2; c.filter = 'brightness(0)'; c.drawImage(img, x + 3, y + 8); c.restore();
          c.drawImage(img, x, y);
        });
      });
    }
    function frame() {
      if (!running) return;
      const t = performance.now();
      if (!terrain) terrain = buildTerrain();
      c.drawImage(terrain, 0, 0);
      // water sparkles
      for (let i = 0; i < 40; i++) { const x = (hash(i, 21) * W + t / 60) % W, y = hash(i, 22) * H; if (isLand(x / T | 0, y / T | 0) && !isRiver(x / T | 0, y / T | 0)) continue;
        const a = 0.2 + 0.4 * Math.abs(Math.sin(t / 700 + i)); c.fillStyle = `rgba(210,240,255,${a})`; c.fillRect(x | 0, y | 0, 3, 1); }
      // lava glow on the volcano, purple pulse in the abyss
      c.fillStyle = `rgba(255,120,40,${0.08 + 0.05 * Math.sin(t / 400)})`; c.beginPath(); c.ellipse(500, 40, 50, 30, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(160,60,255,${0.10 + 0.06 * Math.sin(t / 500)})`; c.beginPath(); c.ellipse(440, 292, 70, 34, 0, 0, Math.PI * 2); c.fill();
      // walked-route highlight
      for (let i = 0; i < Math.min(st.unlocked, LEGS.length); i++) { const pts = ROUTE[i]; c.fillStyle = 'rgba(242,201,76,0.55)'; for (let k = 0; k < pts.length; k += 6) c.fillRect(pts[k][0] - 1, pts[k][1], 2, 2); }
      scenery(c, t, st);
      // hero (soldier) walking the road
      if (hero.path) { hero.k += 1.4; if (hero.k >= hero.path.length - 1) { hero.node = hero.target; hero.path = null; const cb = hero.onArrive; hero.onArrive = null; if (cb) cb(hero.node); if (opts.onArrive) opts.onArrive(hero.node); } }
      const [hx, hy] = heroPos();
      if (hero.path) { const nx = hero.path[Math.min(hero.path.length - 1, Math.floor(hero.k) + 4)]; hero.facing = nx[0] < hx; }
      shadow(c, hx, hy + 1, 6);
      tiny(c, hero.path ? 'soldier_Walk' : 'soldier_Idle', hx, hy + 1 + (hero.path ? 0 : Math.round(Math.sin(t / 300))), t, hero.facing, 1, hero.path ? 8 : 6);
      drawMarkers(t);
      drawFog(t);
      // drifting pixel clouds with soft shadows
      clouds.forEach(cl => { cl.x += cl.v; const img = IMG[DARK(zoneAt(cl.x + 18, cl.y + 30)) ? 'clouds/storm1' : 'clouds/puffy']; if (!img || !img.width) return; if (cl.x > W + 10) cl.x = -img.width - 10;
        const x = Math.round(cl.x), y = Math.round(cl.y);
        c.save(); c.globalAlpha = 0.18; c.filter = 'brightness(0)'; c.drawImage(img, x + 8, y + 22); c.restore();
        c.save(); c.globalAlpha = 0.92; c.drawImage(img, x, y); c.restore(); });
      // particles: leaves near woods, embers near forge, motes near the abyss
      parts.forEach((p, i) => { p.y -= 0.15; p.x += Math.sin(t / 800 + p.p) * 0.2; if (p.y < 0) p.y = H; const z = zone(p.x / T | 0, p.y / T | 0);
        c.fillStyle = z === 'forge' ? '#ffb24a' : z === 'abyss' ? '#c38bff' : z === 'woods' ? '#c8f07a' : 'rgba(255,255,255,0.5)'; c.fillRect(p.x | 0, p.y | 0, 1, 1); });
      drawLabels();
      requestAnimationFrame(frame);
    }
    function pick(ev) {
      const r = canvas.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
      let best = -1, bd = 22; NODES.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - 4 - y); if (d < bd) { bd = d; best = i; } }); return best;
    }
    canvas.addEventListener('mousemove', e => { hover = pick(e); canvas.style.cursor = hover >= 0 && hover <= st.unlocked ? 'pointer' : 'default'; });
    canvas.addEventListener('mouseleave', () => { hover = -1; });
    canvas.addEventListener('click', e => { const i = pick(e); if (i >= 0 && i <= st.unlocked && opts.onSelect) opts.onSelect(i); });

    return {
      nodes: NODES,
      setProgress(p) { Object.assign(st, p); if (!hero.path && typeof p.at === 'number') hero.node = p.at; },
      // walk the soldier along the road from where he stands to node i (forwards or backwards)
      travelTo(i, cb) {
        if (hero.path || i === hero.node) { if (cb) cb(i); return; }
        let path = [];
        if (i > hero.node) for (let k = hero.node; k < i; k++) path = path.concat(ROUTE[k]);
        else for (let k = hero.node - 1; k >= i; k--) path = path.concat(ROUTE[k].slice().reverse());
        hero.path = path; hero.k = 0; hero.target = i; hero.onArrive = cb || null;
      },
      isTravelling: () => !!hero.path,
      start() { if (running) return; running = true; whenReady(() => requestAnimationFrame(frame)); },
      stop() { running = false; },
    };
  }
  return { create, NODES, size: { w: W, h: H } };
})();
