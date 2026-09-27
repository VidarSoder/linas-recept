/* ==========================================================================
   Köket — the whole book standing in a real kitchen, seen from above.
   Three cats live here.
   ========================================================================== */
function initKitchen(A) {
  const W = 3000, H = 2000, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ov = document.getElementById('kitchen'), cv = document.getElementById('kCanvas'), ctx = cv.getContext('2d');
  const tipEl = document.getElementById('kTip'), panel = document.getElementById('kPanel');
  const DPR = A.DPR, COARSE = matchMedia('(pointer: coarse)').matches;
  const rnd = mulberry(2024);
  const chap = n => A.CHAPTERS.find(c => c.n === n);
  const sec = (n, name) => chap(n).sections.find(s => s[0] === name)[1];

  /* ---------------- layout ---------------- */
  const SOLID = [
    { x: 90, y: 50, w: 700, h: 360, name: 'range' },
    { x: 790, y: 50, w: 2160, h: 290, name: 'counter' },
    { x: 420, y: 620, w: 1300, h: 440, name: 'island' },
    { x: 50, y: 470, w: 200, h: 250, name: 'fridge' }
  ];
  const TABLE = { x: 1900, y: 560, w: 1000, h: 690 }, DINING = { cx: 760, cy: 1480, r: 330 };
  const DISH = [];
  const add = (id, x, y, s, zone) => DISH.push({ id, x, y, s, zone });
  sec(2, 'Grytor').forEach((id, i) => add(id, 185 + (i % 4) * 170, i < 4 ? 150 : 320, 190, 'Spisen'));
  [...sec(2, 'Soppor'), ...sec(2, 'Ugn, panna & ris')].forEach((id, i) => add(id, 862 + (i % 8) * 142, i < 8 ? 124 : 266, 152, 'Bänken'));
  const ch1 = chap(1).sections.flatMap(s => s[1]);
  ch1.forEach((id, i) => add(id, 488 + (i % 10) * 128, i < 10 ? 735 : 945, 138, 'Köksön'));
  const ch3 = chap(3).sections.flatMap(s => s[1]);
  ch3.forEach((id, i) => add(id, 1972 + (i % 7) * 142, 648 + Math.floor(i / 7) * 164, 134, 'Skafferibordet'));
  const drinks = sec(4, 'Drycker'); [[2690, 128], [2850, 128], [2770, 262]].forEach((p, i) => add(drinks[i], p[0], p[1], 126, 'Kaffehörnan'));
  const ch4 = chap(4).sections.filter(s => s[0] !== 'Drycker').flatMap(s => s[1]);
  ch4.forEach((id, i) => { const inner = i < 5, n = inner ? 5 : ch4.length - 5, k = inner ? i : i - 5, a = -Math.PI / 2 + (k / n) * Math.PI * 2 + (inner ? .6 : 0), r = inner ? 118 : 245; add(id, DINING.cx + Math.cos(a) * r, DINING.cy + Math.sin(a) * r, 122, 'Matbordet'); });
  const byId = Object.fromEntries(DISH.map(d => [d.id, d]));
  const ZONES = [
    { name: 'Spisen', sub: 'Flik 2 · Grytor', n: 2, cam: [440, 230, 1.5], sign: [440, 452] },
    { name: 'Bänken', sub: 'Flik 2 · Soppor & ugnsrätter', n: 2, cam: [1360, 200, 1.35], sign: [1360, 380] },
    { name: 'Köksön', sub: 'Flik 1 · Pasta & nudlar', n: 1, cam: [1070, 840, 1.2], sign: [1070, 1108] },
    { name: 'Skafferibordet', sub: 'Flik 3 · Såser, röror & tillbehör', n: 3, cam: [2400, 905, 1.05], sign: [2400, 1300] },
    { name: 'Matbordet', sub: 'Flik 4 · Frukost, bakat & sött', n: 4, cam: [760, 1480, 1.2], sign: [760, 1872] },
    { name: 'Kaffehörnan', sub: 'Flik 4 · Drycker', n: 4, cam: [2690, 190, 2], sign: [2690, 380] }
  ];
  const STEAMY = new Set([...sec(2, 'Grytor'), ...sec(2, 'Soppor'), 'varm-choklad', 'ramen']);

  /* ---------------- static scene ---------------- */
  let STATIC = null, LIGHT = null, Q = 1;
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
  function planks() {
    const T = mk(1200, 840), c = T.getContext('2d'), r = mulberry(5);
    const cols = ['#b38658', '#a97c50', '#bd9164', '#a57549', '#b88b5d'];
    for (let row = 0; row < 7; row++) {
      let x = -r() * 600; const y = row * 120;
      while (x < 1200) {
        const len = 380 + r() * 560, col = cols[Math.floor(r() * cols.length)];
        for (const dx of [0, 1200]) {
          const g = c.createLinearGradient(0, y, 0, y + 120); g.addColorStop(0, C.light(col, .06)); g.addColorStop(1, C.dark(col, .06));
          c.fillStyle = g; c.fillRect(x - dx, y, len, 120);
          c.strokeStyle = C.rgba(C.dark(col, .35), .22); c.lineWidth = 1.2;
          for (let k = 0; k < 7; k++) { const gy = y + 10 + r() * 100; c.beginPath(); c.moveTo(x - dx, gy); for (let q = 0; q <= 8; q++) c.lineTo(x - dx + q * len / 8, gy + Math.sin(q * 1.3 + k) * 2.5); c.stroke(); }
          if (r() < .5) { const kx = x - dx + r() * len, ky = y + 30 + r() * 60; c.strokeStyle = C.rgba(C.dark(col, .4), .35); c.beginPath(); c.ellipse(kx, ky, 14, 6, 0, 0, TAU); c.stroke(); }
          c.fillStyle = 'rgba(40,24,12,.55)'; c.fillRect(x - dx + len - 2, y, 3, 120);
        }
        x += len;
      }
      c.fillStyle = 'rgba(40,24,12,.5)'; c.fillRect(0, y + 118, 1200, 3);
    }
    return T;
  }
  function terrazzo(w, h) {
    const T = mk(w, h), c = T.getContext('2d'), r = mulberry(9);
    c.fillStyle = '#e7e1d5'; c.fillRect(0, 0, w, h);
    const chips = ['#c9bfae', '#a89b88', '#d9cfbf', '#8f8474', '#e8b9a0', '#9fb3a6'];
    for (let i = 0; i < w * h / 180; i++) { c.fillStyle = chips[Math.floor(r() * chips.length)]; c.globalAlpha = .45 + r() * .5; const s = 1.5 + r() * 5; c.beginPath(); c.ellipse(r() * w, r() * h, s, s * (.5 + r() * .5), r() * 3, 0, TAU); c.fill(); }
    c.globalAlpha = 1; return T;
  }
  function woodTop(w, h, base, dir = 'v', strip = 60, seed = 3) {
    const T = mk(w, h), c = T.getContext('2d'), r = mulberry(seed);
    const n = Math.ceil((dir === 'v' ? w : h) / strip);
    for (let i = 0; i < n; i++) {
      const col = C.mix(base, r() < .5 ? C.light(base, .12) : C.dark(base, .12), r());
      c.fillStyle = col; dir === 'v' ? c.fillRect(i * strip, 0, strip, h) : c.fillRect(0, i * strip, w, strip);
      c.strokeStyle = C.rgba(C.dark(base, .45), .18); c.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const o = i * strip + 6 + r() * (strip - 12); c.beginPath(); if (dir === 'v') { c.moveTo(o, 0); for (let q = 0; q <= 10; q++) c.lineTo(o + Math.sin(q + k * 2) * 2, q * h / 10); } else { c.moveTo(0, o); for (let q = 0; q <= 10; q++) c.lineTo(q * w / 10, o + Math.sin(q + k * 2) * 2); } c.stroke(); }
      c.fillStyle = C.rgba(C.dark(base, .5), .35); dir === 'v' ? c.fillRect(i * strip, 0, 1.5, h) : c.fillRect(0, i * strip, w, 1.5);
    }
    return T;
  }
  function softShadow(c, draw, blur = 30, dx = 14, dy = 22, a = .45) { c.save(); c.shadowColor = `rgba(10,6,3,${a})`; c.shadowBlur = blur; c.shadowOffsetX = dx; c.shadowOffsetY = dy; draw(); c.restore(); }
  function roundRect(c, x, y, w, h, r) { rr(c, x, y, w, h, r); }
  function buildStatic() {
    Q = COARSE ? 1 : 1.4;
    const S = mk(W * Q, H * Q), c = S.getContext('2d'); c.scale(Q, Q);
    // outer shadow of the room
    softShadow(c, () => { c.fillStyle = '#2d2723'; c.fillRect(0, 0, W, H); }, 80, 0, 30, .6);
    // floor
    const pat = c.createPattern(planks(), 'repeat'); c.fillStyle = pat; c.fillRect(50, 50, W - 100, H - 100);
    // rugs: braided round rug under the dining table, rag rug by the sink
    c.save(); c.translate(DINING.cx, DINING.cy);
    for (let i = 0; i < 26; i++) { const rad = 470 - i * 17; c.beginPath(); c.arc(0, 0, rad, 0, TAU); c.fillStyle = ['#c9b79c', '#b0896a', '#d8cbb2', '#8e6f57', '#c6a98a'][i % 5]; c.fill(); c.strokeStyle = 'rgba(60,40,25,.25)'; c.lineWidth = 2; c.stroke(); }
    c.restore();
    const rag = { x: 1880, y: 385, w: 640, h: 140 }, rr_ = mulberry(12);
    softShadow(c, () => { c.fillStyle = '#ddd'; c.fillRect(rag.x, rag.y, rag.w, rag.h); }, 10, 3, 5, .3);
    let yy = rag.y; const ragC = ['#c85a45', '#e8dcc6', '#5d7fa3', '#e6b451', '#e8dcc6', '#7aa06a', '#d98a7a', '#e8dcc6'];
    while (yy < rag.y + rag.h) { const hh = 6 + rr_() * 14; c.fillStyle = ragC[Math.floor(rr_() * ragC.length)]; c.fillRect(rag.x, yy, rag.w, Math.min(hh, rag.y + rag.h - yy)); for (let k = 0; k < 40; k++) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(rag.x + rr_() * rag.w, yy + rr_() * hh, 8, 1.5); } yy += hh; }
    c.fillStyle = '#e8dcc6'; for (let x = rag.x; x < rag.x + rag.w; x += 9) { c.fillRect(x, rag.y - 12, 3, 12); c.fillRect(x, rag.y + rag.h, 3, 12); }
    // walls
    c.fillStyle = '#2f2924'; c.fillRect(0, 0, W, 50); c.fillRect(0, H - 50, W, 50); c.fillRect(0, 0, 50, H); c.fillRect(W - 50, 0, 50, H);
    c.fillStyle = 'rgba(255,240,220,.06)'; c.fillRect(50, 50, W - 100, 3); c.fillRect(50, 50, 3, H - 100);
    // windows
    const win = (x, y, w, h) => { c.fillStyle = '#e9e3d6'; c.fillRect(x, y, w, h); c.fillStyle = '#b9d3dc'; c.fillRect(x + 6, y + 12, w - 12, h - 24); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 6, y + 12, w - 12, 5); c.fillStyle = '#e9e3d6'; if (w > h) c.fillRect(x + w / 2 - 4, y, 8, h); else c.fillRect(x, y + h / 2 - 4, w, 8); };
    win(1990, 0, 400, 50); win(0, 1260, 50, 400);
    // door
    c.fillStyle = pat; c.fillRect(2140, H - 50, 260, 50); c.fillStyle = '#8c6a4c'; c.fillRect(2140, H - 52, 260, 8);
    c.strokeStyle = 'rgba(40,30,22,.45)'; c.setLineDash([8, 8]); c.lineWidth = 2; c.beginPath(); c.arc(2400, H - 50, 260, Math.PI, Math.PI * 1.5); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#6e5440'; c.fillRect(2396, H - 310, 8, 260);
    // top counter with backsplash
    softShadow(c, () => { c.fillStyle = '#ddd'; c.fillRect(790, 50, 2160, 290); }, 26, 8, 16, .5);
    c.drawImage(terrazzo(2160, 290), 790, 50);
    c.fillStyle = '#f3efe7'; c.fillRect(790, 50, 2160, 18); c.strokeStyle = 'rgba(120,110,95,.35)'; c.lineWidth = 1; for (let x = 790; x < 2950; x += 36) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x, 68); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(790, 334, 2160, 6);
    // sink
    [[2010, 90, 170, 200], [2200, 90, 170, 200]].forEach(([x, y, w, h]) => { rr(c, x, y, w, h, 22); const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#8b9195'); g.addColorStop(1, '#c9cdcf'); c.fillStyle = g; c.fill(); rr(c, x + 10, y + 10, w - 20, h - 20, 16); c.fillStyle = '#b3b8bb'; c.fill(); c.beginPath(); c.arc(x + w / 2, y + h / 2 + 20, 12, 0, TAU); c.fillStyle = '#6d7275'; c.fill(); });
    c.lineCap = 'round'; c.strokeStyle = '#c7cbcd'; c.lineWidth = 14; c.beginPath(); c.moveTo(2190, 62); c.quadraticCurveTo(2190, 120, 2190, 150); c.stroke(); c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(2186, 66); c.lineTo(2186, 145); c.stroke();
    // espresso machine
    softShadow(c, () => { rr(c, 2440, 70, 170, 150, 14); c.fillStyle = '#2b2c2f'; c.fill(); }, 16, 5, 9, .5);
    rr(c, 2455, 85, 140, 60, 8); c.fillStyle = '#bfc3c6'; c.fill(); for (let i = 0; i < 5; i++) { c.fillStyle = '#8d9296'; c.fillRect(2465 + i * 26, 92, 14, 46); }
    [2480, 2525, 2570].forEach(x => { c.beginPath(); c.arc(x, 180, 12, 0, TAU); c.fillStyle = '#d9a257'; c.fill(); });
    // range
    softShadow(c, () => { c.fillStyle = '#222'; c.fillRect(90, 50, 700, 360); }, 26, 8, 16, .55);
    let g = c.createLinearGradient(90, 50, 790, 410); g.addColorStop(0, '#d7dadc'); g.addColorStop(.5, '#aeb3b6'); g.addColorStop(1, '#8e9397'); c.fillStyle = g; c.fillRect(90, 50, 700, 360);
    c.fillStyle = '#26282b'; c.fillRect(100, 60, 680, 318);
    for (let i = 0; i < 8; i++) { const x = 185 + (i % 4) * 170, y = i < 4 ? 150 : 320 - 8; c.strokeStyle = '#111214'; c.lineWidth = 9; c.strokeRect(x - 72, y - 72, 144, 144); c.beginPath(); c.moveTo(x - 72, y); c.lineTo(x + 72, y); c.moveTo(x, y - 72); c.lineTo(x, y + 72); c.stroke(); c.beginPath(); c.arc(x, y, 34, 0, TAU); c.strokeStyle = '#3a3c40'; c.lineWidth = 8; c.stroke(); }
    for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(130 + i * 88, 395, 11, 0, TAU); c.fillStyle = '#1a1b1d'; c.fill(); c.fillStyle = '#e8e8e8'; c.fillRect(129 + i * 88, 386, 2, 8); }
    // fridge
    softShadow(c, () => { rr(c, 50, 470, 200, 250, 10); c.fillStyle = '#eee'; c.fill(); }, 26, 10, 14, .55);
    rr(c, 50, 470, 200, 250, 10); g = c.createLinearGradient(50, 470, 250, 720); g.addColorStop(0, '#f1ede5'); g.addColorStop(1, '#d6d0c5'); c.fillStyle = g; c.fill();
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(242, 480, 6, 230);
    const herbPot = (x, y, s) => { c.beginPath(); c.arc(x, y, s, 0, TAU); c.fillStyle = '#b8643c'; c.fill(); c.beginPath(); c.arc(x, y, s * .82, 0, TAU); c.fillStyle = '#4a3322'; c.fill(); for (let i = 0; i < 9; i++) { c.save(); c.translate(x, y); c.rotate(i / 9 * TAU + .2); c.translate(s * .55, 0); c.scale(s * .9, s * .9); G.basil(c, mulberry(i), '#3f8a2d'); c.restore(); } };
    herbPot(150, 540, 34); herbPot(2890, 300, 30);
    // island: cabinets and butcher block
    softShadow(c, () => { c.fillStyle = '#ddd'; c.fillRect(420, 620, 1300, 440); }, 34, 12, 22, .55);
    c.drawImage(woodTop(1300, 440, '#c69a66', 'v', 52, 4), 420, 620);
    c.strokeStyle = 'rgba(70,40,15,.35)'; c.lineWidth = 3; c.strokeRect(421, 621, 1298, 438);
    // long table with benches
    [[TABLE.x + 30, TABLE.y - 70, TABLE.w - 60, 50], [TABLE.x + 30, TABLE.y + TABLE.h + 20, TABLE.w - 60, 50]].forEach(([x, y, w, h]) => { softShadow(c, () => { rr(c, x, y, w, h, 8); c.fillStyle = '#7a5a40'; c.fill(); }, 12, 5, 8, .4); c.drawImage(woodTop(w, h, '#7a5a40', 'h', 25, 7), x, y); });
    softShadow(c, () => { c.fillStyle = '#ddd'; c.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h); }, 38, 14, 26, .6);
    c.drawImage(woodTop(TABLE.w, TABLE.h, '#6a4a33', 'h', 115, 8), TABLE.x, TABLE.y);
    // dining table with chairs
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, x = DINING.cx + Math.cos(a) * 385, y = DINING.cy + Math.sin(a) * 385; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); softShadow(c, () => { rr(c, -58, -50, 116, 100, 18); c.fillStyle = '#b48a5c'; c.fill(); }, 12, 5, 8, .45); rr(c, -58, -50, 116, 100, 18); c.fillStyle = '#b8905f'; c.fill(); c.beginPath(); c.moveTo(-54, 50); c.quadraticCurveTo(0, 74, 54, 50); c.lineWidth = 14; c.strokeStyle = '#9a7349'; c.stroke(); c.restore(); }
    softShadow(c, () => { c.beginPath(); c.arc(DINING.cx, DINING.cy, DINING.r, 0, TAU); c.fillStyle = '#ddd'; c.fill(); }, 40, 14, 26, .6);
    c.save(); c.beginPath(); c.arc(DINING.cx, DINING.cy, DINING.r, 0, TAU); c.clip(); c.drawImage(woodTop(DINING.r * 2, DINING.r * 2, '#c8a274', 'h', 94, 11), DINING.cx - DINING.r, DINING.cy - DINING.r); c.restore();
    c.beginPath(); c.arc(DINING.cx, DINING.cy, DINING.r - 3, 0, TAU); c.lineWidth = 6; c.strokeStyle = 'rgba(90,60,30,.35)'; c.stroke();
    // cat corner
    c.save(); c.translate(2690, 1780); softShadow(c, () => { c.beginPath(); c.arc(0, 0, 110, 0, TAU); c.fillStyle = '#8a9aa8'; c.fill(); }, 16, 5, 9, .45);
    const bg = c.createRadialGradient(-20, -30, 20, 0, 0, 110); bg.addColorStop(0, '#9fb0bf'); bg.addColorStop(1, '#6a7b8a'); c.fillStyle = bg; c.beginPath(); c.arc(0, 0, 110, 0, TAU); c.fill();
    const cg = c.createRadialGradient(-10, -10, 10, 0, 0, 76); cg.addColorStop(0, '#e9e1d2'); cg.addColorStop(1, '#c9bda8'); c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 76, 0, TAU); c.fill(); c.restore();
    [[2455, 1860, '#7a5a3a'], [2550, 1872, '#9cc3d6']].forEach(([x, y, col], i) => { c.beginPath(); c.arc(x, y, 40, 0, TAU); c.fillStyle = '#a9aeb2'; c.fill(); c.beginPath(); c.arc(x, y, 30, 0, TAU); c.fillStyle = col; c.fill(); if (!i) { const r3 = mulberry(4); for (let k = 0; k < 26; k++) { c.beginPath(); c.arc(x + (r3() - .5) * 44, y + (r3() - .5) * 44, 4.5, 0, TAU); c.fillStyle = r3() < .5 ? '#5a3e24' : '#8a6038'; c.fill(); } } else { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - 8, y - 8, 12, 5, -.6, 0, TAU); c.fill(); } });
    // big plants
    const plant = (x, y, s, seed) => { c.save(); c.translate(x, y); softShadow(c, () => { c.beginPath(); c.arc(0, 0, s * .45, 0, TAU); c.fillStyle = '#c9b8a0'; c.fill(); }, 16, 6, 10, .45); c.beginPath(); c.arc(0, 0, s * .45, 0, TAU); c.fillStyle = '#d6c8b2'; c.fill(); const r4 = mulberry(seed); for (let i = 0; i < 11; i++) { c.save(); c.rotate(r4() * TAU); c.translate(s * (.3 + r4() * .35), 0); c.scale(s * .75, s * .75); softShadow(c, () => G.leaf(c, r4, i % 2 ? '#2f6b34' : '#3b7a3c', { w: .45 }), 10, 4, 6, .35); c.restore(); } c.restore(); };
    plant(150, 1880, 200, 3); plant(2880, 1560, 170, 8); plant(1830, 1880, 150, 5);
    // signs
    ZONES.forEach(z => {
      const [x, y] = z.sign, col = chap(z.n).color;
      c.font = '400 30px Caprasimo, Georgia, serif'; const w1 = c.measureText(z.name).width; c.font = '500 17px "Spline Sans Mono", monospace'; const w2 = c.measureText(z.sub.toUpperCase()).width; const w = Math.max(w1, w2) + 56;
      softShadow(c, () => { rr(c, x - w / 2, y - 38, w, 76, 38); c.fillStyle = '#efe9dd'; c.fill(); }, 12, 3, 6, .45);
      c.beginPath(); c.arc(x - w / 2 + 28, y - 8, 7, 0, TAU); c.fillStyle = col; c.fill();
      c.fillStyle = '#29241f'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = '400 30px Caprasimo, Georgia, serif'; c.fillText(z.name, x + 8, y + 2);
      c.font = '500 17px "Spline Sans Mono", monospace'; c.fillStyle = '#6f675d'; c.fillText(z.sub.toUpperCase(), x, y + 26);
    });
    STATIC = S;
    // light map
    const L = mk(W / 4, H / 4), l = L.getContext('2d'); l.scale(.25, .25);
    const pool = (x, y, r, a) => { const gg = l.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(255,214,150,${a})`); gg.addColorStop(1, 'rgba(255,214,150,0)'); l.fillStyle = gg; l.fillRect(x - r, y - r, r * 2, r * 2); };
    pool(830, 840, 520, .16); pool(1310, 840, 520, .16); pool(DINING.cx, DINING.cy, 620, .18); pool(2400, 905, 700, .1); pool(440, 230, 500, .08);
    l.fillStyle = 'rgba(235,245,255,.08)'; l.beginPath(); l.moveTo(1990, 50); l.lineTo(2390, 50); l.lineTo(2620, 700); l.lineTo(1960, 700); l.fill();
    l.beginPath(); l.moveTo(50, 1260); l.lineTo(50, 1660); l.lineTo(700, 1820); l.lineTo(700, 1380); l.fill();
    LIGHT = L;
  }

  /* ---------------- camera ---------------- */
  const cam = { x: W / 2, y: H / 2, s: .4 }; let tween = null, vw = 0, vh = 0;
  function fitScale() { return Math.min(vw / (W + 120), vh / (H + 160)); }
  // the resting view: whole room on wide screens; on narrow/portrait screens fill the height so dishes stay tappable and you pan sideways
  function homeScale() { const f = fitScale(); return vw < 900 && vh > vw * .9 ? Math.max(f, Math.min((vh - 150) / (H + 60), f * 3)) : f; }
  function resize() { const r = cv.getBoundingClientRect(); vw = r.width; vh = r.height; cv.width = Math.round(vw * DPR); cv.height = Math.round(vh * DPR); }
  const toWorld = (sx, sy) => [(sx - vw / 2) / cam.s + cam.x, (sy - vh / 2) / cam.s + cam.y];
  function clampCam() { const f = fitScale(); cam.s = clamp(cam.s, f * .85, 6); const mx = Math.max(0, (W * cam.s - vw) / 2 / cam.s) + 200, my = Math.max(0, (H * cam.s - vh) / 2 / cam.s) + 200; cam.x = clamp(cam.x, W / 2 - mx, W / 2 + mx); cam.y = clamp(cam.y, H / 2 - my, H / 2 + my); }
  function flyTo(x, y, s, dur = 950) { tween = { t0: performance.now(), dur: A.REDUCED ? 1 : dur, from: { ...cam }, to: { x, y, s } }; }
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function panelW() { return !panel.hidden && innerWidth >= 900 ? Math.min(430, innerWidth * .36) : 0; }

  /* ---------------- dishes ---------------- */
  const HIRES = {};
  function imgFor(d) { if (focus === d && HIRES[d.id]) return HIRES[d.id]; const im = A.THUMB_IMG[d.id]; return im && im.width ? im : null; }
  let hover = null, focus = null;

  /* ---------------- surfaces the cats (and dishes) can be on ---------------- */
  const SURF = {
    range: { kind: 'hot', rect: [90, 50, 700, 360], z: 92, name: 'spisen' },
    counter: { kind: 'top', rect: [790, 50, 1200, 290], z: 92, name: 'bänken' },
    sink: { kind: 'wet', rect: [1990, 50, 400, 290], z: 92, name: 'diskhon' },
    coffee: { kind: 'top', rect: [2390, 50, 560, 290], z: 92, name: 'kaffehörnan' },
    island: { kind: 'top', rect: [420, 620, 1300, 440], z: 92, name: 'köksön' },
    table: { kind: 'top', rect: [1900, 560, 1000, 690], z: 78, name: 'skafferibordet' },
    dining: { kind: 'top', circ: [760, 1480, 330], z: 78, name: 'matbordet' },
    fridge: { kind: 'top', rect: [50, 470, 200, 250], z: 175, name: 'kylskåpet' },
    bed: { kind: 'bed', circ: [2690, 1780, 105], z: 14, name: 'kattsängen' }
  };
  const inSurf = (s, x, y, m = 0) => s.rect ? (x > s.rect[0] + m && x < s.rect[0] + s.rect[2] - m && y > s.rect[1] + m && y < s.rect[1] + s.rect[3] - m) : Math.hypot(x - s.circ[0], y - s.circ[1]) < s.circ[2] - m;
  function surfAt(x, y) { for (const id in SURF) if (id !== 'bed' && inSurf(SURF[id], x, y)) return id; if (inSurf(SURF.bed, x, y)) return 'bed'; return 'floor'; }
  const heightAt = (x, y) => { const s = surfAt(x, y); return s === 'floor' ? 0 : SURF[s].z; };
  function randIn(sid, m = 70) { const s = SURF[sid]; for (let i = 0; i < 30; i++) { let x, y; if (s.rect) { x = s.rect[0] + m + rnd() * (s.rect[2] - 2 * m); y = s.rect[1] + m + rnd() * (s.rect[3] - 2 * m); } else { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (s.circ[2] - m); x = s.circ[0] + Math.cos(a) * d; y = s.circ[1] + Math.sin(a) * d; } if (inSurf(s, x, y, m * .6)) return [x, y]; } return s.rect ? [s.rect[0] + s.rect[2] / 2, s.rect[1] + s.rect[3] / 2] : [s.circ[0], s.circ[1]]; }
  function edgeOut(sid, x, y, out = 90) { // nearest floor point just outside a surface, from (x,y)
    const s = SURF[sid]; let px, py;
    if (s.circ) { const a = Math.atan2(y - s.circ[1], x - s.circ[0]); px = s.circ[0] + Math.cos(a) * (s.circ[2] + out); py = s.circ[1] + Math.sin(a) * (s.circ[2] + out); }
    else { const [rx, ry, rw, rh] = s.rect; const d = [[x - rx, -1, 0], [rx + rw - x, 1, 0], [y - ry, 0, -1], [ry + rh - y, 0, 1]].sort((a, b) => a[0] - b[0]); for (const [, dx, dy] of d) { px = dx ? (dx < 0 ? rx - out : rx + rw + out) : clamp(x, rx + 40, rx + rw - 40); py = dy ? (dy < 0 ? ry - out : ry + rh + out) : clamp(y, ry + 40, ry + rh - 40); if (!blocked(px, py, 40)) break; } }
    return [px, py];
  }
  DISH.forEach(d => { d.hx = d.x; d.hy = d.y; d.vx = d.vy = 0; d.surf = surfAt(d.x, d.y); d.home = d.surf; d.rot = 0; d.vr = 0; });

  /* ---------------- floor navigation ---------------- */
  function blocked(x, y, m = 60) { if (x < 50 + m || y < 50 + m || x > W - 50 - m || y > H - 50 - m) return true; return SOLID.some(s => x > s.x - m && x < s.x + s.w + m && y > s.y - m && y < s.y + s.h + m); }
  function clearPath(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 25); for (let i = 1; i <= n; i++) { const t = i / n; if (blocked(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 55)) return false; } return true; }
  function floorTarget(k, near) {
    for (let i = 0; i < 50; i++) { let x, y; if (near) { const a = rnd() * TAU, d = 60 + rnd() * near[2]; x = near[0] + Math.cos(a) * d; y = near[1] + Math.sin(a) * d; } else { x = 120 + rnd() * (W - 240); y = 420 + rnd() * (H - 520); } if (!blocked(x, y) && clearPath(k.x, k.y, x, y)) return [x, y]; }
    return [k.x, k.y];
  }

  /* ---------------- the cats ---------------- */
  const CATS = [
    { name: 'Svante', desc: 'svartvit och busig', L: 168, fluff: 0, x: 1320, y: 1300, pers: { speed: 1.3, mischief: .95, lazy: .15, curious: .5, cuddly: .3, laser: 1 },
      coat: { pattern: 'tuxedo', base: '#1f1f24', dark: '#0d0d10', light: '#45454e', white: '#f4f1eb', eye: '#e2c24a' } },
    { name: 'Tage', desc: 'röd ragdoll, gillar att ligga', L: 196, fluff: 1, x: 900, y: 1250, pers: { speed: .72, mischief: .2, lazy: .95, curious: .3, cuddly: .85, laser: .15 },
      coat: { pattern: 'point', base: '#f3e2c9', point: '#d77d3a', dark: '#b5612a', light: '#fdf5e8', white: '#fdf7ee', eye: '#6aa7e0' } },
    { name: 'Loki', desc: 'ragdoll, nyfiken och kelig', L: 186, fluff: 1, x: 2600, y: 1560, limp: 1, pers: { speed: 1, mischief: .35, lazy: .45, curious: .95, cuddly: .95, laser: .6 },
      coat: { pattern: 'point', base: '#efe5d6', point: '#5a4434', dark: '#3d2e23', light: '#fbf6ee', white: '#fffdf8', eye: '#4f95d9', mitts: 1 } }
  ];
  CATS.forEach((k, i) => Object.assign(k, { z: 0, surf: 'floor', h: rnd() * TAU, mode: 'sit', t: 1 + i, tx: k.x, ty: k.y, v: 0, gait: 0, bubble: null, seed: i + 1, vx: 0, vy: 0, vz: 0, spin: 0, follow: 0, heart: 0 }));
  CATS[1].mode = 'sleep'; CATS[1].t = 18;
  let laser = null, laserOn = false, treat = null, treatMode = false, pointerW = null, pointerT = 0;
  const hearts = [], drops = [];
  function say(k, text, t = 1.8) { k.bubble = { text, t, t0: t }; }
  function go(k, x, y, fast) { k.mode = 'walk'; k.tx = x; k.ty = y; k.fast = fast; }
  function pickOnSurface(k) {
    const p = k.pers, s = SURF[k.surf];
    if (k.surf === 'bed') { k.mode = 'sleep'; k.t = 15 + rnd() * 20; return; }
    const dishes = DISH.filter(d => d.surf === k.surf && !d.fall);
    if (rnd() < .22 + (1 - p.lazy) * .2) { jumpDown(k); return; }
    if (k.name === 'Svante' && dishes.length && rnd() < .55) { // take aim at something near the edge
      const d = dishes[Math.floor(rnd() * dishes.length)]; const [ox, oy] = edgeOut(k.surf, d.x, d.y, 0); const ax = d.x - ox, ay = d.y - oy, al = Math.hypot(ax, ay) || 1;
      k.mode = 'eye'; k.t = 1.3; k.aim = { d, x: d.x + ax / al * 70, y: d.y + ay / al * 70, ex: ox - ax / al * 40, ey: oy - ay / al * 40 }; say(k, '…', 1.2); return;
    }
    if (k.name === 'Tage' && rnd() < .7) { k.mode = 'loaf'; k.t = 10 + rnd() * 16; return; }
    if (k.name === 'Loki' && dishes.length && rnd() < .6) { const d = dishes[Math.floor(rnd() * dishes.length)]; go(k, d.x + (rnd() - .5) * 60, d.y + d.s * .45); k.goal = 'sniff'; k.sn = d; return; }
    const [x, y] = randIn(k.surf); go(k, x, y);
  }
  function jumpTo(k, x, y, z, then) { k.mode = 'jump'; k.j = { x0: k.x, y0: k.y, z0: k.z, x1: x, y1: y, z1: z, t: 0, dur: .55, then }; k.h = Math.atan2(y - k.y, x - k.x); }
  function jumpDown(k) { const [x, y] = edgeOut(k.surf, k.x, k.y, 80); jumpTo(k, x, y, 0, () => { k.surf = 'floor'; }); }
  function jumpUp(k, sid) {
    const s = SURF[sid], tgt = randIn(sid, 80); const [fx, fy] = edgeOut(sid, tgt[0], tgt[1], 75);
    if (blocked(fx, fy, 30) || !clearPath(k.x, k.y, fx, fy)) { go(k, ...floorTarget(k)); return; }
    go(k, fx, fy); k.goal = 'jump'; k.jumpTo = { sid, x: tgt[0], y: tgt[1] };
  }
  function nextBehaviour(k) {
    k.goal = null; const p = k.pers;
    if (k.surf !== 'floor') { pickOnSurface(k); return; }
    if (k.follow > 0 && pointerW) { go(k, ...floorTarget(k, [pointerW[0], pointerW[1], 120])); k.goal = 'lookup'; return; }
    const r = rnd();
    if (r < p.lazy * .3) { if (k.name === 'Tage' && rnd() < .5) jumpUp(k, 'dining'); else { go(k, ...(Math.hypot(k.x - 2690, k.y - 1780) < 900 && rnd() < .6 ? [2690, 1780] : floorTarget(k))); k.goal = 'nap'; } return; }
    if (r < p.lazy * .3 + p.mischief * .3) { const opts = ['island', 'counter', 'table', 'dining', 'coffee', 'fridge']; jumpUp(k, opts[Math.floor(rnd() * opts.length)]); return; }
    if (k.name === 'Svante' && r < .62) { k.zoom = 3; go(k, ...floorTarget(k), true); return; }
    if (r < .7 && p.curious > .6) { const opts = ['island', 'table', 'dining', 'counter']; const sid = opts[Math.floor(rnd() * opts.length)]; const tgt = randIn(sid, 90); const [x, y] = edgeOut(sid, tgt[0], tgt[1], 70); if (!blocked(x, y, 30) && clearPath(k.x, k.y, x, y)) { go(k, x, y); k.goal = 'beg'; k.faceTo = tgt; return; } }
    if (r < .8) { k.mode = 'groom'; k.t = 2.5 + rnd() * 3; return; }
    if (r < .9) { k.mode = 'sit'; k.t = 2 + rnd() * 4; return; }
    go(k, ...floorTarget(k));
  }
  function arrive(k) {
    k.v = 0;
    if (k.goal === 'knockprep') { k.goal = null; k.mode = 'knock'; k.tx = k.aim.ex; k.ty = k.aim.ey; k.h = Math.atan2(k.ty - k.y, k.tx - k.x); return; }
    if (k.goal === 'nap') { if (Math.hypot(k.x - 2690, k.y - 1780) < 40) { k.surf = 'bed'; k.z = SURF.bed.z; } k.mode = 'sleep'; k.t = 14 + rnd() * 22 * k.pers.lazy; k.goal = null; return; }
    if (k.goal === 'jump') { const j = k.jumpTo; jumpTo(k, j.x, j.y, SURF[j.sid].z, () => { k.surf = j.sid; landReact(k, false); }); k.goal = null; return; }
    if (k.goal === 'beg') { k.mode = 'beg'; k.t = 3 + rnd() * 2; k.h = Math.atan2(k.faceTo[1] - k.y, k.faceTo[0] - k.x); const d = nearestDish(k.faceTo[0], k.faceTo[1]); k.bubble = { dish: d, t: 3.4, t0: 3.4 }; k.goal = null; return; }
    if (k.goal === 'sniff') { k.mode = 'sniff'; k.t = 2.4; if (k.sn) { k.h = Math.atan2(k.sn.y - k.y, k.sn.x - k.x); k.bubble = { dish: k.sn, t: 2.6, t0: 2.6 }; } k.goal = null; return; }
    if (k.goal === 'lookup') { k.mode = 'look'; k.t = 2 + rnd() * 2; k.goal = null; return; }
    if (k.goal === 'treat') { if (treat && Math.hypot(treat.x - k.x, treat.y - k.y) < 60) { k.mode = 'eat'; k.t = 2.2; say(k, 'Nom nom', 2); treat = null; CATS.forEach(o => { if (o !== k && o.goal === 'treat') { o.goal = null; o.mode = 'sit'; o.t = 2; say(o, '…', 1.5); } }); } else { k.goal = null; nextBehaviour(k); } return; }
    if (k.zoom > 0) { k.zoom--; if (k.zoom) { go(k, ...floorTarget(k), true); return; } }
    nextBehaviour(k);
  }
  function nearestDish(x, y) { let b = null, bd = 1e9; DISH.forEach(d => { const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; b = d; } }); return b; }
  function landReact(k, thrown) {
    const s = k.surf === 'floor' ? null : SURF[k.surf];
    // landing shoves nearby dishes
    DISH.forEach(d => { if (d.surf !== k.surf || d.fall) return; const dx = d.x - k.x, dy = d.y - k.y, dist = Math.hypot(dx, dy); if (dist < k.L * .8) { const f = (1 - dist / (k.L * .8)) * (thrown ? 520 : 200); d.vx += dx / (dist || 1) * f; d.vy += dy / (dist || 1) * f; d.vr += (rnd() - .5) * 3; d.pusher = k; } });
    if (s && s.kind === 'hot') { say(k, 'Aj! Varmt!', 1.6); A.SND.meow && A.SND.meow(1.4); setTimeout(() => jumpDown(k), 350); k.mode = 'sit'; k.t = 5; return; }
    if (s && s.kind === 'wet') { say(k, 'Plask!', 1.6); for (let i = 0; i < 24; i++) drops.push({ x: k.x, y: k.y, vx: (rnd() - .5) * 420, vy: (rnd() - .5) * 420, t: 0 }); k.mode = 'shake'; k.t = 1.3; k.after = () => jumpDown(k); return; }
    if (s && s.kind === 'bed') { k.mode = 'sleep'; k.t = 18 + rnd() * 20; return; }
    if (thrown) {
      if (k.limp) { k.mode = 'flop'; k.t = 2.4; say(k, 'Prrr', 1.6); return; }
      k.mode = 'shake'; k.t = .8; say(k, k.name === 'Svante' ? 'Mjau!!' : 'Mrrp?', 1.4); A.SND.meow && A.SND.meow(k.name === 'Svante' ? 1.2 : .9); return;
    }
    k.mode = 'sit'; k.t = .6 + rnd();
  }
  function updateCat(k, dt, t) {
    if (k.bubble) { k.bubble.t -= dt; if (k.bubble.t <= 0) k.bubble = null; }
    if (k.follow > 0) k.follow -= dt;
    if (k.mode === 'held') return;
    if (k.mode === 'air') {
      k.x += k.vx * dt; k.y += k.vy * dt; k.vz -= 1700 * dt; k.z += k.vz * dt; k.spin += k.vs * dt;
      if (k.x < 90 || k.x > W - 90) { k.vx *= -.45; k.x = clamp(k.x, 90, W - 90); }
      if (k.y < 90 || k.y > H - 90) { k.vy *= -.45; k.y = clamp(k.y, 90, H - 90); }
      const hz = heightAt(k.x, k.y);
      if (k.z <= hz && k.vz < 0) { k.z = hz; k.surf = surfAt(k.x, k.y); if (k.surf === 'floor' && blocked(k.x, k.y, 20)) { const [x, y] = floorTarget(k, [k.x, k.y, 160]); k.x = x; k.y = y; } k.h += k.spin; k.spin = 0; landReact(k, true); }
      return;
    }
    if (k.mode === 'jump') {
      const j = k.j; j.t += dt / j.dur; const p = Math.min(1, j.t);
      k.x = j.x0 + (j.x1 - j.x0) * p; k.y = j.y0 + (j.y1 - j.y0) * p; k.z = j.z0 + (j.z1 - j.z0) * p + Math.sin(p * Math.PI) * 110;
      if (p >= 1) { k.z = j.z1; k.mode = 'sit'; k.t = .5 + rnd() * 1.2; j.then && j.then(); }
      return;
    }
    // laser & treats pull cats around
    if (laserOn && laser && k.mode !== 'eat' && rnd() < k.pers.laser * dt * 3 && k.mode !== 'chase') { k.mode = 'chase'; k.goal = null; }
    if (k.mode === 'chase') {
      if (!laserOn || !laser) { k.mode = 'sit'; k.t = 1.5; say(k, '?', 1.2); return; }
      const lz = heightAt(laser[0], laser[1]);
      if (k.surf === 'floor' && lz > 0) { if (k.pers.laser > .8 && rnd() < dt) { const sid = surfAt(laser[0], laser[1]); if (sid !== 'floor') jumpUp(k, sid); } else k.h = Math.atan2(laser[1] - k.y, laser[0] - k.x); return; }
      if (k.surf !== 'floor' && surfAt(laser[0], laser[1]) !== k.surf) { if (rnd() < dt * 2) jumpDown(k); return; }
      const dx = laser[0] - k.x, dy = laser[1] - k.y, d = Math.hypot(dx, dy);
      const want = Math.atan2(dy, dx); let da = ((want - k.h + Math.PI * 3) % TAU) - Math.PI; k.h += clamp(da, -6 * dt, 6 * dt);
      if (d > 40) { const sp = 300 * k.pers.speed * (k.pers.laser < .3 ? .4 : 1); const nx = k.x + Math.cos(k.h) * sp * dt, ny = k.y + Math.sin(k.h) * sp * dt; if (k.surf === 'floor' ? !blocked(nx, ny, 50) : inSurf(SURF[k.surf], nx, ny, 40)) { k.x = nx; k.y = ny; } k.v = sp; k.gait += sp * dt / 22; pushDishes(k, dt); }
      else { k.v = 0; if (rnd() < dt * 1.5) { k.pounce = .35; } }
      if (k.pounce > 0) { k.pounce -= dt; k.z = (k.surf === 'floor' ? 0 : SURF[k.surf].z) + Math.sin((.35 - k.pounce) / .35 * Math.PI) * 40; }
      return;
    }
    if (treat && k.goal !== 'treat' && k.mode !== 'eat' && k.mode !== 'jump') { if (k.surf !== 'floor') jumpDown(k); else { go(k, treat.x, treat.y, k.pers.speed > .9); k.goal = 'treat'; } return; }
    if (k.mode === 'walk' || k.mode === 'knock') {
      const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
      if (d < 14) { if (k.mode === 'knock') { k.mode = 'sit'; k.t = 1.2; k.h += Math.PI; say(k, 'Oj.', 1.2); return; } arrive(k); return; }
      const want = Math.atan2(dy, dx); let da = ((want - k.h + Math.PI * 3) % TAU) - Math.PI; k.h += clamp(da, -3.4 * dt, 3.4 * dt);
      const sp = (k.fast ? 240 : k.mode === 'knock' ? 55 : 88) * k.pers.speed * (Math.abs(da) > 1 ? .35 : 1); k.v = sp;
      const nx = k.x + Math.cos(k.h) * sp * dt, ny = k.y + Math.sin(k.h) * sp * dt;
      if (k.surf === 'floor' || inSurf(SURF[k.surf], nx, ny, 30)) { k.x = nx; k.y = ny; } else { arrive(k); return; }
      k.gait += sp * dt / 24; pushDishes(k, dt);
      return;
    }
    if (k.mode === 'eye') { k.t -= dt; k.h = Math.atan2(k.aim.d.y - k.y, k.aim.d.x - k.x); if (k.t <= 0) { const a = k.aim; if (a.d.surf === k.surf && inSurf(SURF[k.surf], a.x, a.y, 25)) { go(k, a.x, a.y); k.goal = 'knockprep'; } else nextBehaviour(k); } return; }
    k.t -= dt;
    if (k.t <= 0) { const f = k.after; k.after = null; if (f) f(); else nextBehaviour(k); }
  }
  function pushDishes(k, dt) {
    DISH.forEach(d => {
      if (d.fall || d.back || d.surf !== k.surf) return;
      const dx = d.x - k.x, dy = d.y - k.y, dist = Math.hypot(dx, dy), R = d.s * .33 + k.L * .26;
      if (dist < R) { const f = (R - dist) * 9 + k.v * .9; d.vx += (dx / (dist || 1) * .6 + Math.cos(k.h) * .7) * f * dt * 8; d.vy += (dy / (dist || 1) * .6 + Math.sin(k.h) * .7) * f * dt * 8; d.vr += (rnd() - .5) * dt * 8; d.pusher = k; }
    });
  }
  const toast = document.getElementById('kToast'); let toastT = 0;
  function showToast(msg) { toast.innerHTML = msg; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 4200); }
  function updateDishes(dt) {
    let moved = 0;
    DISH.forEach(d => {
      if (d.fall) { d.fall.t += dt / .5; if (d.fall.t >= 1) { d.x = d.fall.x1; d.y = d.fall.y1; d.surf = 'floor'; const who = d.fall.who; d.fall = null; A.SND.plop && A.SND.plop(.2); showToast(`<b>${who ? who.name : 'Någon'}</b> knuffade ner <b>${A.esc(A.R[d.id].title)}</b> på golvet.`); } else { const p = d.fall.t; d.x = d.fall.x0 + (d.fall.x1 - d.fall.x0) * p; d.y = d.fall.y0 + (d.fall.y1 - d.fall.y0) * p; d.rot += dt * 4; } moved++; return; }
      if (d.back) { d.back.t += dt / .8; const p = easeIO(Math.min(1, d.back.t)); d.x = d.back.x0 + (d.hx - d.back.x0) * p; d.y = d.back.y0 + (d.hy - d.back.y0) * p; d.rot = d.back.r0 * (1 - p); if (d.back.t >= 1) { d.back = null; d.surf = d.home; d.x = d.hx; d.y = d.hy; d.rot = 0; } return; }
      if (Math.abs(d.vx) + Math.abs(d.vy) > 1) {
        d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; const fr = Math.exp(-5 * dt); d.vx *= fr; d.vy *= fr; d.vr *= fr;
        if (d.surf === 'floor') { d.x = clamp(d.x, 120, W - 120); d.y = clamp(d.y, 120, H - 120); }
        else if (!inSurf(SURF[d.surf], d.x, d.y, -d.s * .12)) { const [x1, y1] = edgeOut(d.surf, d.x, d.y, d.s * .55); d.fall = { t: 0, x0: d.x, y0: d.y, x1, y1, who: d.pusher }; d.vx = d.vy = 0; }
      } else { d.vx = d.vy = 0; }
      if (Math.hypot(d.x - d.hx, d.y - d.hy) > 8 || d.surf !== d.home) moved++;
    });
    return moved;
  }
  function tidy() { DISH.forEach(d => { if (Math.hypot(d.x - d.hx, d.y - d.hy) > 2 || d.surf !== d.home || d.rot) { d.vx = d.vy = d.vr = 0; d.fall = null; d.back = { t: 0, x0: d.x, y0: d.y, r0: d.rot }; } }); A.SND.tada && A.SND.tada(); }

  /* ---------------- drawing the cats ---------------- */
  function furPath(c, rx, ry, fluff, seed, n = 96) {
    c.beginPath();
    for (let i = 0; i <= n; i++) { const a = i / n * TAU, j = fluff ? 1 + .028 * Math.sin(a * 13 + seed) + .016 * Math.sin(a * 31 + seed * 2) : 1; const x = Math.cos(a) * rx * j, y = Math.sin(a) * ry * j; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
  }
  function furFill(c, style, fluff, col) { c.save(); c.fillStyle = style; if (fluff) { c.shadowColor = col; c.shadowBlur = Math.abs(c.getTransform().a) * .035; } c.fill(); c.restore(); }
  function coatFill(c, co, x0, x1, r) { // points darken towards head (x1) and tail (x0) on ragdolls
    if (co.pattern === 'point') { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, co.point); g.addColorStop(.28, co.base); g.addColorStop(.7, co.light); g.addColorStop(1, co.base); return g; }
    const g = c.createRadialGradient(-.05, -.05, .02, 0, 0, r); g.addColorStop(0, co.light); g.addColorStop(.6, co.base); g.addColorStop(1, co.dark); return g;
  }
  function ear(c, co, x, y, rot, s = 1) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = co.pattern === 'point' ? co.point : co.base; c.beginPath(); c.moveTo(-.055, .02); c.lineTo(0, -.09); c.lineTo(.055, .02); c.closePath(); c.fill(); c.fillStyle = co.pattern === 'point' ? '#e9b7a8' : '#d99a94'; c.beginPath(); c.moveTo(-.028, .01); c.lineTo(0, -.055); c.lineTo(.028, .01); c.closePath(); c.fill(); c.restore(); }
  function headTop(c, co, fluff) {
    ear(c, co, -.03, -.125, -1.9, fluff ? 1.1 : 1); ear(c, co, -.03, .125, 1.9 - Math.PI, fluff ? 1.1 : 1);
    if (fluff) { furPath(c, .165, .17, 1, 3); furFill(c, co.light, 1, co.light); }
    const g = c.createRadialGradient(-.06, 0, .02, 0, 0, .17);
    if (co.pattern === 'point') { g.addColorStop(0, C.mix(co.base, co.point, .2)); g.addColorStop(.75, C.mix(co.base, co.point, .5)); g.addColorStop(1, C.mix(co.base, co.point, .7)); } else { g.addColorStop(0, co.light); g.addColorStop(.7, co.base); g.addColorStop(1, co.dark); }
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, .15, .14, 0, 0, TAU); c.fill();
    if (co.pattern === 'point') { const m = c.createRadialGradient(.14, 0, .01, .1, 0, .12); m.addColorStop(0, co.dark); m.addColorStop(1, C.rgba(co.point, 0)); c.fillStyle = m; c.beginPath(); c.ellipse(.07, 0, .1, .11, 0, 0, TAU); c.fill(); }
    if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.moveTo(.16, -.035); c.quadraticCurveTo(.02, -.015, -.05, 0); c.quadraticCurveTo(.02, .015, .16, .035); c.closePath(); c.fill(); c.beginPath(); c.ellipse(.12, 0, .045, .055, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#e28a86'; c.beginPath(); c.arc(.165, 0, .014, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = .006; [[.14, .05, .31, .14], [.14, .05, .31, .07], [.14, -.05, .31, -.14], [.14, -.05, .31, -.07]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(cc, d); c.stroke(); });
  }
  function face(c, co, t, happy) {
    const blink = happy ? 0 : (t % 3.6) < .12 ? .15 : 1;
    [[-.105, -.13, -.35], [.105, -.13, .35]].forEach(([x, y, r]) => { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = co.pattern === 'point' ? co.point : co.base; c.beginPath(); c.moveTo(-.075, .05); c.lineTo(0, -.11); c.lineTo(.075, .05); c.closePath(); c.fill(); c.fillStyle = '#eab1a8'; c.beginPath(); c.moveTo(-.035, .03); c.lineTo(0, -.065); c.lineTo(.035, .03); c.closePath(); c.fill(); c.restore(); });
    if (co.pattern === 'point') { furPath(c, .215, .195, 1, 5); furFill(c, co.light, 1, co.light); }
    const g = c.createRadialGradient(-.04, -.05, .01, 0, 0, .2);
    if (co.pattern === 'point') { g.addColorStop(0, co.base); g.addColorStop(1, C.mix(co.base, co.point, .35)); } else { g.addColorStop(0, co.light); g.addColorStop(.6, co.base); g.addColorStop(1, co.dark); }
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, .19, .17, 0, 0, TAU); c.fill();
    if (co.pattern === 'point') { const m = c.createRadialGradient(0, .04, .01, 0, .03, .15); m.addColorStop(0, co.point); m.addColorStop(.7, C.rgba(co.point, .7)); m.addColorStop(1, C.rgba(co.point, 0)); c.fillStyle = m; c.beginPath(); c.ellipse(0, .02, .15, .13, 0, 0, TAU); c.fill(); }
    if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.moveTo(-.03, -.17); c.lineTo(.03, -.17); c.quadraticCurveTo(.1, .06, .08, .12); c.quadraticCurveTo(0, .17, -.08, .12); c.quadraticCurveTo(-.1, .06, -.03, -.17); c.fill(); }
    [-.068, .068].forEach(x => {
      if (!blink) { c.strokeStyle = '#2a1e18'; c.lineWidth = .012; c.beginPath(); c.arc(x, -.02, .03, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
      c.fillStyle = co.eye; c.beginPath(); c.ellipse(x, -.02, .04, .044 * blink, 0, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.ellipse(x, -.02, .017, .038 * blink, 0, 0, TAU); c.fill();
      if (blink > .5) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x - .013, -.036, .01, 0, TAU); c.fill(); }
    });
    c.fillStyle = '#e07c7a'; c.beginPath(); c.moveTo(-.02, .042); c.lineTo(.02, .042); c.lineTo(0, .064); c.closePath(); c.fill();
    c.strokeStyle = '#3a2a22'; c.lineWidth = .008; c.beginPath(); c.moveTo(0, .064); c.quadraticCurveTo(-.02, .092, -.042, .082); c.moveTo(0, .064); c.quadraticCurveTo(.02, .092, .042, .082); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .005; [[.06, .06, .24, .03], [.06, .07, .24, .1], [-.06, .06, -.24, .03], [-.06, .07, -.24, .1]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(cc, d); c.stroke(); });
    if (happy) { c.fillStyle = 'rgba(240,140,140,.45)'; c.beginPath(); c.ellipse(-.11, .05, .03, .018, 0, 0, TAU); c.ellipse(.11, .05, .03, .018, 0, 0, TAU); c.fill(); }
  }
  function tail(c, co, x0, sway, len = 1, up = 0, fluff = 0) {
    c.lineCap = 'round';
    const p = () => { c.beginPath(); c.moveTo(x0, 0); c.bezierCurveTo(x0 - .2 * len, sway * .12, x0 - .36 * len, sway * .22 + up, x0 - .52 * len, sway * .12 + up * 1.5); };
    if (fluff) { p(); c.lineWidth = .14; c.strokeStyle = C.rgba(co.pattern === 'point' ? co.point : co.base, .55); c.stroke(); }
    p(); c.lineWidth = fluff ? .1 : .075; c.strokeStyle = co.pattern === 'point' ? co.point : co.base; c.stroke();
    if (co.pattern === 'tuxedo') { c.lineWidth = .06; c.strokeStyle = co.dark; c.beginPath(); c.moveTo(x0 - .44 * len, sway * .17 + up * 1.2); c.lineTo(x0 - .52 * len, sway * .12 + up * 1.5); c.stroke(); }
  }
  function paw(c, co, x, y, rx = .065, ry = .045) { c.fillStyle = co.pattern === 'tuxedo' || co.mitts ? co.white : co.point || co.base; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
  function drawCat(c, k, t) {
    const co = k.coat, L = k.L * (1 + k.z / 900), m = k.mode;
    // shadow on the ground/surface under the cat
    const base = k.surf === 'floor' || m === 'air' || m === 'held' ? heightAt(k.x, k.y) : SURF[k.surf] ? SURF[k.surf].z : 0, lift = Math.max(0, k.z - base);
    c.save(); c.globalAlpha = clamp(.32 - lift / 900, .08, .32); c.fillStyle = '#140c06'; c.beginPath(); c.ellipse(k.x + 6 + lift * .35, k.y + 10 + lift * .5, L * (m === 'sleep' || m === 'loaf' ? .36 : .5) * (1 + lift / 700), L * .3 * (1 + lift / 700), k.h, 0, TAU); c.fill(); c.restore();
    c.save(); c.translate(k.x, k.y);
    const sw = Math.sin(t * (m === 'walk' || m === 'chase' ? 2.6 : 1.2) + k.seed * 3);
    if (m === 'sleep' || m === 'loaf') {
      const br = 1 + Math.sin(t * 1.5 + k.seed) * .025; c.rotate(k.h); c.scale(L * br, L * br);
      if (m === 'loaf') { furPath(c, .3, .21, k.fluff, k.seed); furFill(c, coatFill(c, co, -.3, .3, .3), k.fluff, co.base); tail(c, co, -.2, .6, .5, .12, k.fluff); c.save(); c.translate(.26, 0); headTop(c, co, k.fluff); c.restore(); c.restore(); return; }
      c.lineCap = 'round'; c.strokeStyle = co.pattern === 'point' ? co.point : co.base; c.lineWidth = k.fluff ? .12 : .09; c.beginPath(); c.arc(0, 0, .29, .4, 2.9); c.stroke();
      const g = c.createRadialGradient(-.08, -.08, .02, 0, 0, .31); g.addColorStop(0, co.light); g.addColorStop(.6, co.base); g.addColorStop(1, co.pattern === 'point' ? co.base : co.dark); furPath(c, .28, .27, k.fluff, k.seed); furFill(c, g, k.fluff, co.base);
      if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.ellipse(.05, .12, .1, .06, .4, 0, TAU); c.fill(); }
      c.save(); c.translate(.14, -.12); c.fillStyle = co.pattern === 'point' ? C.mix(co.base, co.point, .6) : co.base; c.beginPath(); c.arc(0, 0, .13, 0, TAU); c.fill(); ear(c, co, -.06, -.09, -.9); ear(c, co, .08, -.08, .2);
      c.strokeStyle = co.pattern === 'tuxedo' ? '#666' : '#3a2a20'; c.lineWidth = .012; c.beginPath(); c.arc(-.03, .02, .03, .2, 2.8); c.stroke(); c.beginPath(); c.arc(.05, .03, .03, .2, 2.8); c.stroke(); c.restore();
      c.restore();
      if (m === 'sleep') { c.save(); c.fillStyle = '#efe9dd'; for (let i = 0; i < 3; i++) { const p = ((t * .35 + i / 3) % 1); c.globalAlpha = Math.sin(p * Math.PI) * .8; c.font = `400 ${18 + p * 16}px Caprasimo, Georgia, serif`; c.fillText('z', k.x + 40 + p * 50 + Math.sin(p * 6) * 8, k.y - 40 - p * 90); } c.restore(); }
      return;
    }
    if (m === 'belly' || m === 'flop') { // on its back, paws in the air
      c.rotate(k.h); c.scale(L, L); const wig = Math.sin(t * 6) * .03;
      tail(c, co, -.3, sw, .7, 0, k.fluff);
      [[.2, .19], [.2, -.19], [-.18, .17], [-.18, -.17]].forEach(([x, y], i) => paw(c, co, x + (i % 2 ? wig : -wig), y * 1.05, .07, .05));
      const g = c.createLinearGradient(-.4, 0, .4, 0); g.addColorStop(0, co.pattern === 'point' ? co.point : co.base); g.addColorStop(.25, co.white); g.addColorStop(.8, co.white); g.addColorStop(1, co.pattern === 'point' ? co.point : co.base);
      furPath(c, .4, .2, k.fluff, k.seed); furFill(c, g, k.fluff, co.base);
      c.save(); c.translate(.44, 0); c.rotate(Math.PI / 2 + Math.sin(t * 1.5) * .2); c.scale(.85, .85); face(c, co, t, true); c.restore();
      c.restore(); return;
    }
    if (m === 'held' || m === 'air') {
      c.rotate(k.h + (m === 'air' ? k.spin : Math.sin(t * 2) * .15)); c.scale(L, L);
      const flail = k.limp ? 0 : Math.sin(t * 18) * .07;
      if (k.limp && m === 'held') { tail(c, co, -.36, Math.sin(t * 2) * .4, .8, .1, k.fluff); [[.2, .14], [.2, -.14], [-.2, .13], [-.2, -.13]].forEach(([x, y]) => paw(c, co, x, y)); }
      else { tail(c, co, -.36, Math.sin(t * 9) * 1.2, 1, -.05, k.fluff); [[.3, .3, 1], [.3, -.3, -1], [-.28, .28, -1], [-.28, -.28, 1]].forEach(([x, y, sg]) => { c.strokeStyle = co.pattern === 'point' ? co.point : co.base; c.lineWidth = .08; c.lineCap = 'round'; c.beginPath(); c.moveTo(x * .5, y * .5); c.lineTo(x + flail * sg, y - flail * sg); c.stroke(); paw(c, co, x + flail * sg, y - flail * sg, .055, .055); }); }
      furPath(c, .42, k.limp && m === 'held' ? .23 : .2, k.fluff, k.seed); furFill(c, coatFill(c, co, -.42, .42, .45), k.fluff, co.base);
      if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.ellipse(.26, 0, .1, .1, 0, 0, TAU); c.fill(); }
      c.save(); c.translate(.46, 0); c.rotate(Math.PI / 2); c.scale(.9, .9); face(c, co, t, k.limp && m === 'held'); c.restore();
      c.restore(); return;
    }
    const sitting = !(m === 'walk' || m === 'chase' || m === 'knock');
    c.rotate(k.h); c.scale(L, L);
    if (!sitting) {
      tail(c, co, -.38, sw, 1, m === 'chase' ? -.1 : 0, k.fluff);
      const ph = k.gait; [[.24, .15, 0], [.24, -.15, Math.PI], [-.22, .15, Math.PI], [-.22, -.15, 0]].forEach(([x, y, o]) => paw(c, co, x + Math.sin(ph + o) * (k.v > 0 ? .09 : 0), y * 1.2));
      furPath(c, .42, k.fluff ? .2 : .185, k.fluff, k.seed); furFill(c, coatFill(c, co, -.42, .42, .45), k.fluff, co.base);
      if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.ellipse(.3, 0, .08, .1, 0, 0, TAU); c.fill(); }
      c.save(); c.translate(.47 + Math.sin(k.gait * 2) * .01, 0); headTop(c, co, k.fluff); c.restore();
    } else {
      tail(c, co, -.2, sw * .5, .75, .36, k.fluff);
      c.save(); c.translate(-.06, 0); furPath(c, .28, .22, k.fluff, k.seed); furFill(c, coatFill(c, co, -.26, .28, .32), k.fluff, co.base); c.restore();
      [.07, -.07].forEach(y => paw(c, co, .21, y, .06, .038));
      if (co.pattern === 'tuxedo') { c.fillStyle = co.white; c.beginPath(); c.ellipse(.13, 0, .08, .09, 0, 0, TAU); c.fill(); }
      if (m === 'look' || m === 'shake' || m === 'eat') { c.save(); c.translate(.15, 0); c.rotate(-k.h); if (m === 'shake') c.rotate(Math.sin(t * 40) * .25); face(c, co, t, m === 'eat'); c.restore(); }
      else { let hx = .17, hy = 0; if (m === 'groom') { hy = Math.sin(t * 5) * .05; hx = .14 + Math.max(0, Math.sin(t * 5)) * .03; } if (m === 'sniff' || m === 'beg') { hx = .23 + Math.sin(t * 7) * .012; } if (m === 'eye') hx = .2 + Math.sin(t * 3) * .01; c.save(); c.translate(hx, hy); headTop(c, co, k.fluff); c.restore(); }
      if (m === 'bat') { const pa = Math.max(0, Math.sin(t * 12)); paw(c, co, .3 + pa * .12, .08, .06, .045); }
    }
    c.restore();
  }
  function drawBubble(c, k) {
    const b = k.bubble, x = k.x + 70, y = k.y - 170 - k.z * .6, s = 1 / Math.max(.6, cam.s);
    c.save(); c.globalAlpha = Math.min(1, b.t * 2.5); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#f7f2e8'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 12; c.shadowOffsetY = 4;
    if (b.dish) {
      [[-50, 110, 8], [-30, 82, 12]].forEach(([bx, by, r]) => { c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); });
      c.beginPath(); for (let i = 0; i < 9; i++) { const aa = i / 9 * TAU; c.arc(Math.cos(aa) * 58, Math.sin(aa) * 46, 30, aa - 1, aa + 1); } c.closePath(); c.fill(); c.shadowColor = 'transparent';
      const im = A.THUMB_IMG[b.dish.id]; if (im && im.width) c.drawImage(im, -52, -52, 104, 104);
    } else {
      c.font = '400 30px Caprasimo, Georgia, serif'; const w = Math.max(80, c.measureText(b.text).width + 44);
      rr(c, -w / 2, -36, w, 64, 32); c.fill(); c.beginPath(); c.moveTo(-18, 24); c.lineTo(-34, 50); c.lineTo(4, 26); c.fill(); c.shadowColor = 'transparent'; c.fillStyle = '#29241f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.text, 0, -3);
    }
    c.restore();
  }
  function drawHeart(c, x, y, s, a) { c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s); c.fillStyle = '#e8566a'; c.beginPath(); c.moveTo(0, .35); c.bezierCurveTo(-.9, -.25, -.35, -.95, 0, -.4); c.bezierCurveTo(.35, -.95, .9, -.25, 0, .35); c.fill(); c.restore(); }
  function pet(k) {
    if (k.mode === 'air' || k.mode === 'jump') return;
    for (let i = 0; i < 6; i++) hearts.push({ x: k.x + (rnd() - .5) * 80, y: k.y - 40, vy: -60 - rnd() * 60, t: 0, s: 16 + rnd() * 12 });
    k.v = 0;
    if (k.name === 'Tage') { k.mode = 'belly'; k.t = 3.5; say(k, 'Prrrrr', 2.4); A.SND.purr && A.SND.purr(2.4); }
    else if (k.name === 'Svante') { k.mode = 'bat'; k.t = 1.4; say(k, 'Mrrp!', 1.3); A.SND.meow && A.SND.meow(1.25); }
    else { k.mode = 'look'; k.t = 3; k.follow = 9; say(k, ['Mjau!', 'Prrr…', 'Mer!'][Math.floor(rnd() * 3)], 2); A.SND.purr && A.SND.purr(2); }
  }
  /* ---------------- steam ---------------- */
  const steam = [];
  function spawnSteam(dt) {
    DISH.forEach(d => { if (!STEAMY.has(d.id) || d.fall) return; if (Math.random() < dt * 2.2) steam.push({ x: d.x + (Math.random() - .5) * d.s * .35, y: d.y + (Math.random() - .5) * d.s * .35, r: 10, life: 0, max: 2.4 + Math.random() * 1.6, vx: 6 + Math.random() * 10, vy: -8 - Math.random() * 8 }); });
  }

  /* ---------------- frame ---------------- */
  let raf = 0, last = 0, running = false;
  const underTable = k => k.surf === 'floor' && k.mode !== 'air' && k.mode !== 'held' && k.mode !== 'jump' && ((Math.hypot(k.x - DINING.cx, k.y - DINING.cy) < DINING.r - 30) || (k.x > TABLE.x + 30 && k.x < TABLE.x + TABLE.w - 30 && k.y > TABLE.y + 30 && k.y < TABLE.y + TABLE.h - 30));
  const tidyBtn = document.getElementById('kTidy');
  function drawDish(c, d) {
    const im = imgFor(d), lift = d === hover || d === focus ? 1 : 0;
    let s = d.s * (1 + lift * .05); if (d.fall) s *= 1 - Math.sin(d.fall.t * Math.PI) * .12 - d.fall.t * .06; else if (d.surf === 'floor' && d.home !== 'floor') s *= .94;
    if (lift) { const g = c.createRadialGradient(d.x, d.y, d.s * .25, d.x, d.y, d.s * .62); g.addColorStop(0, 'rgba(255,226,170,.45)'); g.addColorStop(1, 'rgba(255,226,170,0)'); c.fillStyle = g; c.beginPath(); c.arc(d.x, d.y, d.s * .62, 0, TAU); c.fill(); }
    c.save(); c.translate(d.x, d.y - lift * 4); if (d.rot) c.rotate(d.rot);
    if (im) c.drawImage(im, -s / 2, -s / 2, s, s); else { c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(0, 0, d.s * .36, 0, TAU); c.fill(); }
    c.restore();
  }
  function frame(now) {
    if (!running) return; const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; const t = now / 1000;
    if (tween) { const p = Math.min(1, (now - tween.t0) / tween.dur), e = easeIO(p); cam.x = tween.from.x + (tween.to.x - tween.from.x) * e; cam.y = tween.from.y + (tween.to.y - tween.from.y) * e; cam.s = Math.exp(Math.log(tween.from.s) + (Math.log(tween.to.s) - Math.log(tween.from.s)) * e); if (p >= 1) tween = null; }
    CATS.forEach(k => updateCat(k, dt, t));
    const moved = updateDishes(dt);
    if (tidyBtn) { tidyBtn.hidden = !moved; tidyBtn.querySelector('span').textContent = `Städa upp (${moved})`; }
    spawnSteam(dt);
    for (let i = steam.length - 1; i >= 0; i--) { const p = steam[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 18 * dt; if (p.life > p.max) steam.splice(i, 1); }
    for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; h.y += h.vy * dt; h.x += Math.sin(h.t * 6 + i) * 20 * dt; if (h.t > 1.6) hearts.splice(i, 1); }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= .94; d.vy *= .94; if (d.t > .9) drops.splice(i, 1); }
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(DPR * cam.s, 0, 0, DPR * cam.s, DPR * (vw / 2 - cam.x * cam.s), DPR * (vh / 2 - cam.y * cam.s));
    c.imageSmoothingQuality = 'high';
    if (STATIC) c.drawImage(STATIC, 0, 0, W, H);
    const [wx0, wy0] = toWorld(0, 0), [wx1, wy1] = toWorld(vw, vh), vis = d => !(d.x + d.s < wx0 || d.x - d.s > wx1 || d.y + d.s < wy0 || d.y - d.s > wy1);
    // floor level: dropped dishes, treats, cats walking on the floor
    DISH.forEach(d => { if (d.surf === 'floor' && !d.fall && !d.back && vis(d)) drawDish(c, d); });
    if (treat) { c.save(); c.translate(treat.x, treat.y); c.rotate(t); for (let i = 0; i < 3; i++) { c.fillStyle = ['#8a5a30', '#6d4424', '#a06a3a'][i]; c.beginPath(); c.arc(Math.cos(i * 2.1) * 9, Math.sin(i * 2.1) * 9, 8, 0, TAU); c.fill(); } c.restore(); }
    CATS.forEach(k => { if (k.surf === 'floor' && k.z < 5 && !['air', 'held', 'jump'].includes(k.mode) && !underTable(k)) drawCat(c, k, t + k.seed); });
    // furniture level
    DISH.forEach(d => { if ((d.surf !== 'floor' || d.back) && !d.fall && vis(d)) drawDish(c, d); });
    CATS.forEach(k => { if (underTable(k)) drawTailOnly(c, k, t); });
    steam.forEach(p => { const a = Math.sin(Math.min(1, p.life / p.max) * Math.PI) * .16; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); });
    CATS.filter(k => k.surf !== 'floor' && !['air', 'held', 'jump'].includes(k.mode)).forEach(k => drawCat(c, k, t + k.seed));
    DISH.forEach(d => { if (d.fall) drawDish(c, d); });
    // lamps
    [[830, 840], [1310, 840], [DINING.cx, DINING.cy]].forEach(([x, y]) => {
      c.save(); c.shadowColor = 'rgba(10,6,3,.4)'; c.shadowBlur = 30; c.shadowOffsetX = 24; c.shadowOffsetY = 36;
      const g = c.createRadialGradient(x - 18, y - 22, 4, x, y, 62); g.addColorStop(0, '#f3dcaa'); g.addColorStop(.45, '#c89a55'); g.addColorStop(1, '#7a5a2e'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 58, 0, TAU); c.fill(); c.restore();
      c.beginPath(); c.arc(x, y, 58, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(255,240,200,.35)'; c.stroke();
      c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fillStyle = '#3a2c1c'; c.fill();
    });
    if (LIGHT) { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(LIGHT, 0, 0, W, H); c.restore(); }
    // things in the air, nearest the viewer
    CATS.filter(k => ['air', 'held', 'jump'].includes(k.mode)).sort((a, b) => a.z - b.z).forEach(k => drawCat(c, k, t + k.seed));
    drops.forEach(d => { c.fillStyle = `rgba(170,210,235,${1 - d.t})`; c.beginPath(); c.arc(d.x, d.y, 7, 0, TAU); c.fill(); });
    hearts.forEach(h => drawHeart(c, h.x, h.y, h.s, 1 - h.t / 1.6));
    if (laserOn && laser) { const r = 9 + Math.sin(t * 20) * 1.5; const g = c.createRadialGradient(laser[0], laser[1], 0, laser[0], laser[1], r * 3); g.addColorStop(0, 'rgba(255,40,40,1)'); g.addColorStop(.3, 'rgba(255,40,40,.6)'); g.addColorStop(1, 'rgba(255,40,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(laser[0], laser[1], r * 3, 0, TAU); c.fill(); }
    CATS.forEach(k => { if (k.bubble) drawBubble(c, k); });
    raf = requestAnimationFrame(frame);
  }
  function drawTailOnly(c, k, t) {
    const tx = k.x - Math.cos(k.h) * k.L * .7, ty = k.y - Math.sin(k.h) * k.L * .7;
    const inside = (tx > TABLE.x && tx < TABLE.x + TABLE.w && ty > TABLE.y && ty < TABLE.y + TABLE.h) || Math.hypot(tx - DINING.cx, ty - DINING.cy) < DINING.r;
    if (inside) return;
    c.save(); c.translate(k.x, k.y); c.rotate(k.h); c.scale(k.L, k.L); tail(c, k.coat, -.38, Math.sin(t * 2.4), 1, 0, k.fluff); c.restore();
  }

  /* ---------------- interaction ---------------- */
  const ptrs = new Map(); let drag = null, moved = false, pinch = null, grab = null;
  function dishAt(wx, wy) { let b = null; DISH.forEach(d => { if (!d.fall && Math.hypot(d.x - wx, d.y - wy) < d.s * .38) b = d; }); return b; }
  function catAt(wx, wy) { let b = null, bd = 1e9; CATS.forEach(k => { if (underTable(k)) return; const d = Math.hypot(k.x - wx, k.y - wy); if (d < k.L * .5 * (1 + k.z / 900) && d < bd) { bd = d; b = k; } }); return b; }
  const ptrWorld = e => { const r = cv.getBoundingClientRect(); return toWorld(e.clientX - r.left, e.clientY - r.top); };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = false; tween = null;
    if (ptrs.size === 2) { grab = null; const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: cam.s }; drag = null; return; }
    const [wx, wy] = ptrWorld(e); const k = catAt(wx, wy);
    if (k && !treatMode) { grab = { k, x: wx, y: wy, hist: [[wx, wy, performance.now()]], startMode: k.mode, t0: performance.now() }; return; }
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
  });
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), [wx, wy] = ptrWorld(e);
    pointerW = [wx, wy]; pointerT = performance.now(); if (laserOn) laser = [wx, wy];
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; cam.s = pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d; clampCam(); moved = true; return; }
    if (grab) {
      const k = grab.k; const d = Math.hypot(wx - grab.x, wy - grab.y);
      if (k.mode !== 'held' && d > 12 / cam.s) { k.mode = 'held'; k.bubble = null; k.goal = null; k.surfBefore = k.surf; k.v = 0; if (k.limp) say(k, 'Prrr…', 1.4); else say(k, k.name === 'Svante' ? 'Hallå!?' : 'Mjao?', 1.2); A.SND.meow && A.SND.meow(k.limp ? .85 : 1.1); tipEl.classList.remove('on'); }
      if (k.mode === 'held') { k.x += (wx - k.x) * .5; k.y += (wy - k.y) * .5; k.z = 230; const n = performance.now(); grab.hist.push([wx, wy, n]); while (grab.hist.length > 6) grab.hist.shift(); k.h += (Math.atan2(wy - grab.hist[0][1], wx - grab.hist[0][0]) - k.h) * .05; }
      cv.style.cursor = 'grabbing'; return;
    }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) moved = true; if (moved) { cam.x = drag.cx - dx / cam.s; cam.y = drag.cy - dy / cam.s; clampCam(); cv.style.cursor = 'grabbing'; } return; }
    const d = dishAt(wx, wy), k = !d && catAt(wx, wy);
    hover = d; cv.style.cursor = treatMode ? 'copy' : k ? 'grab' : d ? 'pointer' : laserOn ? 'none' : 'grab';
    if (d) { tipEl.innerHTML = `<b>${A.esc(A.META[d.id].ch.name)} · ${A.META[d.id].ref}${d.surf === 'floor' && d.home !== 'floor' ? ' · på golvet' : ''}</b>${A.esc(A.R[d.id].title)}`; tipEl.style.left = (e.clientX - r.left) + 'px'; tipEl.style.top = (e.clientY - r.top) + 'px'; tipEl.classList.add('on'); }
    else if (k) { tipEl.innerHTML = `<b>Katt · dra för att lyfta, klicka för att klappa</b>${k.name}, ${k.desc}`; tipEl.style.left = (e.clientX - r.left) + 'px'; tipEl.style.top = (e.clientY - r.top) + 'px'; tipEl.classList.add('on'); }
    else tipEl.classList.remove('on');
  });
  const up = e => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; cv.style.cursor = 'grab';
    if (grab) {
      const k = grab.k;
      if (k.mode === 'held') { const h = grab.hist, a = h[0], b = h[h.length - 1], dt = Math.max(16, b[2] - a[2]) / 1000; k.vx = clamp((b[0] - a[0]) / dt, -2600, 2600); k.vy = clamp((b[1] - a[1]) / dt, -2600, 2600); k.vz = 260 + Math.min(500, Math.hypot(k.vx, k.vy) * .2); k.vs = (rnd() - .5) * (k.limp ? 2 : 9) * Math.min(1, Math.hypot(k.vx, k.vy) / 800); k.spin = 0; k.mode = 'air'; k.surf = 'floor'; if (Math.hypot(k.vx, k.vy) > 900) say(k, k.limp ? 'Wiii!' : 'Mjaaau!', 1.2); }
      else pet(k);
      grab = null; return;
    }
    if (drag && !moved) {
      const [wx, wy] = ptrWorld(e);
      if (treatMode) { treat = { x: clamp(wx, 120, W - 120), y: clamp(wy, 120, H - 120) }; if (blocked(treat.x, treat.y, 20) || surfAt(treat.x, treat.y) !== 'floor') { const [x, y] = floorTarget({ x: treat.x, y: treat.y }, [treat.x, treat.y, 200]); treat.x = x; treat.y = y; } treatMode = false; document.getElementById('kTreat').setAttribute('aria-pressed', 'false'); CATS.forEach(k => { if (k.mode === 'sleep' && k.pers.lazy > .8 && rnd() < .5) return; k.goal = null; if (k.mode !== 'air' && k.mode !== 'held' && k.mode !== 'jump') { k.mode = 'sit'; k.t = .1 + rnd() * .5; } }); A.SND.plop && A.SND.plop(.03); }
      else { const d = dishAt(wx, wy); if (d) focusDish(d); else if (focus) unfocus(); }
    }
    drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { hover = null; tipEl.classList.remove('on'); if (laserOn) laser = null; });
  cv.addEventListener('dblclick', e => { const [wx, wy] = ptrWorld(e); if (dishAt(wx, wy) || catAt(wx, wy)) return; treatMode = true; up({ pointerId: -1, clientX: e.clientX, clientY: e.clientY }); });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; const [wx, wy] = toWorld(sx, sy); tween = null; cam.s *= Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016)); clampCam(); cam.x = wx - (sx - vw / 2) / cam.s; cam.y = wy - (sy - vh / 2) / cam.s; clampCam(); }, { passive: false });
  document.getElementById('kLaser').addEventListener('click', e => { laserOn = !laserOn; e.currentTarget.setAttribute('aria-pressed', laserOn); if (!laserOn) laser = null; showToast(laserOn ? 'Laserpekaren är på. Flytta muspekaren över golvet och se vem som jagar.' : 'Laserpekaren är av.'); });
  document.getElementById('kTreat').addEventListener('click', e => { treatMode = !treatMode; e.currentTarget.setAttribute('aria-pressed', treatMode); if (treatMode) showToast('Klicka där godiset ska hamna. Du kan också dubbelklicka på golvet.'); });
  if (tidyBtn) tidyBtn.addEventListener('click', () => { tidy(); showToast('Alla rätter är tillbaka på sina platser.'); });
  /* ---------------- focus panel ---------------- */
  function focusDish(d) {
    focus = d; const pw = innerWidth >= 900 ? Math.min(430, innerWidth * .36) : 0;
    const mobile = innerWidth < 900;
    const availW = vw - pw, availH = mobile ? vh * .5 : vh;
    const s = clamp(Math.min(availW * .62, availH * .7) / d.s, fitScale(), 5.2);
    const ox = pw / 2 / s, oy = mobile ? vh * .23 / s : 0;
    flyTo(d.x + ox, d.y + oy, s);
    if (!HIRES[d.id]) setTimeout(() => { HIRES[d.id] = renderScene(A.scene(d.id), Math.round(clamp(d.s * s * DPR * 1.1, 400, 1400))); }, 30);
    renderPanel(d); panel.hidden = false;
    ov.classList.add('focused');
  }
  function unfocus() { focus = null; panel.hidden = true; ov.classList.remove('focused'); flyTo(cam.x, H / 2 + 30, homeScale()); }
  function renderPanel(d) {
    const r = A.R[d.id], m = A.META[d.id], fl = A.flat(d.id);
    panel.style.setProperty('--c', m.ch.color);
    const metas = r.parts.flatMap(p => p.meta || []), steps = r.parts.reduce((a, p) => a + (p.steps || []).length, 0);
    const ings = fl.filter(f => !/:$/.test(f.t));
    const mins = r.parts.flatMap(p => p.steps || []).flatMap(s => A.timersIn(s)).reduce((a, t) => a + t.min, 0);
    const shown = ings.slice(0, 9);
    panel.querySelector('.kp-body').innerHTML = `
      <span class="chip"><i></i><span>Flik ${m.ch.n} · ${A.esc(m.ch.name)}</span></span>
      <h2>${A.esc(r.title)}</h2>
      <p class="kp-meta">${[d.zone, 'sida ' + m.ref, ...metas].map(A.esc).join(' · ')}</p>
      <div class="kp-facts"><span><b>${ings.length}</b>ingredienser</span><span><b>${steps}</b>${steps === 1 ? 'steg' : 'steg'}</span>${mins ? `<span><b>${Math.round(mins)}</b>min i timers</span>` : ''}</div>
      <ul class="kp-ings">${shown.map(f => { const ic = A.iconFor(f.k); const { q, t } = A.qtyHTML(f.t, 1); return `<li>${ic ? `<img src="${ic}" alt="">` : '<i></i>'}<span class="q">${q}</span><span>${t}</span></li>`; }).join('')}</ul>
      ${ings.length > shown.length ? `<p class="kp-more">och ${ings.length - shown.length} till</p>` : ''}`;
    const i = DISH.indexOf(d);
    panel.querySelector('#kpPrev span').textContent = A.R[DISH[(i - 1 + DISH.length) % DISH.length].id].title;
    panel.querySelector('#kpNext span').textContent = A.R[DISH[(i + 1) % DISH.length].id].title;
  }
  panel.querySelector('#kpOpen').addEventListener('click', () => focus && A.openRecipe(focus.id));
  panel.querySelector('#kpCook').addEventListener('click', () => focus && A.openCook(focus.id));
  panel.querySelector('#kpPrev').addEventListener('click', () => step(-1));
  panel.querySelector('#kpNext').addEventListener('click', () => step(1));
  panel.querySelector('[data-kback]').addEventListener('click', unfocus);
  function step(dir) { const i = focus ? DISH.indexOf(focus) : -1; focusDish(DISH[(i + dir + DISH.length) % DISH.length]); }
  // zone chips & zoom buttons
  const chips = document.getElementById('kZones');
  chips.innerHTML = `<button class="btn" type="button" data-z="all">Hela köket</button>` + ZONES.map((z, i) => `<button class="btn" type="button" data-z="${i}"><i style="background:${chap(z.n).color}"></i>${A.esc(z.name)}</button>`).join('');
  chips.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; if (focus) { focus = null; panel.hidden = true; ov.classList.remove('focused'); } if (b.dataset.z === 'all') flyTo(W / 2, H / 2 + 30, fitScale()); else { const z = ZONES[+b.dataset.z]; flyTo(z.cam[0], z.cam[1], Math.max(homeScale() * 1.3, fitScale() * z.cam[2] * 1.9)); } b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); });
  document.getElementById('kZoomIn').addEventListener('click', () => flyTo(cam.x, cam.y, Math.min(6, cam.s * 1.5), 400));
  document.getElementById('kZoomOut').addEventListener('click', () => flyTo(cam.x, cam.y, Math.max(fitScale() * .85, cam.s / 1.5), 400));

  /* ---------------- open / close ---------------- */
  function open(id) {
    A.showOverlay(ov); resize();
    if (!STATIC) buildStatic();
    A.ORDER.forEach(x => A.wantThumb(x));
    cam.s = homeScale() * 1.35; cam.x = W / 2; cam.y = H / 2 + 30;
    flyTo(W / 2, H / 2 + 30, homeScale(), 1600);
    running = true; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    if (id && byId[id]) setTimeout(() => focusDish(byId[id]), 700);
  }
  function close() { running = false; cancelAnimationFrame(raf); focus = null; panel.hidden = true; ov.classList.remove('focused'); A.hideOverlay(ov); }
  function back() { if (focus) { unfocus(); return true; } close(); return true; }
  window.addEventListener('resize', () => { if (!ov.hidden) { resize(); clampCam(); } });
  document.addEventListener('keydown', e => {
    if (ov.hidden || A.topOverlay() !== ov) return;
    if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1);
    if (e.key === '+' || e.key === '=') flyTo(cam.x, cam.y, Math.min(6, cam.s * 1.4), 300);
    if (e.key === '-') flyTo(cam.x, cam.y, Math.max(fitScale() * .85, cam.s / 1.4), 300);
  });
  return { open, close, back, debug: { frame: n => { running = true; frame(n); cancelAnimationFrame(raf); running = false; }, CATS, DISH, cam, resize, buildStatic: () => { if (!STATIC) buildStatic(); }, drawCat, updateCat, pet } };
}
