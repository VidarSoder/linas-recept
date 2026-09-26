/* ==========================================================================
   Tallriksmotorn — every dish is painted from its own ingredient list.
   All drawing happens in unit space (the plate square is 1 × 1).
   ========================================================================== */
const TAU = Math.PI * 2;
const HAS_DOM = typeof document !== 'undefined';
function mkCanvas(w = 1, h = 1) { if (HAS_DOM) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } return new OffscreenCanvas(w, h); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const C = {
  rgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; },
  hex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); },
  mix(a, b, t) { const A = C.rgb(a), B = C.rgb(b); return C.hex(A.map((v, i) => v + (B[i] - v) * t)); },
  light(a, t) { return C.mix(a, '#fffaf0', t); },
  dark(a, t) { return C.mix(a, '#1c110b', t); },
  rgba(a, al) { const [r, g, b] = C.rgb(a); return `rgba(${r},${g},${b},${al})`; },
  lum(a) { const [r, g, b] = C.rgb(a); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; },
  dist(a, b) { const A = C.rgb(a), B = C.rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) / 441; }
};
const LIGHT = { x: -0.6, y: -0.8 };
let LX = LIGHT.x, LY = LIGHT.y;       // light direction in the current glyph's local space

/* ---------- primitives ---------- */
function ball(c, x, y, r, col, hi = .5, lo = .45) {
  const g = c.createRadialGradient(x + LX * r * .45, y + LY * r * .45, r * .04, x, y, r);
  g.addColorStop(0, C.light(col, hi)); g.addColorStop(.45, col); g.addColorStop(1, C.dark(col, lo));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function glint(c, x, y, r, a = .55) {
  c.fillStyle = `rgba(255,252,242,${a})`; c.beginPath();
  c.ellipse(x + LX * r * .42, y + LY * r * .42, r * .22, r * .12, Math.atan2(LY, LX) + Math.PI / 2, 0, TAU); c.fill();
}
function litFill(c, col, r, hi = .35, lo = .35) {
  const g = c.createRadialGradient(LX * r * .45, LY * r * .45, r * .05, 0, 0, r * 1.05);
  g.addColorStop(0, C.light(col, hi)); g.addColorStop(.55, col); g.addColorStop(1, C.dark(col, lo)); return g;
}
function linFill(c, col, hi = .3, lo = .3, len = .5) {
  const g = c.createLinearGradient(LX * len, LY * len, -LX * len, -LY * len);
  g.addColorStop(0, C.light(col, hi)); g.addColorStop(.5, col); g.addColorStop(1, C.dark(col, lo)); return g;
}
function blobPath(c, r, rnd, n = 9, irr = .18, sx = 1, sy = 1) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU; const rr = r * (1 - irr + rnd() * irr * 2); p.push([Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]); }
  c.beginPath(); c.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2);
  for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  c.closePath();
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function scatterDots(c, rnd, n, R, rmin, rmax, cols, alpha = [.6, 1], gauss = true) {
  for (let i = 0; i < n; i++) {
    let x, y;
    if (gauss) { const a = rnd() * TAU, d = R * Math.sqrt(-2 * Math.log(1 - rnd() * .95)) * .45; x = Math.cos(a) * d; y = Math.sin(a) * d; }
    else { const a = rnd() * TAU, d = R * Math.sqrt(rnd()); x = Math.cos(a) * d; y = Math.sin(a) * d; }
    c.globalAlpha = alpha[0] + rnd() * (alpha[1] - alpha[0]);
    c.fillStyle = cols[Math.floor(rnd() * cols.length)];
    c.beginPath(); c.arc(x, y, rmin + rnd() * (rmax - rmin), 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}
function strokeTrip(c, path, w, col, hiA = .55) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.lineWidth = w * 1.45; c.strokeStyle = C.rgba(C.dark(col, .55), .55); c.stroke();
  path(); c.lineWidth = w; c.strokeStyle = col; c.stroke();
  c.save(); c.translate(LX * w * .22, LY * w * .22); path(); c.lineWidth = w * .32; c.strokeStyle = C.rgba(C.light(col, .6), hiA); c.stroke(); c.restore();
}

/* ---------- glyphs: drawn at the origin, roughly unit diameter ---------- */
const G = {};
const EXT = {};   // how far a glyph can reach beyond radius .5 (sprite sizing)
G.pea = (c, r, col) => { ball(c, 0, 0, .5, col); glint(c, 0, 0, .5, .6); };
G.lentil = (c, r, col) => { c.fillStyle = litFill(c, col, .5, .3, .25); c.beginPath(); c.ellipse(0, 0, .5, .42, 0, 0, TAU); c.fill(); c.lineWidth = .05; c.strokeStyle = C.rgba(C.dark(col, .25), .5); c.stroke(); };
G.bean = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, .02); c.bezierCurveTo(-.52, -.3, -.2, -.33, 0, -.3); c.bezierCurveTo(.25, -.33, .52, -.28, .5, 0);
  c.bezierCurveTo(.48, .26, .2, .3, .08, .19); c.quadraticCurveTo(0, .13, -.08, .19); c.bezierCurveTo(-.25, .3, -.48, .26, -.5, .02); c.closePath();
  c.fillStyle = litFill(c, col, .5, C.lum(col) < .2 ? .25 : .35, .4); c.fill();
  c.beginPath(); c.moveTo(-.3, -.18); c.quadraticCurveTo(0, -.27, .3, -.18); c.lineWidth = .05; c.strokeStyle = `rgba(255,250,240,${C.lum(col) < .2 ? .35 : .4})`; c.lineCap = 'round'; c.stroke();
  c.fillStyle = C.rgba(C.dark(col, .5), .5); c.beginPath(); c.ellipse(0, .15, .05, .025, 0, 0, TAU); c.fill();
};
G.chickpea = (c, r, col) => {
  c.beginPath(); const ph = r() * 6;
  for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rr_ = .5 * (1 + .05 * Math.sin(a * 3 + ph) + .035 * Math.sin(a * 7 + ph * 2)); const x = Math.cos(a) * rr_, y = Math.sin(a) * rr_; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.closePath(); c.fillStyle = litFill(c, col, .5, .35, .4); c.fill();
  c.beginPath(); c.arc(.05, .02, .32, -1.4, .9); c.lineWidth = .04; c.strokeStyle = C.rgba(C.dark(col, .4), .35); c.stroke();
  c.fillStyle = C.dark(col, .25); c.beginPath(); c.moveTo(.42, -.18); c.lineTo(.56, -.24); c.lineTo(.46, -.08); c.fill();
};
G.rice = (c, r, col) => { const g = c.createLinearGradient(0, -.17, 0, .17); g.addColorStop(0, C.light(col, .5)); g.addColorStop(.6, col); g.addColorStop(1, C.dark(col, .2)); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, .5, .17, 0, 0, TAU); c.fill(); };
G.tube = (c, r, col, v) => {  // penne
  const h = .19;
  c.beginPath(); c.moveTo(-.4, -h); c.lineTo(.5, -h); c.lineTo(.4, h); c.lineTo(-.5, h); c.closePath();
  const g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, C.dark(col, .25)); g.addColorStop(.3, C.light(col, .35)); g.addColorStop(.65, col); g.addColorStop(1, C.dark(col, .35));
  c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.strokeStyle = C.rgba(C.dark(col, .4), .22); c.lineWidth = .018;
  for (let y = -h + .05; y < h; y += .055) { c.beginPath(); c.moveTo(-.55, y); c.lineTo(.55, y); c.stroke(); } c.restore();
  c.fillStyle = C.dark(col, .45); c.beginPath(); c.ellipse(.45, 0, .045, h * .8, .25, 0, TAU); c.fill();
  c.fillStyle = C.dark(col, .3); c.beginPath(); c.ellipse(-.45, 0, .04, h * .8, .25, 0, TAU); c.fill();
};
EXT.tube = 1.3;
G.rigatoni = (c, r, col) => {
  const h = .24; rr(c, -.45, -h, .9, h * 2, .04);
  const g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, C.dark(col, .25)); g.addColorStop(.3, C.light(col, .3)); g.addColorStop(.7, col); g.addColorStop(1, C.dark(col, .35));
  c.fillStyle = g; c.fill(); c.save(); c.clip(); c.strokeStyle = C.rgba(C.dark(col, .45), .28); c.lineWidth = .022;
  for (let x = -.45; x < .46; x += .07) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x, h); c.stroke(); } c.restore();
  c.fillStyle = C.dark(col, .5); c.beginPath(); c.ellipse(.45, 0, .05, h * .85, 0, 0, TAU); c.fill();
};
EXT.rigatoni = 1.3;
G.macaroni = (c, r, col) => {
  const path = () => { c.beginPath(); c.arc(0, .28, .34, -2.5, -.64); };
  strokeTrip(c, path, .24, col, .5);
  c.fillStyle = C.dark(col, .45); c.beginPath(); c.ellipse(Math.cos(-.64) * .34, .28 + Math.sin(-.64) * .34, .1, .06, -.64 + Math.PI / 2, 0, TAU); c.fill();
};
G.farfalle = (c, r, col) => {
  c.beginPath(); c.moveTo(0, -.08);
  for (let i = 0; i <= 8; i++) { const y = -.32 + i * .08; c.lineTo(-.5 + (i % 2) * .05, y); }
  c.lineTo(0, .08);
  for (let i = 0; i <= 8; i++) { const y = .32 - i * .08; c.lineTo(.5 - (i % 2) * .05, y); }
  c.closePath(); c.fillStyle = linFill(c, col, .3, .3); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .35), .3); c.lineWidth = .02;
  for (const sx of [-1, 1]) for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(sx * .1, 0); c.lineTo(sx * .45, (k - 2) * .2); c.stroke(); }
  c.fillStyle = C.dark(col, .15); c.beginPath(); c.ellipse(0, 0, .09, .14, 0, 0, TAU); c.fill();
};
G.gnocchi = (c, r, col) => {
  c.beginPath(); c.ellipse(0, 0, .5, .36, 0, 0, TAU); c.fillStyle = litFill(c, col, .5, .3, .35); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .35), .35); c.lineWidth = .035;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * .15 - .06, -.3 + Math.abs(k) * .03); c.quadraticCurveTo(k * .15 + .05, 0, k * .15 - .06, .3 - Math.abs(k) * .03); c.stroke(); }
};
G.leaf = (c, r, col, v) => {
  const w = (v && v.w) || (.32 + r() * .08), wob = (v && v.wob) || 0;
  c.beginPath(); c.moveTo(-.5, 0);
  c.bezierCurveTo(-.25, -w * 1.15 - wob * r(), .25, -w - wob * r(), .5, 0);
  c.bezierCurveTo(.25, w + wob * r(), -.25, w * 1.15, -.5, 0); c.closePath();
  c.fillStyle = linFill(c, col, .28, .3); c.fill();
  c.save(); c.clip(); c.fillStyle = C.rgba(C.dark(col, .5), .18); c.fillRect(-.6, 0, 1.2, .6);
  if (v && v.gloss) { c.fillStyle = 'rgba(255,255,240,.18)'; c.beginPath(); c.ellipse(-.05, -w * .45, .3, w * .25, 0, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = C.rgba(C.light(col, .45), .65); c.lineWidth = .025; c.beginPath(); c.moveTo(-.52, 0); c.quadraticCurveTo(0, -.03, .45, 0); c.stroke();
  c.lineWidth = .012;
  for (let k = 1; k <= 4; k++) { const x = -.42 + k * .17; c.beginPath(); c.moveTo(x, -.01); c.quadraticCurveTo(x + .08, -w * .4, x + .15, -w * .72); c.moveTo(x, .01); c.quadraticCurveTo(x + .08, w * .4, x + .15, w * .72); c.stroke(); }
};
EXT.leaf = 1.3;
G.basil = (c, r, col) => G.leaf(c, r, col, { w: .42, gloss: true });
EXT.basil = 1.3;
G.bay = (c, r, col) => G.leaf(c, r, col, { w: .2 });
EXT.bay = 1.3;
G.rocket = (c, r, col) => {
  const ph = r() * 5; const top = [], bot = [];
  for (let k = 0; k <= 12; k++) { const x = -.5 + k / 12; const env = Math.max(0, 1 - Math.abs(x + .05) * 1.9);
    top.push([x, -(.05 + .2 * Math.abs(Math.sin(k * 1.25 + ph))) * env - .02]); bot.push([x, (.05 + .2 * Math.abs(Math.sin(k * 1.2 + ph + 1))) * env + .02]); }
  c.beginPath(); c.moveTo(-.5, 0); top.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(.5, 0); bot.reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath();
  c.fillStyle = linFill(c, col, .25, .3); c.fill();
  c.strokeStyle = C.rgba(C.light(col, .5), .6); c.lineWidth = .025; c.beginPath(); c.moveTo(-.55, 0); c.lineTo(.45, 0); c.stroke();
};
EXT.rocket = 1.3;
G.frond = (c, r, col) => {
  c.lineCap = 'round'; c.strokeStyle = C.dark(col, .1); c.lineWidth = .02;
  const bend = (r() - .5) * .3; const pt = t => [-.5 + t, Math.sin(t * Math.PI) * bend];
  c.beginPath(); c.moveTo(...pt(0)); for (let t = .05; t <= 1; t += .05) c.lineTo(...pt(t)); c.stroke();
  for (let t = .12; t < .95; t += .085) {
    const [x, y] = pt(t); const L = .2 * (1 - t * .45);
    for (const s of [-1, 1]) {
      const a = s * (.7 + r() * .4) - .2; const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
      c.strokeStyle = C.mix(col, s > 0 ? C.dark(col, .2) : C.light(col, .2), r()); c.lineWidth = .012;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.lineWidth = .007;
      for (let q = .35; q < 1; q += .22) { const bx = x + (ex - x) * q, by = y + (ey - y) * q; for (const s2 of [-1, 1]) { const a2 = a + s2 * .8; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a2) * .06, by + Math.sin(a2) * .06); c.stroke(); } }
    }
  }
};
EXT.frond = 1.5;
G.herbbits = (c, r, col) => {
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    c.save(); c.translate((r() - .5) * .6, (r() - .5) * .6); c.rotate(r() * TAU);
    blobPath(c, .09 + r() * .1, r, 5, .45, 1.3, .8); c.fillStyle = C.mix(col, r() < .5 ? C.light(col, .25) : C.dark(col, .25), r()); c.fill(); c.restore();
  }
};
G.ring = (c, r, col, v) => {
  const ri = (v && v.inner) || .3;
  c.beginPath(); c.ellipse(0, 0, .5, .46, 0, 0, TAU); c.ellipse(0, 0, ri, ri * .92, 0, 0, TAU, true);
  c.fillStyle = litFill(c, col, .5, .3, .35); c.fill('evenodd');
  c.lineWidth = .04; c.strokeStyle = C.rgba(C.light(col, .55), .7); c.beginPath(); c.ellipse(0, 0, ri + .02, ri * .92 + .02, 0, 0, TAU); c.stroke();
};
G.onion = (c, r, col, v) => {
  const raw = v && v.raw, fried = v && v.fried, k = raw ? 2 : 1;
  for (let i = 0; i < k; i++) {
    const R = .46 - i * .14, a0 = Math.PI * (1.15 + r() * .15), a1 = Math.PI * (1.85 - r() * .15);
    c.lineCap = 'round'; c.beginPath(); c.arc(0, .22, R, a0, a1);
    c.lineWidth = raw ? .09 : fried ? .12 : .075; c.strokeStyle = C.rgba(col, raw || fried ? .95 : .5); c.stroke();
    c.lineWidth = .022; c.strokeStyle = C.rgba(raw ? '#fbf4f6' : C.light(col, fried ? .35 : .6), raw ? .9 : fried ? .7 : .45);
    c.beginPath(); c.arc(0, .22, R - .025, a0 + .06, a1 - .06); c.stroke();
    if (fried) { c.lineWidth = .02; c.strokeStyle = C.rgba(C.dark(col, .5), .6); c.beginPath(); c.arc(0, .22, R + .03, a0 + .1, a1 - .2); c.stroke(); }
  }
};
EXT.onion = 1.2;
G.bits = (c, r, col) => { for (let i = 0; i < 4; i++) { c.save(); c.translate((r() - .5) * .55, (r() - .5) * .55); c.rotate(r() * TAU); rr(c, -.12, -.1, .24, .2, .05); c.fillStyle = C.rgba(col, .6); c.fill(); c.strokeStyle = C.rgba(C.light(col, .6), .7); c.lineWidth = .025; c.stroke(); c.restore(); } };
G.garlic = (c, r, col) => {
  c.beginPath(); c.ellipse(0, 0, .5, .38, 0, 0, TAU); c.fillStyle = litFill(c, col, .5, .3, .2); c.fill();
  c.beginPath(); c.ellipse(-.03, .02, .28, .18, 0, 0, TAU); c.lineWidth = .04; c.strokeStyle = C.rgba(C.dark(col, .25), .35); c.stroke();
  c.fillStyle = C.rgba(C.dark(col, .2), .5); c.beginPath(); c.moveTo(.42, -.1); c.lineTo(.52, 0); c.lineTo(.42, .1); c.fill();
};
G.coin = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = litFill(c, col, .5, .25, .3); c.fill();
  c.beginPath(); c.arc(0, 0, .3, 0, TAU); c.fillStyle = C.rgba(C.light(col, .3), .7); c.fill();
  c.strokeStyle = C.rgba(C.light(col, .45), .3); c.lineWidth = .02;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * .08, Math.sin(a) * .08); c.lineTo(Math.cos(a) * .44, Math.sin(a) * .44); c.stroke(); }
  c.beginPath(); c.arc(0, 0, .49, 0, TAU); c.lineWidth = .04; c.strokeStyle = C.rgba(C.dark(col, .3), .5); c.stroke();
};
G.shred = (c, r, col, v) => {
  const n = (v && v.n) || 1;
  for (let i = 0; i < n; i++) {
    const oy = (i - (n - 1) / 2) * .12; const k1 = (r() - .5) * .5, k2 = (r() - .5) * .25;
    strokeTrip(c, () => { c.beginPath(); c.moveTo(-.5, oy); c.quadraticCurveTo(0, oy + k1, .5, oy + k2); }, (v && v.w) || .075, col, .45);
  }
};
EXT.shred = 1.25;
G.crescent = (c, r, col) => {
  c.beginPath(); c.arc(0, .12, .5, Math.PI * 1.12, Math.PI * 1.88); c.arc(0, .2, .36, Math.PI * 1.85, Math.PI * 1.15, true); c.closePath();
  c.fillStyle = linFill(c, col, .35, .25); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .3), .35); c.lineWidth = .02;
  for (let a = 1.2; a < 1.85; a += .1) { c.beginPath(); c.moveTo(Math.cos(a * Math.PI) * .47, .12 + Math.sin(a * Math.PI) * .47); c.lineTo(Math.cos(a * Math.PI) * .4, .18 + Math.sin(a * Math.PI) * .4); c.stroke(); }
};
G.cube = (c, r, col, v) => {
  const s = .78; rr(c, -s / 2, -s / 2, s, s, .12);
  c.fillStyle = col; c.fill();
  const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,250,235,.35)'); g.addColorStop(.5, 'rgba(255,250,235,0)'); g.addColorStop(1, 'rgba(40,20,10,.28)');
  c.fillStyle = g; c.fill();
  if (v && v.brown) { const g2 = c.createRadialGradient(0, 0, .12, 0, 0, .52); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, C.rgba(v.brown, .75)); c.fillStyle = g2; c.fill(); }
  c.lineWidth = .025; c.strokeStyle = C.rgba(C.dark(col, .35), .3); c.stroke();
};
G.tofu = (c, r, col) => G.cube(c, r, col, { brown: '#c98a3c' });
G.aubcube = (c, r, col) => { G.cube(c, r, col, { brown: '#b9782e' }); rr(c, -.39, .2, .78, .19, .08); c.fillStyle = '#3a1b36'; c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-.3, .23, .5, .03); };
G.potcube = (c, r, col) => G.cube(c, r, col);
G.tdice = (c, r, col) => {
  rr(c, -.42, -.4, .84, .8, .14); c.fillStyle = litFill(c, col, .5, .25, .3); c.fill();
  c.beginPath(); c.ellipse(.05, .05, .24, .2, .4, 0, TAU); c.fillStyle = C.rgba('#f7a57c', .7); c.fill();
  c.fillStyle = '#f6e3a3'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-.05 + i * .09, .02 + (i % 2) * .08, .04, .025, .5, 0, TAU); c.fill(); }
};
G.cherry = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = litFill(c, col, .5, .25, .35); c.fill();
  c.beginPath(); c.arc(0, 0, .42, 0, TAU); c.fillStyle = C.light(col, .22); c.fill();
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; c.beginPath(); c.ellipse(Math.cos(a) * .19, Math.sin(a) * .19, .14, .1, a, 0, TAU); c.fillStyle = '#f7b08b'; c.fill();
    c.fillStyle = '#f3e2a0'; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(Math.cos(a) * (.13 + k * .05), Math.sin(a) * (.13 + k * .05), .03, .018, a + 1.5, 0, TAU); c.fill(); } }
  c.fillStyle = C.light(col, .45); c.beginPath(); c.arc(0, 0, .06, 0, TAU); c.fill();
};
G.tchunk = (c, r, col) => { blobPath(c, .5, r, 8, .28); c.fillStyle = litFill(c, col, .5, .3, .35); c.fill(); glint(c, 0, 0, .5, .45); };
G.strip = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, -.02); c.quadraticCurveTo(0, -.3, .5, -.02); c.quadraticCurveTo(.52, .06, .48, .09); c.quadraticCurveTo(0, -.13, -.48, .09); c.quadraticCurveTo(-.52, .06, -.5, -.02); c.closePath();
  const g = c.createLinearGradient(0, -.2, 0, .08); g.addColorStop(0, C.light(col, .3)); g.addColorStop(.5, col); g.addColorStop(1, C.dark(col, .35)); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,250,240,.55)'; c.lineWidth = .025; c.beginPath(); c.moveTo(-.35, -.08); c.quadraticCurveTo(0, -.25, .35, -.08); c.stroke();
};
EXT.strip = 1.3;
G.sundried = (c, r, col) => {
  blobPath(c, .5, r, 10, .22, 1, .55); c.fillStyle = litFill(c, col, .5, .2, .35); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .5), .5); c.lineWidth = .03;
  for (let i = 0; i < 4; i++) { c.beginPath(); const x = -.3 + i * .18; c.moveTo(x, -.15); c.quadraticCurveTo(x + .06, 0, x - .02, .15); c.stroke(); }
  glint(c, 0, 0, .45, .4);
};
G.chiliring = (c, r, col) => { G.ring(c, r, col, { inner: .33 }); c.fillStyle = '#f7ecc8'; for (let i = 0; i < 3; i++) { const a = r() * TAU; c.beginPath(); c.ellipse(Math.cos(a) * .15, Math.sin(a) * .15, .07, .045, a, 0, TAU); c.fill(); } };
G.flakes = (c, r, col) => { for (let i = 0; i < 14; i++) { c.save(); const a = r() * TAU, d = r() * .45; c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(r() * TAU); c.fillStyle = r() < .3 ? '#f1d9a0' : C.mix(col, C.dark(col, .3), r()); c.beginPath(); c.moveTo(0, -.04); c.lineTo(.04, .03); c.lineTo(-.03, .035); c.fill(); c.restore(); } };
G.dust = (c, r, col) => scatterDots(c, r, 60, .5, .007, .016, [col, C.dark(col, .2), C.light(col, .15)], [.3, .8]);
G.pepper = (c, r, col) => scatterDots(c, r, 22, .5, .01, .022, ['#2a211c', '#3d3128', '#1a1410'], [.55, .9], false);
G.herbspecks = (c, r, col) => { for (let i = 0; i < 26; i++) { const a = r() * TAU, d = r() * .45; c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(r() * TAU); c.fillStyle = C.mix(col, C.dark(col, .35), r()); c.fillRect(-.03, -.008, .06, .016); c.restore(); } };
G.clove = (c, r, col) => {
  c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = .14; c.beginPath(); c.moveTo(-.5, 0); c.lineTo(.08, 0); c.stroke();
  for (let i = 0; i < 4; i++) ball(c, .22 + Math.cos(i * TAU / 4) * .1, Math.sin(i * TAU / 4) * .1, .12, C.light(col, .1), .3, .4);
};
G.juniper = (c, r, col) => { ball(c, 0, 0, .5, col, .3, .5); c.fillStyle = 'rgba(200,210,230,.22)'; c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,20,30,.5)'; c.lineWidth = .04; for (let i = 0; i < 3; i++) { const a = i * TAU / 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * .12, Math.sin(a) * .12); c.stroke(); } };
G.mush = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, .02); c.bezierCurveTo(-.5, -.44, .5, -.44, .5, .02); c.quadraticCurveTo(.38, .1, .16, .08); c.lineTo(.14, .46); c.quadraticCurveTo(0, .52, -.14, .46); c.lineTo(-.16, .08); c.quadraticCurveTo(-.38, .1, -.5, .02); c.closePath();
  c.fillStyle = litFill(c, col, .5, .3, .2); c.fill();
  c.beginPath(); c.moveTo(-.5, .02); c.bezierCurveTo(-.5, -.44, .5, -.44, .5, .02); c.lineWidth = .06; c.strokeStyle = C.dark(col, .45); c.stroke();
  c.strokeStyle = C.rgba(C.dark(col, .3), .3); c.lineWidth = .015;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * .1, .04); c.lineTo(i * .12, -.2); c.stroke(); }
};
G.shiitake = (c, r, col) => {
  blobPath(c, .5, r, 12, .06); c.fillStyle = litFill(c, col, .5, .25, .4); c.fill();
  c.strokeStyle = 'rgba(240,225,200,.45)'; c.lineWidth = .025;
  for (let i = 0; i < 9; i++) { const a = r() * TAU; c.beginPath(); c.moveTo(Math.cos(a) * .12, Math.sin(a) * .12); c.lineTo(Math.cos(a + .2) * .4, Math.sin(a + .2) * .4); c.stroke(); }
  c.beginPath(); c.arc(0, 0, .47, 0, TAU); c.lineWidth = .04; c.strokeStyle = C.rgba(C.light(col, .4), .5); c.stroke();
};
G.floret = (c, r, col) => {
  c.fillStyle = C.light(col, .35); rr(c, -.09, 0, .18, .5, .06); c.fill();
  const pts = []; for (let i = 0; i < 11; i++) { const a = r() * TAU, d = r() * .22; pts.push([Math.cos(a) * d, -.1 + Math.sin(a) * d * .8]); }
  pts.sort((a, b) => a[1] - b[1]).forEach(p => ball(c, p[0], p[1], .16 + r() * .05, C.mix(col, C.dark(col, .2), r()), .35, .4));
  if (C.lum(col) < .5) scatterDots(c, r, 25, .32, .01, .02, [C.dark(col, .45)], [.3, .6], false);
};
EXT.floret = 1.2;
G.kale = (c, r, col) => {
  c.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU; const rad = .44 + .06 * Math.sin(a * 17) + .04 * Math.sin(a * 5); const x = Math.cos(a) * rad, y = Math.sin(a) * rad * .8; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.closePath(); c.fillStyle = litFill(c, col, .5, .25, .35); c.fill(); c.strokeStyle = C.rgba(C.light(col, .45), .55); c.lineWidth = .04; c.beginPath(); c.moveTo(-.45, .05); c.quadraticCurveTo(0, -.05, .42, 0); c.stroke();
};
G.bokchoy = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, -.08); c.quadraticCurveTo(-.1, -.14, .05, -.2); c.lineTo(.05, .2); c.quadraticCurveTo(-.1, .14, -.5, .08); c.closePath();
  c.fillStyle = linFill(c, '#e8f0d0', .3, .15); c.fill();
  c.beginPath(); c.ellipse(.24, 0, .28, .3, 0, 0, TAU); c.fillStyle = litFill(c, col, .3, .25, .35); c.fill();
  c.strokeStyle = 'rgba(235,245,210,.55)'; c.lineWidth = .02; c.beginPath(); c.moveTo(0, 0); c.lineTo(.48, 0); for (let i = 0; i < 3; i++) { c.moveTo(.1 + i * .1, 0); c.lineTo(.16 + i * .1, -.18); c.moveTo(.1 + i * .1, 0); c.lineTo(.16 + i * .1, .18); } c.stroke();
};
EXT.bokchoy = 1.2;
G.kernel = (c, r, col) => { rr(c, -.4, -.38, .8, .76, .22); c.fillStyle = litFill(c, col, .45, .35, .3); c.fill(); glint(c, 0, 0, .4, .55); };
G.edamame = (c, r, col) => { c.beginPath(); c.ellipse(0, 0, .5, .36, 0, 0, TAU); c.fillStyle = litFill(c, col, .5, .35, .35); c.fill(); glint(c, 0, 0, .45, .45); };
G.pod = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, 0); c.bezierCurveTo(-.3, -.2, .3, -.2, .5, -.02); c.bezierCurveTo(.3, .16, -.3, .16, -.5, 0); c.fillStyle = linFill(c, col, .3, .3); c.fill();
  for (let i = -1; i <= 2; i++) { c.beginPath(); c.ellipse(i * .18 - .08, -.02, .08, .07, 0, 0, TAU); c.fillStyle = C.rgba(C.light(col, .3), .45); c.fill(); }
  c.strokeStyle = C.dark(col, .3); c.lineWidth = .025; c.beginPath(); c.moveTo(.48, -.02); c.lineTo(.56, -.08); c.stroke();
};
EXT.pod = 1.3;
G.sprout = (c, r, col) => {
  strokeTrip(c, () => { c.beginPath(); c.moveTo(-.5, .1); c.quadraticCurveTo(0, -.12 + (r() - .5) * .2, .42, -.06); }, .065, col, .6);
  c.beginPath(); c.ellipse(.45, -.07, .08, .055, -.3, 0, TAU); c.fillStyle = '#e9e19a'; c.fill();
};
EXT.sprout = 1.3;
G.avslice = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, .12); c.quadraticCurveTo(0, -.52, .5, .12); c.quadraticCurveTo(0, -.1, -.5, .12); c.closePath();
  const g = c.createLinearGradient(0, .1, 0, -.3); g.addColorStop(0, '#eef0b0'); g.addColorStop(.55, '#bcd46a'); g.addColorStop(1, '#6f9a34'); c.fillStyle = g; c.fill();
  c.beginPath(); c.moveTo(-.5, .12); c.quadraticCurveTo(0, -.52, .5, .12); c.lineWidth = .05; c.strokeStyle = '#34501c'; c.stroke();
};
EXT.avslice = 1.2;
G.avcube = (c, r, col) => { rr(c, -.4, -.4, .8, .8, .14); const g = c.createLinearGradient(-.4, -.4, .4, .4); g.addColorStop(0, '#eef0b4'); g.addColorStop(.6, '#c2d66c'); g.addColorStop(1, '#88ad44'); c.fillStyle = g; c.fill(); };
G.cuke = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = '#2e5a24'; c.fill();
  c.beginPath(); c.arc(0, 0, .45, 0, TAU); c.fillStyle = litFill(c, '#cfe3a0', .45, .25, .15); c.fill();
  c.beginPath(); c.arc(0, 0, .27, 0, TAU); c.fillStyle = '#e4efc6'; c.fill();
  c.fillStyle = 'rgba(250,250,230,.9)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.ellipse(Math.cos(a) * .17, Math.sin(a) * .17, .05, .028, a, 0, TAU); c.fill(); }
};
G.accordion = (c, r, col) => {
  rr(c, -.5, -.26, 1, .52, .1); c.fillStyle = '#d3e5a8'; c.fill();
  c.fillStyle = '#2e5a24'; c.fillRect(-.5, -.26, 1, .06); c.fillRect(-.5, .2, 1, .06);
  c.strokeStyle = 'rgba(40,70,30,.45)'; c.lineWidth = .025; for (let x = -.4; x < .45; x += .1) { c.beginPath(); c.moveTo(x, -.2); c.lineTo(x + .02, .2); c.stroke(); }
  c.fillStyle = 'rgba(255,255,240,.3)'; c.fillRect(-.45, -.14, .9, .06);
};
EXT.accordion = 1.2;
G.radish = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = col; c.fill();
  c.beginPath(); c.arc(0, 0, .43, 0, TAU); c.fillStyle = litFill(c, '#f8f1ee', .43, .3, .1); c.fill();
  c.strokeStyle = C.rgba(col, .18); c.lineWidth = .02; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * .4, Math.sin(a) * .4); c.stroke(); }
};
G.cabbage = (c, r, col) => { c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const oy = (i - 1) * .13, k1 = (r() - .5) * .6, k2 = (r() - .5) * .3, len = .3 + r() * .2; const cc = r() < .25 ? '#b9cf86' : C.mix(col, '#fbf9ee', r() * .6);
  const path = () => { c.beginPath(); c.moveTo(-len, oy); c.quadraticCurveTo(0, oy + k1, len, oy + k2); };
  path(); c.lineWidth = .075; c.strokeStyle = C.rgba(C.dark(cc, .35), .45); c.stroke(); path(); c.lineWidth = .055; c.strokeStyle = cc; c.stroke(); c.save(); c.translate(LX * .012, LY * .012); path(); c.lineWidth = .016; c.strokeStyle = 'rgba(255,255,250,.8)'; c.stroke(); c.restore(); } };
G.citrus = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = C.dark(col, .05); c.fill();
  c.beginPath(); c.arc(0, 0, .44, 0, TAU); c.fillStyle = '#fbf6e2'; c.fill();
  for (let i = 0; i < 9; i++) { const a0 = i / 9 * TAU + .06, a1 = (i + 1) / 9 * TAU - .06; c.beginPath(); c.moveTo(Math.cos((a0 + a1) / 2) * .05, Math.sin((a0 + a1) / 2) * .05); c.arc(0, 0, .39, a0, a1); c.closePath(); c.fillStyle = C.light(col, .3); c.fill(); }
  glint(c, 0, 0, .45, .35);
};
G.zest = (c, r, col) => { c.lineCap = 'round'; for (let i = 0; i < 6; i++) { c.save(); c.translate((r() - .5) * .7, (r() - .5) * .7); c.rotate(r() * TAU); c.strokeStyle = C.mix(col, C.light(col, .3), r()); c.lineWidth = .035; c.beginPath(); c.moveTo(-.12, 0); c.quadraticCurveTo(0, -.1, .12, .02); c.stroke(); c.restore(); } };
G.olive = (c, r, col) => { c.beginPath(); c.ellipse(0, 0, .5, .38, 0, 0, TAU); c.fillStyle = litFill(c, col, .5, .3, .45); c.fill(); c.beginPath(); c.ellipse(.12, 0, .12, .1, 0, 0, TAU); c.fillStyle = C.dark(col, .6); c.fill(); glint(c, 0, 0, .5, .5); };
G.oring = (c, r, col) => { G.ring(c, r, col, { inner: .22 }); c.beginPath(); c.arc(0, 0, .2, 0, TAU); c.fillStyle = '#c8402c'; c.fill(); };
G.caper = (c, r, col) => { ball(c, 0, 0, .5, col, .3, .45); scatterDots(c, r, 8, .4, .02, .04, [C.light(col, .3)], [.3, .5], false); };
G.parm = (c, r, col) => { blobPath(c, .5, r, 6, .4, 1, .45); c.fillStyle = C.rgba(col, .92); c.fill(); c.strokeStyle = 'rgba(255,255,250,.6)'; c.lineWidth = .03; c.stroke(); };
G.feta = (c, r, col) => { blobPath(c, .45, r, 7, .25); c.fillStyle = litFill(c, col, .45, .3, .15); c.fill(); scatterDots(c, r, 10, .35, .02, .05, ['#e8e2d2'], [.5, .8], false); };
G.melt = (c, r, col) => { blobPath(c, .5, r, 11, .3); c.fillStyle = litFill(c, col, .5, .35, .2); c.fill(); scatterDots(c, r, 14, .38, .03, .07, ['#c98a3a', '#b8742a'], [.35, .7], false); };
G.cheeseslice = (c, r, col) => { rr(c, -.45, -.45, .9, .9, .05); c.fillStyle = litFill(c, col, .6, .2, .15); c.fill(); };
G.roe = (c, r, col) => { for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .42; ball(c, Math.cos(a) * d, Math.sin(a) * d, .07, '#1d1d22', .55, .3); } };
G.sesame = (c, r, col) => { c.beginPath(); c.moveTo(-.5, 0); c.quadraticCurveTo(0, -.34, .5, 0); c.quadraticCurveTo(0, .34, -.5, 0); c.fillStyle = litFill(c, col, .5, .3, .2); c.fill(); };
G.nut = (c, r, col) => { c.beginPath(); c.ellipse(0, 0, .5, .34, 0, 0, TAU); c.fillStyle = litFill(c, col, .5, .3, .35); c.fill(); c.strokeStyle = C.rgba(C.dark(col, .3), .45); c.lineWidth = .03; c.beginPath(); c.moveTo(-.4, 0); c.lineTo(.4, 0); c.stroke(); };
G.almond = (c, r, col) => { c.beginPath(); c.moveTo(-.5, 0); c.quadraticCurveTo(-.1, -.38, .5, 0); c.quadraticCurveTo(-.1, .38, -.5, 0); c.fillStyle = litFill(c, col, .5, .3, .35); c.fill(); };
G.coco = (c, r, col) => { c.beginPath(); c.moveTo(-.5, .05); c.quadraticCurveTo(0, -.28, .5, 0); c.quadraticCurveTo(0, -.12, -.5, .05); c.fillStyle = '#fbf7ec'; c.fill(); c.strokeStyle = 'rgba(160,130,100,.4)'; c.lineWidth = .02; c.stroke(); };
G.chia = (c, r, col) => { for (let i = 0; i < 40; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .48; c.fillStyle = ['#3a3530', '#1f1c1a', '#7a7068', '#b8aea0'][Math.floor(r() * 4)]; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, .035, .024, r() * 3, 0, TAU); c.fill(); } };
G.poppy = (c, r, col) => scatterDots(c, r, 40, .5, .015, .03, ['#2c3140', '#1f2330', '#454b5c'], [.8, 1], false);
G.oat = (c, r, col) => { blobPath(c, .5, r, 7, .3, 1, .75); c.fillStyle = linFill(c, col, .3, .2); c.fill(); c.strokeStyle = C.rgba(C.dark(col, .2), .3); c.lineWidth = .03; c.stroke(); };
G.banana = (c, r, col) => {
  blobPath(c, .5, r, 12, .04); c.fillStyle = litFill(c, col, .5, .3, .15); c.fill();
  c.beginPath(); c.arc(0, 0, .3, 0, TAU); c.strokeStyle = 'rgba(210,190,130,.35)'; c.lineWidth = .03; c.stroke();
  c.fillStyle = 'rgba(110,80,50,.55)'; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; c.beginPath(); c.ellipse(Math.cos(a) * .06, Math.sin(a) * .06, .035, .02, a, 0, TAU); c.fill(); }
};
G.blueberry = (c, r, col) => { ball(c, 0, 0, .5, '#2f3a6a', .35, .45); c.fillStyle = 'rgba(190,200,230,.25)'; c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fill(); c.strokeStyle = '#1a1f38'; c.lineWidth = .05; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * .12, Math.sin(a) * .12); c.stroke(); } };
G.raspberry = (c, r, col) => { const pts = []; for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .32; pts.push([Math.cos(a) * d, Math.sin(a) * d]); } pts.sort((a, b) => a[1] - b[1]).forEach(p => ball(c, p[0], p[1], .15, '#c8243f', .4, .4)); };
G.berry = (c, r, col) => (r() < .5 ? G.blueberry : G.raspberry)(c, r, col);
G.lingon = (c, r, col) => { ball(c, 0, 0, .5, '#c81d25', .45, .4); glint(c, 0, 0, .5, .6); };
G.apple = (c, r, col) => {
  c.beginPath(); c.moveTo(-.5, .1); c.quadraticCurveTo(0, -.5, .5, .1); c.quadraticCurveTo(0, -.12, -.5, .1); c.closePath();
  c.fillStyle = linFill(c, '#f3e6bf', .3, .15); c.fill(); c.beginPath(); c.moveTo(-.5, .1); c.quadraticCurveTo(0, -.5, .5, .1); c.lineWidth = .06; c.strokeStyle = '#b3342a'; c.stroke();
};
EXT.apple = 1.2;
G.jam = (c, r, col) => { blobPath(c, .5, r, 8, .15); c.fillStyle = litFill(c, col, .5, .3, .35); c.fill(); glint(c, 0, 0, .5, .7); };
G.ice = (c, r, col) => {
  rr(c, -.45, -.45, .9, .9, .16); c.fillStyle = 'rgba(232,242,248,.42)'; c.fill(); c.lineWidth = .05; c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = .025; c.beginPath(); c.moveTo(-.2, -.3); c.lineTo(.1, 0); c.lineTo(.3, -.1); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-.25, -.28, .12, .05, -.6, 0, TAU); c.fill();
};
G.pearl = (c, r, col) => { blobPath(c, .5, r, 6, .3); c.fillStyle = litFill(c, '#fbfaf5', .5, .2, .12); c.fill(); };
G.patty = (c, r, col) => {
  blobPath(c, .5, r, 14, .04); c.fillStyle = litFill(c, col, .5, .2, .45); c.fill();
  scatterDots(c, r, 40, .42, .02, .05, [C.dark(col, .35), C.light(col, .2), C.dark(col, .55)], [.3, .7], false);
  glint(c, 0, 0, .5, .35);
};
G.meatball = (c, r, col) => { ball(c, 0, 0, .5, col, .25, .5); scatterDots(c, r, 18, .38, .025, .05, [C.dark(col, .4), C.light(col, .2)], [.3, .6], false); glint(c, 0, 0, .5, .4); };
G.filet = (c, r, col) => {
  blobPath(c, .5, r, 9, .15, 1, .42); c.fillStyle = litFill(c, col, .5, .3, .5); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .45), .35); c.lineWidth = .02; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-.4 + i * .18, -.12); c.lineTo(-.34 + i * .18, .12); c.stroke(); }
};
EXT.filet = 1.2;
G.pulled = (c, r, col) => { c.lineCap = 'round'; for (let i = 0; i < 12; i++) { c.strokeStyle = C.mix(col, C.dark(col, .35), r()); c.lineWidth = .04 + r() * .03; const y = (r() - .5) * .5; c.beginPath(); c.moveTo(-.45, y); c.quadraticCurveTo(0, y + (r() - .5) * .3, .45, y + (r() - .5) * .2); c.stroke(); } };
EXT.pulled = 1.2;
G.shrimp = (c, r, col) => {
  const segs = 6;
  for (let i = segs - 1; i >= 0; i--) { const a = Math.PI * (.95 + i * .23); const x = Math.cos(a) * .3, y = Math.sin(a) * .3 + .05; const rad = .17 - i * .015;
    ball(c, x, y, rad, i % 2 ? '#f29a7c' : '#ef8a6c', .4, .3); c.strokeStyle = 'rgba(255,240,230,.7)'; c.lineWidth = .025; c.beginPath(); c.arc(x, y, rad * .8, a - 1.2, a + 1.2); c.stroke(); }
  c.fillStyle = '#e46a50'; c.beginPath(); const ta = Math.PI * (.95 + segs * .23); const tx = Math.cos(ta) * .3, ty = Math.sin(ta) * .3 + .05; c.moveTo(tx, ty); c.lineTo(tx + .18, ty - .1); c.lineTo(tx + .16, ty + .1); c.fill();
};
G.sausage = (c, r, col) => { rr(c, -.5, -.16, 1, .32, .16); c.fillStyle = (() => { const g = c.createLinearGradient(0, -.16, 0, .16); g.addColorStop(0, C.light(col, .25)); g.addColorStop(.5, col); g.addColorStop(1, C.dark(col, .4)); return g; })(); c.fill(); c.fillStyle = C.light(col, .35); c.beginPath(); c.ellipse(.44, 0, .05, .14, 0, 0, TAU); c.fill(); };
EXT.sausage = 1.3;
G.chorizo = (c, r, col) => { c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = litFill(c, col, .5, .2, .4); c.fill(); scatterDots(c, r, 14, .38, .03, .06, ['#f0c9a8', '#e9b28e'], [.6, .9], false); c.beginPath(); c.arc(0, 0, .48, 0, TAU); c.lineWidth = .05; c.strokeStyle = C.dark(col, .4); c.stroke(); };
G.mince = (c, r, col) => { for (let i = 0; i < 6; i++) { c.save(); c.translate((r() - .5) * .55, (r() - .5) * .55); blobPath(c, .13 + r() * .08, r, 6, .35); c.fillStyle = litFill(c, C.mix(col, C.dark(col, .3), r()), .2, .25, .35); c.fill(); c.restore(); } };
G.crumble = (c, r, col) => { for (let i = 0; i < 5; i++) { c.save(); c.translate((r() - .5) * .5, (r() - .5) * .5); blobPath(c, .15 + r() * .1, r, 7, .3); c.fillStyle = litFill(c, C.mix(col, C.light(col, .2), r()), .25, .3, .25); c.fill(); c.restore(); } };
G.pothalf = (c, r, col) => { c.beginPath(); c.ellipse(0, 0, .5, .4, 0, 0, TAU); c.fillStyle = '#b98a52'; c.fill(); c.beginPath(); c.ellipse(0, 0, .46, .36, 0, 0, TAU); c.fillStyle = litFill(c, col, .46, .3, .15); c.fill(); };
G.dab = (c, r, col) => { blobPath(c, .5, r, 9, .3); c.fillStyle = C.rgba(col, .88); c.fill(); glint(c, 0, 0, .45, .35); };
G.ginger = (c, r, col) => G.shred(c, r, col, { n: 2, w: .05 });
G.bacon = (c, r, col) => { rr(c, -.5, -.14, 1, .28, .06); c.fillStyle = col; c.fill(); c.fillStyle = 'rgba(245,215,190,.7)'; c.fillRect(-.5, -.03, 1, .06); };
EXT.bacon = 1.2;

/* ---------- composite glyphs (whole things that fall as one) ---------- */
G.nest = (c, r, col, v) => {
  const n = v.n || 70, w = v.w || .026, wavy = v.wavy || 0;
  const strands = [];
  for (let i = 0; i < n; i++) {
    const r0 = .06 + Math.pow(r(), .8) * .36, a0 = r() * TAU, len = 1.1 + r() * 2.4, dir = r() < .5 ? 1 : -1, ph = r() * 9, dr = (r() - .5) * .34, amp = .03 + r() * .06, fq = 2 + r() * 5;
    const pts = [];
    for (let k = 0; k <= 40; k++) { const t = k / 40, a = a0 + dir * len * t; let rad = r0 + dr * t + Math.sin(t * fq + ph) * amp + (wavy ? Math.sin(t * 60 + ph) * wavy : 0); rad = Math.max(.02, Math.min(.48, rad)); pts.push([Math.cos(a) * rad, Math.sin(a) * rad * .94]); }
    strands.push(pts);
  }
  strands.sort((a, b) => Math.hypot(...b[18]) - Math.hypot(...a[18]));
  for (const pts of strands) {
    let cc = C.mix(col, C.light(col, .15), r()); if (v.coat) cc = C.mix(cc, v.coat, v.coatK || .3);
    strokeTrip(c, () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); }, w, cc, .5);
  }
};
EXT.nest = 1.1;
G.ricepile = (c, r, col, v) => {
  const g = c.createRadialGradient(0, 0, .1, 0, 0, .5); g.addColorStop(0, C.rgba(C.dark(col, .25), .5)); g.addColorStop(.85, C.rgba(C.dark(col, .3), .35)); g.addColorStop(1, C.rgba(C.dark(col, .3), 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fill();
  const n = (v && v.n) || 2400;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.pow(r(), .62) * .47;
    const x = Math.cos(a) * d, y = Math.sin(a) * d; const shade = (x * LX + y * LY) * .5 - d * .45 + (r() - .5) * .25;
    const gc = shade > 0 ? C.light(col, shade * .7) : C.dark(col, -shade * .45);
    c.save(); c.translate(x, y); c.rotate(r() * TAU);
    c.fillStyle = C.dark(gc, .28); c.beginPath(); c.ellipse(.002, .003, .017, .0065, 0, 0, TAU); c.fill();
    c.fillStyle = gc; c.beginPath(); c.ellipse(0, 0, .016, .0055, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,250,.55)'; c.beginPath(); c.ellipse(-.003, -.0015, .008, .0018, 0, 0, TAU); c.fill();
    c.restore();
  }
};
G.pancakes = (c, r, col) => {
  const spots = [[-.2, -.18], [.2, -.16], [-.18, .2], [.22, .2], [0, 0]];
  for (const [x, y] of spots) {
    c.save(); c.translate(x, y); blobPath(c, .25, r, 14, .04);
    const g = c.createRadialGradient(0, 0, .02, 0, 0, .26); g.addColorStop(0, '#b9722f'); g.addColorStop(.7, '#d49a4c'); g.addColorStop(1, '#e8c07c'); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(120,70,30,.25)'; c.lineWidth = .01; c.stroke();
    scatterDots(c, r, 20, .2, .008, .02, ['#8d5222', '#e9c888'], [.3, .6], false); c.restore();
  }
};
G.raggmunk = (c, r, col) => {
  blobPath(c, .5, r, 16, .08); c.fillStyle = litFill(c, '#d69a44', .5, .25, .35); c.fill();
  c.save(); c.clip(); c.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const a = r() * TAU, d = r() * .5; const x = Math.cos(a) * d, y = Math.sin(a) * d; const ang = r() * TAU;
    c.strokeStyle = r() < .5 ? 'rgba(245,215,150,.7)' : 'rgba(120,60,20,.55)'; c.lineWidth = .012 + r() * .012; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * .12, y + Math.sin(ang) * .12); c.stroke(); }
  c.restore(); c.lineWidth = .03; c.strokeStyle = 'rgba(90,45,15,.6)'; blobPath(c, .49, r, 16, .08); c.stroke();
};
G.cake = (c, r, col, v) => {
  const kind = v.kind;
  if (kind === 'tosca') {
    c.beginPath(); c.arc(0, 0, .5, 0, TAU); c.fillStyle = '#c98a45'; c.fill();
    c.beginPath(); c.arc(0, 0, .47, 0, TAU); c.fillStyle = litFill(c, '#b5692a', .47, .3, .3); c.fill();
    for (let i = 0; i < 90; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .43; c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.rotate(r() * TAU); c.scale(.07, .07); (r() < .6 ? G.almond : G.nut)(c, r, r() < .5 ? '#d8b27a' : '#c89660'); c.restore(); }
    c.fillStyle = 'rgba(255,230,180,.25)'; c.beginPath(); c.ellipse(-.15, -.18, .2, .08, -.6, 0, TAU); c.fill();
  } else if (kind === 'kladd') {
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, .5, -.2, TAU - .85); c.closePath(); const g = c.createRadialGradient(-.1, -.1, .05, 0, 0, .5); g.addColorStop(0, '#4a2a1d'); g.addColorStop(.8, '#3a1f15'); g.addColorStop(1, '#2a150e'); c.fillStyle = g; c.fill(); c.save(); c.clip();
    c.strokeStyle = 'rgba(160,110,80,.45)'; c.lineWidth = .012;
    for (let i = 0; i < 22; i++) { let x = (r() - .5) * .7, y = (r() - .5) * .7; if (Math.hypot(x, y) > .42) continue; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * .12; y += (r() - .5) * .12; c.lineTo(x, y); } c.stroke(); }
    c.fillStyle = 'rgba(255,240,220,.12)'; c.beginPath(); c.ellipse(-.12, -.2, .22, .08, -.5, 0, TAU); c.fill();
    c.restore(); c.lineCap = 'round'; c.lineWidth = .03; c.strokeStyle = '#24110b'; c.beginPath(); c.moveTo(Math.cos(-.2) * .5, Math.sin(-.2) * .5); c.lineTo(0, 0); c.lineTo(Math.cos(-.85) * .5, Math.sin(-.85) * .5); c.stroke();
  } else if (kind === 'mug') {
    blobPath(c, .5, r, 12, .05); const g = c.createRadialGradient(-.08, -.1, .02, 0, 0, .52); g.addColorStop(0, '#8a5a3a'); g.addColorStop(.55, '#5e3825'); g.addColorStop(1, '#3a2016'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); for (let i = 0; i < 160; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .46; c.fillStyle = r() < .6 ? 'rgba(30,14,8,.55)' : 'rgba(170,120,85,.45)'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, .008 + r() * .016, 0, TAU); c.fill(); } c.restore();
    c.strokeStyle = 'rgba(40,20,10,.7)'; c.lineWidth = .025; c.lineCap = 'round'; c.beginPath(); c.moveTo(-.2, .05); c.quadraticCurveTo(0, -.06, .18, .02); c.stroke(); c.strokeStyle = 'rgba(190,140,100,.35)'; c.lineWidth = .012; c.beginPath(); c.moveTo(-.19, .03); c.quadraticCurveTo(0, -.08, .17, 0); c.stroke();
  }
};
G.loaf = (c, r, col) => {
  rr(c, -.5, -.3, 1, .6, .16); c.fillStyle = linFill(c, '#9a5a2a', .25, .35); c.fill();
  c.beginPath(); c.moveTo(-.38, 0); c.bezierCurveTo(-.2, -.07, .2, .07, .38, 0); c.lineWidth = .09; c.strokeStyle = '#d9a660'; c.lineCap = 'round'; c.stroke();
  c.lineWidth = .025; c.strokeStyle = 'rgba(70,35,10,.5)'; c.stroke();
  scatterDots(c, r, 30, .45, .01, .02, ['#6e3b18', '#c58a4c'], [.3, .6], false);
};
EXT.loaf = 1.2;
G.bun = (c, r, col, v) => {
  c.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; const rad = .5 + (i % 2 ? .0 : .02); i ? c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath();
  c.fillStyle = '#efe4cf'; c.fill(); c.strokeStyle = 'rgba(160,140,110,.4)'; c.lineWidth = .015; c.stroke();
  blobPath(c, .42, r, 10, .06); c.fillStyle = litFill(c, '#d8994a', .42, .3, .35); c.fill();
  c.beginPath(); for (let t = 0; t < 1; t += .01) { const a = t * TAU * 2.6, rad = .03 + t * .34; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  c.lineWidth = .05; c.strokeStyle = v && v.vanilla ? 'rgba(240,215,160,.9)' : 'rgba(120,58,22,.75)'; c.lineCap = 'round'; c.stroke();
  for (let i = 0; i < 10; i++) { const a = r() * TAU, d = r() * .33; c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d); c.scale(.06, .06); G.pearl(c, r, '#fff'); c.restore(); }
};
G.muffin = (c, r, col) => {
  c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; const rad = .5 + (i % 2 ? 0 : .025); i ? c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); c.fillStyle = '#e9ddc8'; c.fill();
  blobPath(c, .44, r, 11, .07); c.fillStyle = litFill(c, '#c98a45', .44, .38, .35); c.fill();
  c.strokeStyle = 'rgba(245,215,160,.7)'; c.lineWidth = .025; for (let i = 0; i < 4; i++) { const a = r() * TAU; c.beginPath(); c.moveTo(Math.cos(a) * .05, Math.sin(a) * .05); c.quadraticCurveTo(Math.cos(a + .3) * .15, Math.sin(a + .3) * .15, Math.cos(a) * .28, Math.sin(a) * .28); c.stroke(); }
};
G.cookie = (c, r, col, v) => {
  blobPath(c, .5, r, 14, .04); c.fillStyle = litFill(c, '#e9c98c', .5, .3, .25); c.fill();
  c.strokeStyle = 'rgba(190,140,70,.45)'; c.lineWidth = .04; c.stroke();
  if (v && v.jam) { c.save(); c.scale(.4, .4); G.jam(c, r, '#9e1b2c'); c.restore(); }
  else { scatterDots(c, r, 45, .5, .01, .02, ['#2c3140', '#454b5c'], [.8, 1], false); c.save(); c.scale(.5, .5); G.zest(c, r, '#f2d33a'); c.restore(); }
};
G.toast = (c, r, col, v) => {
  c.beginPath(); c.moveTo(-.42, .45); c.lineTo(-.42, -.2); c.bezierCurveTo(-.5, -.52, .5, -.52, .42, -.2); c.lineTo(.42, .45); c.closePath();
  c.fillStyle = '#9b6230'; c.fill();
  c.save(); c.translate(0, .02); c.scale(.9, .9); c.beginPath(); c.moveTo(-.42, .45); c.lineTo(-.42, -.2); c.bezierCurveTo(-.5, -.52, .5, -.52, .42, -.2); c.lineTo(.42, .45); c.closePath();
  c.fillStyle = litFill(c, v && v.golden ? '#d9a55a' : '#e6c58e', .5, .25, .25); c.fill(); c.restore();
  scatterDots(c, r, 30, .35, .01, .025, ['rgba(120,70,30,.5)', 'rgba(255,240,210,.6)'], [.4, .8], false);
  if (v && v.top === 'bruschetta') { for (let i = 0; i < 9; i++) { c.save(); c.translate((r() - .5) * .55, (r() - .5) * .55); c.rotate(r() * TAU); c.scale(.16, .16); G.tdice(c, r, '#d9402a'); c.restore(); } for (let i = 0; i < 4; i++) { c.save(); c.translate((r() - .5) * .5, (r() - .5) * .5); c.rotate(r() * TAU); c.scale(.14, .14); G.shred(c, r, '#3f8a2d', { w: .12 }); c.restore(); } }
  if (v && v.top === 'cinnamon') { scatterDots(c, r, 140, .45, .006, .016, ['#8a4b22', '#f6f0e2', '#a8612d'], [.5, .95], false); }
};
EXT.toast = 1.2;
G.sandwich = (c, r, col) => {
  const half = () => {
    c.beginPath(); c.moveTo(-.42, -.4); c.lineTo(.4, .42); c.lineTo(-.42, .42); c.closePath(); c.fillStyle = '#8f5a2c'; c.fill();
    c.beginPath(); c.moveTo(-.37, -.28); c.lineTo(.28, .37); c.lineTo(-.37, .37); c.closePath(); c.fillStyle = litFill(c, '#d69e58', .5, .3, .3); c.fill();
    c.save(); c.clip(); c.strokeStyle = 'rgba(85,42,15,.28)'; c.lineWidth = .035; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(-.5 + k * .15, -.5); c.lineTo(.5 + k * .15, .5); c.stroke(); } c.restore();
    c.lineCap = 'round'; c.lineWidth = .026; c.strokeStyle = '#3f6b2a'; c.beginPath(); c.moveTo(-.41, -.37); c.lineTo(.38, .42); c.stroke();
    c.lineWidth = .018; c.strokeStyle = '#98b552'; c.beginPath(); c.moveTo(-.43, -.34); c.lineTo(.35, .44); c.stroke();
    c.lineWidth = .012; c.strokeStyle = '#ead28a'; c.beginPath(); c.moveTo(-.45, -.31); c.lineTo(.32, .46); c.stroke();
  };
  c.save(); c.translate(-.07, .05); half(); c.restore();
  c.save(); c.translate(.07, -.05); c.rotate(Math.PI); half(); c.restore();
};
EXT.sandwich = 1.3;
G.stuffed = (c, r, col) => {
  c.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU; const rad = .5 - .045 * Math.pow(Math.abs(Math.sin(a * 2)), .5); i ? c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath();
  c.fillStyle = litFill(c, col, .5, .3, .4); c.fill();
  c.beginPath(); c.arc(0, 0, .38, 0, TAU); c.fillStyle = '#6b3d22'; c.fill();
  for (let i = 0; i < 10; i++) { c.save(); c.translate((r() - .5) * .5, (r() - .5) * .5); c.scale(.07, .07); G.kernel(c, r, '#f2c53a'); c.restore(); }
  c.save(); c.scale(.66, .6); G.melt(c, r, '#f1d27a'); c.restore(); glint(c, 0, 0, .5, .35);
};
G.mashswirl = (c, r, col) => { c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a0 = r() * TAU, rad = .1 + r() * .35; c.beginPath(); c.arc(0, 0, rad, a0, a0 + 1 + r() * 2); c.lineWidth = .05; c.strokeStyle = C.rgba(C.dark(col, .15), .35); c.stroke(); c.save(); c.translate(LX * .015, LY * .015); c.lineWidth = .025; c.strokeStyle = C.rgba(C.light(col, .7), .8); c.stroke(); c.restore(); } };
G.butter = (c, r, col) => { rr(c, -.45, -.4, .9, .8, .12); c.fillStyle = litFill(c, '#f4dc84', .5, .35, .15); c.fill(); c.strokeStyle = 'rgba(250,230,150,.6)'; c.lineWidth = .1; c.stroke(); glint(c, 0, 0, .45, .7); };
G.foam = (c, r, col) => {
  blobPath(c, .5, r, 14, .08); c.fillStyle = litFill(c, col, .5, .35, .25); c.fill();
  c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a0 = r() * TAU, rad = .08 + r() * .34; c.beginPath(); c.arc(0, 0, rad, a0, a0 + 1.2 + r() * 1.5); c.lineWidth = .05; c.strokeStyle = C.rgba(C.dark(col, .2), .4); c.stroke(); c.save(); c.translate(LX * .02, LY * .02); c.lineWidth = .025; c.strokeStyle = C.rgba(C.light(col, .5), .8); c.stroke(); c.restore(); }
};
G.crumbletop = (c, r, col) => {
  c.beginPath(); c.arc(0, 0, .47, 0, TAU); c.fillStyle = C.rgba(C.dark(col, .15), .8); c.fill();
  for (let i = 0; i < 1500; i++) { const a = r() * TAU, d = Math.pow(r(), .5) * .5; const x = Math.cos(a) * d, y = Math.sin(a) * d; const rad = .008 + r() * .014; const t = r();
    const cc = t < .25 ? C.dark(col, .3) : t < .75 ? col : C.light(col, .25);
    c.fillStyle = C.dark(cc, .35); c.beginPath(); c.arc(x + .003, y + .004, rad, 0, TAU); c.fill();
    c.fillStyle = cc; c.beginPath(); c.arc(x, y, rad * (.8 + r() * .3), 0, TAU); c.fill(); }
};
G.swirl = (c, r, col) => {
  c.lineCap = 'round'; const turns = 1.2 + r() * .5, ph = r() * 9; let px = null, py = null;
  for (let t = 0; t <= 1; t += .008) {
    const a = t * TAU * turns, rad = .05 + t * .4 + Math.sin(t * 13 + ph) * .025, x = Math.cos(a) * rad, y = Math.sin(a) * rad * .92;
    if (px !== null) { const w = .055 * (1 - t * .75) * (.75 + .25 * Math.sin(t * 21 + ph)); c.lineWidth = w; c.strokeStyle = C.rgba(col, .9); c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      c.lineWidth = w * .35; c.strokeStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(px + LX * w * .2, py + LY * w * .2); c.lineTo(x + LX * w * .2, y + LY * w * .2); c.stroke(); }
    px = x; py = y;
  }
};
G.drizzle = (c, r, col) => { c.lineCap = 'round'; c.beginPath(); let x = -.45, y = (r() - .5) * .3; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += .12; y += (r() - .5) * .25; c.lineTo(x, y); } c.lineWidth = .035; c.strokeStyle = C.rgba(col, .7); c.stroke(); c.lineWidth = .012; c.strokeStyle = 'rgba(255,250,220,.6)'; c.stroke(); };
G.oildrop = (c, r, col) => { blobPath(c, .5, r, 10, .2); c.fillStyle = C.rgba(col, .5); c.fill(); c.save(); c.clip(); c.fillStyle = 'rgba(255,245,200,.35)'; c.beginPath(); c.ellipse(LX * .2, LY * .2, .22, .1, Math.atan2(LY, LX) + 1.57, 0, TAU); c.fill(); c.restore(); };

/* ---------- whole ingredients (for the step films) ---------- */
G.wOnion = (c, r, col, v) => {
  const skin = col;
  c.beginPath(); c.moveTo(.46, 0); c.bezierCurveTo(.34, -.34, -.3, -.42, -.42, -.05); c.bezierCurveTo(-.46, .3, .2, .42, .46, 0); c.closePath();
  c.fillStyle = litFill(c, skin, .45, .3, .35); c.fill();
  c.strokeStyle = C.rgba(C.dark(skin, .4), .35); c.lineWidth = .012; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(.44, 0); c.quadraticCurveTo(0, i * .13, -.4, i * .06); c.stroke(); }
  c.strokeStyle = C.dark(skin, .3); c.lineWidth = .025; c.lineCap = 'round'; c.beginPath(); c.moveTo(.46, 0); c.lineTo(.56, -.03); c.stroke();
  c.strokeStyle = '#e8dcc0'; c.lineWidth = .01; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-.42, 0); c.lineTo(-.5, (i - 2.5) * .03); c.stroke(); }
  glint(c, 0, 0, .4, .35);
};
G.wGarlic = (c, r, col) => {
  c.beginPath(); c.moveTo(.42, 0); c.bezierCurveTo(.3, -.36, -.34, -.38, -.38, 0); c.bezierCurveTo(-.34, .38, .3, .36, .42, 0); c.fillStyle = litFill(c, '#f1ead9', .42, .3, .2); c.fill();
  c.strokeStyle = 'rgba(160,120,140,.4)'; c.lineWidth = .014; [-.22, -.08, .08, .22].forEach(y => { c.beginPath(); c.moveTo(.4, 0); c.quadraticCurveTo(0, y * 1.8, -.36, y * .4); c.stroke(); });
  c.strokeStyle = '#d9cfb4'; c.lineWidth = .03; c.lineCap = 'round'; c.beginPath(); c.moveTo(.42, 0); c.lineTo(.55, -.02); c.stroke();
};
G.wCarrot = (c, r, col) => {
  c.beginPath(); c.moveTo(-.34, -.09); c.quadraticCurveTo(.1, -.07, .5, -.005); c.lineTo(.5, .005); c.quadraticCurveTo(.1, .07, -.34, .09); c.quadraticCurveTo(-.38, 0, -.34, -.09); c.closePath();
  c.fillStyle = (() => { const g = c.createLinearGradient(0, -.09, 0, .09); g.addColorStop(0, C.light(col, .3)); g.addColorStop(.5, col); g.addColorStop(1, C.dark(col, .3)); return g; })(); c.fill();
  c.strokeStyle = C.rgba(C.dark(col, .4), .4); c.lineWidth = .008; for (let x = -.25; x < .4; x += .07) { c.beginPath(); c.moveTo(x, -.05 + x * .08); c.lineTo(x + .01, -.02); c.stroke(); }
  c.strokeStyle = '#4f8f36'; c.lineWidth = .018; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-.35, 0); c.quadraticCurveTo(-.45, (i - 2) * .05, -.55, (i - 2) * .09); c.stroke(); }
};
G.wRound = (c, r, col, v) => {
  const kind = (v && v.kind) || 'tomato';
  if (kind === 'lemon' || kind === 'lime') { c.beginPath(); c.ellipse(0, 0, .45, .34, 0, 0, TAU); c.fillStyle = litFill(c, col, .45, .35, .3); c.fill(); c.fillStyle = C.dark(col, .15); c.beginPath(); c.ellipse(.46, 0, .04, .03, 0, 0, TAU); c.ellipse(-.46, 0, .03, .025, 0, 0, TAU); c.fill(); scatterDots(c, r, 40, .4, .004, .008, [C.dark(col, .2)], [.2, .4], false); glint(c, 0, 0, .42, .5); return; }
  const R = kind === 'cabbage' ? .48 : .4; ball(c, 0, 0, R, col, .4, .4);
  if (kind === 'tomato') { c.fillStyle = '#3f7a2c'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a + .3) * .08, Math.sin(a + .3) * .08, Math.cos(a) * .15, Math.sin(a) * .15); } c.lineWidth = .04; c.strokeStyle = '#3f7a2c'; c.stroke(); glint(c, 0, 0, .4, .6); }
  if (kind === 'potato') { scatterDots(c, r, 7, .3, .012, .02, ['#8a6a3a'], [.5, .8], false); }
  if (kind === 'orange') { scatterDots(c, r, 60, .36, .004, .008, [C.dark(col, .2)], [.2, .4], false); c.fillStyle = '#6a8a3a'; c.beginPath(); c.arc(0, 0, .03, 0, TAU); c.fill(); }
  if (kind === 'apple') { c.strokeStyle = '#5a3a1f'; c.lineWidth = .03; c.beginPath(); c.moveTo(0, 0); c.lineTo(.05, -.12); c.stroke(); glint(c, 0, 0, .4, .5); }
  if (kind === 'cabbage') { c.strokeStyle = 'rgba(255,255,240,.5)'; c.lineWidth = .02; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a + .4) * .2, Math.sin(a + .4) * .2, Math.cos(a) * .45, Math.sin(a) * .45); c.stroke(); } }
};
G.wLong = (c, r, col, v) => {
  const kind = (v && v.kind) || 'cucumber', w = kind === 'chili' ? .07 : kind === 'leek' ? .1 : .14;
  c.beginPath(); c.moveTo(-.48, 0); c.bezierCurveTo(-.48, -w, .48, -w, .48, 0); c.bezierCurveTo(.48, w, -.48, w, -.48, 0);
  let g = c.createLinearGradient(0, -w, 0, w);
  if (kind === 'leek') { g = c.createLinearGradient(-.48, 0, .48, 0); g.addColorStop(0, '#f3f1e0'); g.addColorStop(.5, '#dfe8b8'); g.addColorStop(1, '#4e8a36'); }
  else { g.addColorStop(0, C.light(col, .3)); g.addColorStop(.5, col); g.addColorStop(1, C.dark(col, .35)); }
  c.fillStyle = g; c.fill();
  if (kind === 'cucumber' || kind === 'zucchini') { scatterDots(c, r, 30, .4, .004, .01, ['rgba(230,240,200,.6)'], [.5, .9], false); c.strokeStyle = 'rgba(230,245,210,.25)'; c.lineWidth = .02; c.beginPath(); c.moveTo(-.4, -w * .4); c.lineTo(.4, -w * .4); c.stroke(); }
  if (kind === 'aubergine' || kind === 'chili' || kind === 'zucchini') { c.fillStyle = '#4a7a2c'; c.beginPath(); c.ellipse(-.46, 0, .06, w * .9, 0, 0, TAU); c.fill(); c.strokeStyle = '#4a7a2c'; c.lineWidth = .03; c.beginPath(); c.moveTo(-.48, 0); c.lineTo(-.56, -.02); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(0, -w * .5, .3, w * .16, 0, 0, TAU); c.fill();
};
G.wPepper = (c, r, col) => {
  c.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU, rad = .42 - .05 * Math.abs(Math.sin(a * 1.5)); i ? c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath();
  c.fillStyle = litFill(c, col, .42, .35, .4); c.fill(); glint(c, 0, 0, .4, .55);
  c.fillStyle = '#4a7a2c'; c.beginPath(); c.arc(0, 0, .09, 0, TAU); c.fill(); c.strokeStyle = '#3b6624'; c.lineWidth = .05; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(.08, -.1); c.stroke();
};
G.wAvocado = (c, r, col) => {
  c.beginPath(); c.moveTo(.45, 0); c.bezierCurveTo(.42, -.34, -.1, -.3, -.3, -.22); c.bezierCurveTo(-.5, -.12, -.5, .12, -.3, .22); c.bezierCurveTo(-.1, .3, .42, .34, .45, 0); c.fillStyle = '#2f4a1c'; c.fill();
  c.save(); c.scale(.88, .84); c.beginPath(); c.moveTo(.45, 0); c.bezierCurveTo(.42, -.34, -.1, -.3, -.3, -.22); c.bezierCurveTo(-.5, -.12, -.5, .12, -.3, .22); c.bezierCurveTo(-.1, .3, .42, .34, .45, 0);
  const g = c.createRadialGradient(0, 0, .05, 0, 0, .45); g.addColorStop(0, '#eef0a8'); g.addColorStop(.7, '#c6d86a'); g.addColorStop(1, '#8db34a'); c.fillStyle = g; c.fill(); c.restore();
  ball(c, .02, 0, .15, '#7a4a2a', .35, .35); glint(c, .02, 0, .15, .5);
};
G.wHerb = (c, r, col) => { for (let i = 0; i < 7; i++) { c.save(); c.rotate((i - 3) * .14); c.translate(.1, 0); c.scale(.9, .9); (r() < .5 ? G.frond : G.leaf)(c, r, C.mix(col, C.dark(col, .2), r()), { w: .3 }); c.restore(); } c.strokeStyle = '#6a8a4a'; c.lineWidth = .03; c.beginPath(); c.moveTo(-.5, 0); c.lineTo(-.2, 0); c.stroke(); };
G.wGinger = (c, r, col) => { for (let i = 0; i < 4; i++) { c.save(); c.translate(-.2 + i * .14, (i % 2 ? -.08 : .06)); c.rotate(i * .6); blobPath(c, .16, r, 9, .15, 1.4, .9); c.fillStyle = litFill(c, '#d9b77a', .2, .25, .3); c.fill(); c.restore(); } };
G.wBlock = (c, r, col) => { rr(c, -.42, -.28, .84, .56, .06); c.fillStyle = litFill(c, col, .45, .3, .2); c.fill(); c.strokeStyle = C.rgba(C.dark(col, .3), .3); c.lineWidth = .015; c.stroke(); };
['wOnion', 'wCarrot', 'wLong', 'wHerb', 'wGinger', 'wAvocado'].forEach(g => EXT[g] = 1.35);
const WHOLE = {
  onion: ['wOnion', '#c98d4a'], shallot: ['wOnion', '#b77a5a'], redonion: ['wOnion', '#7d2d58'], friedonion: ['wOnion', '#c98d4a'], garlic: ['wGarlic'],
  carrot: ['wCarrot', '#e8792a'], carrotshred: ['wCarrot', '#e8792a'], parsnip: ['wCarrot', '#efe0bc'], beet: ['wRound', '#8a1d44', 'beet'],
  tomato: ['wRound', '#df3b25', 'tomato'], cherry: ['wRound', '#e2402a', 'tomato'], potato: ['wRound', '#d9b877', 'potato'], newpotato: ['wRound', '#e6cf93', 'potato'],
  lemon: ['wRound', '#f2d33a', 'lemon'], lemonslice: ['wRound', '#f2d33a', 'lemon'], lime: ['wRound', '#86b83c', 'lime'], orange: ['wRound', '#f39a2b', 'orange'], apple: ['wRound', '#c93a30', 'apple'], cabbage: ['wRound', '#d9e6b4', 'cabbage'],
  cucumber: ['wLong', '#3f7a2c', 'cucumber'], cucshred: ['wLong', '#3f7a2c', 'cucumber'], zucchini: ['wLong', '#5f9a3a', 'zucchini'], aubergine: ['wLong', '#3d1f3a', 'aubergine'], leek: ['wLong', '#dfe8b8', 'leek'], scallion: ['wLong', '#dfe8b8', 'leek'], chili: ['wLong', '#d4251c', 'chili'],
  redpepper: ['wPepper', '#d7342a'], yellowpepper: ['wPepper', '#f0bd2c'], greenpepper: ['wPepper', '#4f8d34'],
  avocado: ['wAvocado'], avocube: ['wAvocado'], parsley: ['wHerb', '#3c8a2b'], dill: ['wHerb', '#4c8a34'], basil: ['wHerb', '#3f8a2d'], coriander: ['wHerb', '#4a9a36'], chive: ['wHerb', '#4f9338'], freshherb: ['wHerb', '#577d33'], spinach: ['wHerb', '#2f6d2a'],
  ginger: ['wGinger'], tofu: ['wBlock', '#f1e3bf'], smokedtofu: ['wBlock', '#c99a62'], tofucrumble: ['wBlock', '#f1e3bf'], mushroom: ['mush', '#decab0'], shiitake: ['shiitake', '#6e4a30'], broccoli: ['floret', '#4a8a33'], cauli: ['floret', '#efe6cc']
};

/* ==========================================================================
   Ingredients → kinds
   ========================================================================== */
// g: glyph · col · n: count for a standard plate well · s: size · L: layer · liq: always tints the base · bl: tints the base when blended
const K = {
  onion: { g: 'bits', col: '#efe4c4', n: 6, s: .06, L: 2, bl: '#e9dcb0', fam: 'Gul lök' },
  friedonion: { g: 'onion', col: '#9c5a26', n: 14, s: .08, L: 4, v: { fried: 1 }, fam: 'Gul lök' },
  redonion: { g: 'onion', col: '#a3416f', n: 9, s: .075, L: 3, v: { raw: 1 }, fam: 'Rödlök' },
  shallot: { g: 'onion', col: '#dcb7a3', n: 8, s: .065, L: 2, fam: 'Schalottenlök' },
  garlic: { g: 'garlic', col: '#f3ead2', n: 7, s: .03, L: 3, fam: 'Vitlök' },
  scallion: { g: 'ring', col: '#86b955', n: 16, s: .032, L: 4, fam: 'Salladslök' },
  leek: { g: 'ring', col: '#cddd98', n: 11, s: .06, L: 2, bl: '#dfe3b0', fam: 'Purjolök' },
  chive: { g: 'ring', col: '#4f9338', n: 34, s: .017, L: 5, fam: 'Gräslök' },
  carrot: { g: 'coin', col: '#e8792a', n: 12, s: .055, L: 2, bl: '#e8792a', fam: 'Morötter' },
  carrotshred: { g: 'shred', col: '#ee8a33', n: 20, s: .075, L: 3, fam: 'Morötter' },
  beet: { g: 'shred', col: '#9e1f4c', n: 16, s: .075, L: 3, fam: 'Rödbetor' },
  celery: { g: 'crescent', col: '#b5ce7a', n: 10, s: .05, L: 2, fam: 'Selleri' },
  parsnip: { g: 'cube', col: '#efe6cc', n: 9, s: .05, L: 2, fam: 'Palsternacka' },
  potato: { g: 'potcube', col: '#eed691', n: 12, s: .065, L: 2, bl: '#efe2b8', fam: 'Potatis' },
  newpotato: { g: 'pothalf', col: '#f0dc9a', n: 9, s: .1, L: 2, fam: 'Potatis' },
  tomatopaste: { liq: ['#b43a1c', 2.2], fam: 'Tomatpuré' },
  canned: { g: 'tchunk', col: '#c53a22', n: 7, s: .05, L: 2, liq: ['#c23a21', 4], fam: 'Krossade tomater' },
  tomato: { g: 'tdice', col: '#df4a2e', n: 16, s: .042, L: 3, fam: 'Tomater' },
  cherry: { g: 'cherry', col: '#e2402a', n: 8, s: .06, L: 3, fam: 'Körsbärstomater' },
  cannedcherry: { g: 'cherry', col: '#d83a24', n: 8, s: .055, L: 3, liq: ['#c23a21', 3], fam: 'Körsbärstomater' },
  sundried: { g: 'sundried', col: '#8b2a1a', n: 7, s: .065, L: 3, fam: 'Soltorkade tomater' },
  redpepper: { g: 'strip', col: '#d7342a', n: 8, s: .08, L: 3, fam: 'Paprika' },
  yellowpepper: { g: 'strip', col: '#f0bd2c', n: 8, s: .08, L: 3, fam: 'Paprika' },
  greenpepper: { g: 'strip', col: '#4f8d34', n: 8, s: .08, L: 3, fam: 'Paprika' },
  chili: { g: 'chiliring', col: '#d4251c', n: 8, s: .028, L: 4, fam: 'Chili' },
  chiliflakes: { g: 'flakes', col: '#b72a18', n: 2, s: .1, L: 6, liq: ['#c0301a', .12] },
  sweetchili: { liq: ['#d9542a', .4] },
  paprikap: { g: 'dust', col: '#c9471e', n: 2, s: .11, L: 6, liq: ['#d0601c', 1.1] },
  curry: { g: 'dust', col: '#dca21f', n: 1, s: .1, L: 6, liq: ['#e1a421', 1.6] },
  turmeric: { liq: ['#e9ad1c', 1.8] },
  spice: { g: 'dust', col: '#8f6a45', n: 1, s: .09, L: 6 },
  cinnamon: { g: 'dust', col: '#8a4b22', n: 2, s: .11, L: 6 },
  pepper: { g: 'pepper', col: '#2a211c', n: 3, s: .16, L: 7 },
  driedherb: { g: 'herbspecks', col: '#6b7a3a', n: 3, s: .1, L: 6 },
  bay: { g: 'bay', col: '#8d9a58', n: 2, s: .09, L: 4 },
  clove: { g: 'clove', col: '#4a2a1a', n: 3, s: .03, L: 4 },
  juniper: { g: 'juniper', col: '#2d3450', n: 7, s: .022, L: 4 },
  basil: { g: 'basil', col: '#3f8a2d', n: 6, s: .065, L: 5, fam: 'Basilika' },
  parsley: { g: 'herbbits', col: '#3c8a2b', n: 12, s: .045, L: 5, fam: 'Persilja' },
  coriander: { g: 'herbbits', col: '#4a9a36', n: 12, s: .045, L: 5, fam: 'Koriander' },
  dill: { g: 'frond', col: '#4c8a34', n: 9, s: .07, L: 5, fam: 'Dill' },
  freshherb: { g: 'herbbits', col: '#577d33', n: 12, s: .04, L: 5 },
  spinach: { g: 'leaf', col: '#2f6d2a', n: 10, s: .09, L: 2, bl: '#3f7a2c', fam: 'Spenat' },
  rucola: { g: 'rocket', col: '#4b8a2d', n: 10, s: .09, L: 5, fam: 'Rucola' },
  pakchoi: { g: 'bokchoy', col: '#5d9a3a', n: 4, s: .13, L: 3, fam: 'Pak choi' },
  kale: { g: 'kale', col: '#3b6b34', n: 4, s: .075, L: 3, fam: 'Grönkål' },
  cauli: { g: 'floret', col: '#efe6cc', n: 5, s: .06, L: 2, fam: 'Blomkål' },
  broccoli: { g: 'floret', col: '#4a8a33', n: 8, s: .065, L: 2, bl: '#6f9a3a', fam: 'Broccoli' },
  zucchini: { g: 'shred', col: '#a9c56c', n: 22, s: .075, L: 2, fam: 'Zucchini' },
  aubergine: { g: 'aubcube', col: '#e3c07c', n: 14, s: .055, L: 2, fam: 'Aubergine' },
  mushroom: { g: 'mush', col: '#decab0', n: 10, s: .065, L: 2, fam: 'Champinjoner' },
  shiitake: { g: 'shiitake', col: '#6e4a30', n: 7, s: .06, L: 3, fam: 'Svamp' },
  corn: { g: 'kernel', col: '#f2c53a', n: 22, s: .022, L: 3, fam: 'Majs' },
  peas: { g: 'pea', col: '#69a83a', n: 22, s: .028, L: 3, bl: '#76a83e', fam: 'Gröna ärtor' },
  edamame: { g: 'edamame', col: '#7db34a', n: 14, s: .032, L: 3, fam: 'Sojabönor' },
  snap: { g: 'pod', col: '#7cbd4c', n: 6, s: .085, L: 3, fam: 'Sockerärtor' },
  sprouts: { g: 'sprout', col: '#f4efd8', n: 16, s: .075, L: 3, fam: 'Böngroddar' },
  chickpeas: { g: 'chickpea', col: '#d9b373', n: 16, s: .034, L: 3, bl: '#dcc08e', fam: 'Kikärtor' },
  whitebeans: { g: 'bean', col: '#efe3c8', n: 14, s: .045, L: 3, fam: 'Vita bönor' },
  beansInTomato: { g: 'bean', col: '#e3bf98', n: 14, s: .045, L: 3, liq: ['#c4552c', 2], fam: 'Vita bönor' },
  blackbeans: { g: 'bean', col: '#2b2327', n: 16, s: .04, L: 3, liq: ['#3a2a2a', 1.4], fam: 'Svarta bönor' },
  kidney: { g: 'bean', col: '#7b2a2a', n: 14, s: .045, L: 3, fam: 'Kidneybönor' },
  lentils: { g: 'lentil', col: '#df8a3e', n: 44, s: .02, L: 3, liq: ['#d9803a', 1.3], fam: 'Röda linser' },
  rice: { grp: 'ricepile', col: '#f6f0e0', s: .5, L: 1, fam: 'Ris' },
  yellowrice: { grp: 'ricepile', col: '#f0cf5a', s: .56, L: 1, fam: 'Ris' },
  spaghetti: { grp: 'nest', col: '#eed395', s: .56, L: 1, v: { n: 72, w: .024 }, fam: 'Pasta' },
  tagliatelle: { grp: 'nest', col: '#f0d493', s: .58, L: 1, v: { n: 30, w: .055 }, fam: 'Pasta' },
  ramen: { grp: 'nest', col: '#efd48a', s: .5, L: 1, v: { n: 60, w: .018, wavy: .012 }, fam: 'Nudlar' },
  udon: { grp: 'nest', col: '#f3e8cc', s: .56, L: 1, v: { n: 34, w: .048 }, fam: 'Nudlar' },
  penne: { g: 'tube', col: '#eccd88', n: 26, s: .085, L: 1, fam: 'Pasta' },
  rigatoni: { g: 'rigatoni', col: '#ebca84', n: 24, s: .08, L: 1, fam: 'Pasta' },
  farfalle: { g: 'farfalle', col: '#efd28f', n: 22, s: .085, L: 1, fam: 'Pasta' },
  macaroni: { g: 'macaroni', col: '#efd594', n: 40, s: .05, L: 1, fam: 'Pasta' },
  gnocchi: { g: 'gnocchi', col: '#f1e2b6', n: 20, s: .06, L: 1, fam: 'Gnocchi' },
  tofu: { g: 'tofu', col: '#f1e3bf', n: 12, s: .07, L: 3, fam: 'Tofu' },
  tofucrumble: { g: 'crumble', col: '#f0cf62', n: 24, s: .09, L: 2, fam: 'Tofu' },
  smokedtofu: { g: 'tofu', col: '#c99a62', n: 12, s: .05, L: 3, fam: 'Tofu' },
  mince: { g: 'mince', col: '#7a4a2e', n: 26, s: .06, L: 2, liq: ['#6a3d24', .5], fam: 'Vegofärs' },
  sausage: { g: 'sausage', col: '#b0563a', n: 10, s: .085, L: 2, fam: 'Vegokorv' },
  chorizo: { g: 'chorizo', col: '#9c2f1e', n: 10, s: .05, L: 3, fam: 'Vegokorv' },
  filet: { g: 'filet', col: '#a8703e', n: 10, s: .12, L: 2, fam: 'Filébitar' },
  pulled: { g: 'pulled', col: '#7a4b2c', n: 9, s: .085, L: 2, fam: 'Pulled beans' },
  shrimp: { g: 'shrimp', col: '#f09a78', n: 8, s: .075, L: 3, fam: 'Veganska räkor' },
  vegpatty: { g: 'patty', col: '#8a9a4a', n: 3, s: .16, L: 2, fam: 'Grönsaksbiffar' },
  bacon: { g: 'bacon', col: '#a4452e', n: 6, s: .08, L: 4 },
  avocado: { g: 'avslice', col: '#a8c85a', n: 7, s: .11, L: 3, bl: '#a9c35a', fam: 'Avokado' },
  avocube: { g: 'avcube', col: '#b9d266', n: 12, s: .05, L: 3, fam: 'Avokado' },
  cucumber: { g: 'cuke', col: '#cfe3a0', n: 9, s: .075, L: 3, fam: 'Gurka' },
  cucshred: { g: 'shred', col: '#b9d48a', n: 16, s: .07, L: 3, fam: 'Gurka' },
  relish: { g: 'bits', col: '#b7b94a', n: 8, s: .05, L: 4 },
  radish: { g: 'radish', col: '#cf3557', n: 8, s: .055, L: 3, fam: 'Rädisor' },
  cabbage: { g: 'cabbage', col: '#e3ecc6', n: 26, s: .11, L: 2, fam: 'Vitkål' },
  lemon: { g: 'zest', col: '#f0cf2e', n: 3, s: .07, L: 5, fam: 'Citron' },
  lemonslice: { g: 'citrus', col: '#f2d33a', n: 1, s: .1, L: 5 },
  lime: { g: 'citrus', col: '#86b83c', n: 1, s: .09, L: 5 },
  orange: { g: 'zest', col: '#f0902a', n: 3, s: .07, L: 5, liq: ['#f0962e', .5] },
  ginger: { g: 'ginger', col: '#e8d08c', n: 6, s: .05, L: 4, fam: 'Ingefära' },
  kalamata: { g: 'olive', col: '#4b2335', n: 10, s: .045, L: 3, fam: 'Oliver' },
  greenolive: { g: 'oring', col: '#8c963c', n: 10, s: .035, L: 4, fam: 'Oliver' },
  caper: { g: 'caper', col: '#6f7b3a', n: 12, s: .022, L: 4, fam: 'Kapris' },
  parm: { g: 'parm', col: '#f3e8c4', n: 14, s: .045, L: 5 },
  feta: { g: 'feta', col: '#f6f3ea', n: 9, s: .045, L: 5 },
  melt: { g: 'melt', col: '#f1d27a', n: 5, s: .09, L: 5 },
  cheeseslice: { g: 'cheeseslice', col: '#f0d890', n: 0, s: .1, L: 5 },
  roe: { g: 'roe', col: '#1d1d22', n: 3, s: .09, L: 5 },
  sesame: { g: 'sesame', col: '#f0e2c0', n: 30, s: .013, L: 6 },
  peanut: { g: 'nut', col: '#caa06a', n: 5, s: .03, L: 5, liq: ['#b7773a', 2.5], fam: 'Jordnötssmör' },
  nuts: { g: 'almond', col: '#d2aa74', n: 12, s: .035, L: 5 },
  coconut: { g: 'coco', col: '#fbf7ec', n: 8, s: .045, L: 5 },
  coconutmilk: { liq: ['#f3ead5', 2], fam: 'Kokosmjölk' },
  chia: { g: 'chia', col: '#3a3530', n: 3, s: .12, L: 4, liq: ['#b8aea0', .4] },
  poppy: { g: 'poppy', col: '#2c3140', n: 2, s: .1, L: 5 },
  oats: { g: 'oat', col: '#e6d6ae', n: 40, s: .03, L: 3, liq: ['#e2d3b3', 1.5], fam: 'Havregryn' },
  banana: { g: 'banana', col: '#f3e9c0', n: 6, s: .07, L: 3, fam: 'Banan' },
  berries: { g: 'berry', col: '#2f3a6a', n: 12, s: .045, L: 4, fam: 'Bär' },
  apple: { g: 'apple', col: '#f3e6bf', n: 7, s: .1, L: 3, fam: 'Äpplen' },
  jam: { g: 'jam', col: '#8e1a26', n: 3, s: .045, L: 5 },
  lingon: { g: 'lingon', col: '#c81d25', n: 10, s: .02, L: 5 },
  cocoa: { liq: ['#4b2a1c', 3] },
  coffee: { liq: ['#6a4126', 2.5] },
  ice: { g: 'ice', col: '#e8f2f8', n: 4, s: .13, L: 5 },
  pearl: { g: 'pearl', col: '#fbfaf5', n: 0, s: .02, L: 6 },
  hoisin: { liq: ['#4a1b12', 2.5] },
  soy: { liq: ['#3a1f12', .12] },
  cream: { liq: ['#f3ead6', 2], fam: null },
  mayo: { liq: ['#f4e7c0', 1.5] },
  milk: { liq: ['#f2eee6', 1.2] },
  water: { liq: ['#e2cfa3', .2] },
  broth: { liq: ['#c48d45', .3] },
  darkbroth: { liq: ['#5a3a22', .35] },
  mustard: { liq: ['#d8a82b', .5] },
  pesto: { g: 'herbbits', col: '#5b7f2c', n: 6, s: .035, L: 5, liq: ['#7d963a', 1.2] },
  tahini: { liq: ['#d4b07a', 1] },
  bbq: { liq: ['#6a2418', .6] },
  yeastflakes: { liq: ['#e8c45a', .5] },
  bread: {}, none: {}
};
const RULES = [
  [/:$/, 'none'], [/vinäger|ättika|mirin|sirap|liquid smoke|bakpulver|pakpulver|kikärtsspad|kikärtsmjöl|potatismjöl|majsstärkelse|maizena|ströbröd|jäst \(|^\d+ gram jäst/, 'none'],
  [/fond|buljong/, t => /mörk|kantarell|brynt/.test(t) ? 'darkbroth' : 'broth'],
  [/vitlök/, 'garlic'], [/schalotten|scharlotten|steklök/, 'shallot'], [/rödlök/, 'redonion'], [/salladslök/, 'scallion'], [/purjo/, 'leek'], [/gräslök/, 'chive'], [/lök/, 'onion'],
  [/morot|morötter/, t => /riv/.test(t) ? 'carrotshred' : 'carrot'], [/rödbet/, 'beet'], [/selleri/, 'celery'], [/palsternacka/, 'parsnip'],
  [/färskpotatis/, 'newpotato'], [/potatis/, 'potato'],
  [/tomatpuré|bbq-sås \(eller tomatpuré\)/, t => /bbq/.test(t) ? 'bbq' : 'tomatopaste'], [/soltorkade/, 'sundried'], [/körsbärstomat|småtomat/, 'cherry'],
  [/bönor i tomatsås/, 'beansInTomato'], [/burk körsbärstomater/, 'cannedcherry'], [/krossade tomat|burktomat|hela tomater|konserverade tomater|tomat-pastas|pastasås/, 'canned'], [/tomat/, 'tomato'],
  [/paprikapulver/, 'paprikap'], [/paprik/, t => /grön/.test(t) ? 'greenpepper' : /gul/.test(t) && !/röd/.test(t) ? 'yellowpepper' : 'redpepper'],
  [/sweet chili/, 'sweetchili'], [/chiliflakes|chilipulver|chilipeppar|sambal|sriracha|tabasco|chiliflakes/, 'chiliflakes'], [/chili/, 'chili'],
  [/curry/, 'curry'], [/gurkmeja/, 'turmeric'], [/kanel/, 'cinnamon'], [/spiskummin|kardemumma|kryddpeppar|muskot|dragon|vaniljpulver/, 'spice'],
  [/peppar/, 'pepper'], [/oregano/, t => /färsk|hackad färsk/.test(t) ? 'freshherb' : 'driedherb'], [/timjan|rosmarin/, 'driedherb'],
  [/lagerbl/, 'bay'], [/nejlik/, 'clove'], [/enbär/, 'juniper'], [/basilika/, 'basil'], [/persilja/, 'parsley'], [/koriander/, 'coriander'], [/dill/, 'dill'],
  [/spenat/, 'spinach'], [/rucola|ruccola/, 'rucola'], [/pak choi/, 'pakchoi'], [/grönkål/, 'kale'], [/blomkål/, 'cauli'], [/broccoli/, 'broccoli'],
  [/zucchini/, 'zucchini'], [/aubergine/, 'aubergine'], [/shiitake/, 'shiitake'], [/champinjon|svamp/, 'mushroom'], [/majs/, 'corn'],
  [/sockerärt/, 'snap'], [/sojabön/, 'edamame'], [/kikärt/, 'chickpeas'], [/ärt|ärter/, 'peas'], [/böngrodd/, 'sprouts'],
  [/svarta bönor/, 'blackbeans'], [/kidney/, 'kidney'], [/pulled beans/, 'pulled'], [/cannellini|vita bönor|vegobacon/, t => /vegobacon/.test(t) ? 'bacon' : 'whitebeans'], [/linser/, 'lentils'],
  [/basmatiris|^ris|jasmin/, 'rice'], [/spaghetti/, 'spaghetti'], [/rigatoni/, 'rigatoni'], [/farfalle/, 'farfalle'], [/makaron/, 'macaroni'], [/gnocchi/, 'gnocchi'],
  [/ramennudlar/, 'ramen'], [/nudlar/, 'udon'], [/pasta/, 'penne'],
  [/rökt tofu/, 'smokedtofu'], [/tofu/, 'tofu'], [/vegofärs|sojafärs|formbar färs/, 'mince'], [/falukorv|vegokorv/, 'sausage'], [/chorizo/, 'chorizo'],
  [/filébitar|veganskt protein|cashewmeetly/, 'filet'], [/räkor/, 'shrimp'], [/grönsaksbiff/, 'vegpatty'],
  [/avokado/, 'avocado'], [/bostongurka/, 'relish'], [/gurka/, 'cucumber'], [/rädis/, 'radish'], [/vitkål/, 'cabbage'],
  [/apelsin/, 'orange'], [/limefrukt \(saften\)|limejuice/, 'none'], [/lime/, 'lime'], [/citron(?!juice|saft|peppar)/, 'lemon'], [/ingefär/, 'ginger'],
  [/kalamata/, 'kalamata'], [/oliver/, 'greenolive'], [/kapris/, 'caper'], [/parmesan/, 'parm'], [/fetaost/, 'feta'], [/riven ost/, 'melt'], [/vegansk ost/, 'cheeseslice'],
  [/tångkaviar/, 'roe'], [/sesamfrö/, 'sesame'], [/jordnöts/, 'peanut'], [/nötter/, 'nuts'], [/kokosmjölk/, 'coconutmilk'], [/kokos/, 'coconut'],
  [/chiafrö/, 'chia'], [/vallmo/, 'poppy'], [/havregryn/, 'oats'], [/banan/, 'banana'], [/lingon|gelé|sylt/, t => /lingon/.test(t) && !/gelé/.test(t) ? 'lingon' : 'jam'], [/bär/, 'berries'], [/äpple/, 'apple'],
  [/kakao/, 'cocoa'], [/kaffe/, 'coffee'], [/isbitar/, 'ice'], [/pärlsocker/, 'pearl'], [/hoisin/, 'hoisin'],
  [/grädde|crème|creme|créme|gräddfil|ifraice|yoghurt/, 'cream'], [/majon/, 'mayo'], [/mjölk|dryck/, 'milk'],
  [/soja|soya|tamari|fisksås/, 'soy'], [/senap/, 'mustard'], [/pesto/, 'pesto'], [/tahini/, 'tahini'], [/näringsjäst|b-jäst/, 'yeastflakes'], [/vatten/, 'water'],
  [/bröd/, 'bread']
];
function classify(text) {
  const t = text.toLowerCase();
  for (const [re, k] of RULES) if (re.test(t)) return typeof k === 'function' ? k(t) : k;
  return 'none';
}

/* ==========================================================================
   Vessels
   ========================================================================== */
const GLAZES = {
  white: { c: '#f3f0e8', sp: '#b9ad98' }, oat: { c: '#e4d8c2', sp: '#8f7a5e' }, celadon: { c: '#c2d2c0', sp: '#6d826c' },
  blue: { c: '#6f8fb3', sp: '#2c4260' }, ink: { c: '#2d3a4c', sp: '#6a7a90' }, rust: { c: '#b4643f', sp: '#6a3219' },
  butter: { c: '#eed79c', sp: '#9c8450' }, sand: { c: '#d9c3a5', sp: '#7d6448' }, sage: { c: '#9fae8f', sp: '#4f5e45' }
};
function tableShadow(c, x, y, R, sx = 1, sy = 1, str = 1) {
  c.save(); c.translate(x + R * .07, y + R * .1); c.scale(sx, sy);
  let g = c.createRadialGradient(0, 0, R * .7, 0, 0, R * 1.22); g.addColorStop(0, `rgba(8,10,12,${.5 * str})`); g.addColorStop(1, 'rgba(8,10,12,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 1.22, 0, TAU); c.fill(); c.restore();
  c.save(); c.translate(x + R * .025, y + R * .04); c.scale(sx, sy);
  g = c.createRadialGradient(0, 0, R * .9, 0, 0, R * 1.04); g.addColorStop(0, `rgba(5,6,8,${.55 * str})`); g.addColorStop(1, 'rgba(5,6,8,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 1.04, 0, TAU); c.fill(); c.restore();
}
function speckle(c, x, y, R, col, rnd, n = 160) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = C.rgba(col, .15 + rnd() * .35); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, R * (.002 + rnd() * .004), 0, TAU); c.fill(); } }
function ringShade(c, x, y, R, w, dark = .28, lit = .22) {
  // light from top-left: the top-left inner wall is in shadow, the bottom-right catches light
  const g = c.createLinearGradient(x + LIGHT.x * R, y + LIGHT.y * R, x - LIGHT.x * R, y - LIGHT.y * R);
  g.addColorStop(0, `rgba(20,12,6,${dark})`); g.addColorStop(.5, 'rgba(20,12,6,0)'); g.addColorStop(1, `rgba(255,250,240,${lit})`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.arc(x, y, R - w, 0, TAU, true); c.fill('evenodd');
}
function rimLight(c, x, y, R, w, k = 1) {
  c.lineWidth = w; c.strokeStyle = `rgba(255,252,245,${.55 * k})`; c.beginPath(); c.arc(x, y, R, Math.PI * .95, Math.PI * 1.55); c.stroke();
  c.strokeStyle = 'rgba(20,12,6,.22)'; c.beginPath(); c.arc(x, y, R, Math.PI * -.05, Math.PI * .55); c.stroke();
}
function glazeReflex(c, x, y, R, Rin, a) { // the kitchen window, mirrored in the glaze
  c.save(); c.beginPath(); c.arc(x, y, R * .99, 0, TAU); c.arc(x, y, Rin, 0, TAU, true); c.clip('evenodd');
  c.translate(x + LIGHT.x * R * .84, y + LIGHT.y * R * .84); c.rotate(Math.atan2(LIGHT.y, LIGHT.x) + Math.PI / 2);
  const g = c.createLinearGradient(-R * .3, 0, R * .3, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.3, `rgba(255,255,255,${a})`); g.addColorStop(.5, `rgba(255,255,255,${a * .4})`); g.addColorStop(.62, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(-R * .3, -R * .1, R * .6, R * .2); c.restore();
}
function bodyFill(c, x, y, R, col) { const g = c.createRadialGradient(x + LIGHT.x * R * .5, y + LIGHT.y * R * .5, R * .1, x, y, R * 1.1); g.addColorStop(0, C.light(col, .18)); g.addColorStop(.6, col); g.addColorStop(1, C.dark(col, .18)); return g; }
const V = {};
V.plate = (c, s, rnd) => {
  const { x, y, R } = s, gl = GLAZES[s.glaze];
  tableShadow(c, x, y, R);
  c.fillStyle = bodyFill(c, x, y, R, gl.c); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  speckle(c, x, y, R, gl.sp, rnd);
  ringShade(c, x, y, R * .74, R * .07, .22, .28);
  c.fillStyle = C.rgba(C.dark(gl.c, .5), .06); c.beginPath(); c.arc(x, y, R * .67, 0, TAU); c.fill();
  rimLight(c, x, y, R * .985, R * .02, C.lum(gl.c) < .35 ? .35 : 1);
  glazeReflex(c, x, y, R, R * .74, C.lum(gl.c) < .35 ? .1 : .16);
  return { cx: x, cy: y, r: R * .67 };
};
V.bowl = (c, s, rnd) => {
  const { x, y, R } = s, gl = GLAZES[s.glaze];
  tableShadow(c, x, y, R, 1, 1, 1.1);
  c.fillStyle = bodyFill(c, x, y, R, gl.c); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  speckle(c, x, y, R, gl.sp, rnd, 120);
  ringShade(c, x, y, R * .93, R * .14, .45, .3);
  rimLight(c, x, y, R * .96, R * .03, C.lum(gl.c) < .35 ? .35 : 1);
  glazeReflex(c, x, y, R, R * .93, C.lum(gl.c) < .35 ? .1 : .16);
  return { cx: x, cy: y, r: R * .8, deep: 1 };
};
V.pot = (c, s, rnd) => {
  const { x, y, R } = s, body = s.enamel || '#2b2b2e';
  tableShadow(c, x, y, R * 1.05, 1.08, 1, 1.1);
  for (const sx of [-1, 1]) { c.save(); c.translate(x + sx * R * 1.03, y); rr(c, -R * .13, -R * .2, R * .26, R * .4, R * .1); c.fillStyle = bodyFill(c, 0, 0, R * .2, body); c.fill(); c.restore(); }
  c.fillStyle = bodyFill(c, x, y, R, body); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  if (!s.enamel) speckle(c, x, y, R, '#8a8a8a', rnd, 90);
  c.beginPath(); c.arc(x, y, R * .9, 0, TAU); c.fillStyle = s.inner || '#1d1c1c'; c.fill();
  ringShade(c, x, y, R * .9, R * .06, .5, .12);
  rimLight(c, x, y, R * .95, R * .025, s.enamel && C.lum(s.enamel) > .4 ? .8 : .3);
  return { cx: x, cy: y, r: R * .85, deep: 1 };
};
V.skillet = (c, s, rnd) => {
  const { x, y, R } = s;
  const a = Math.PI * .25, hx = x + Math.cos(a) * R, hy = y + Math.sin(a) * R;
  c.save(); c.translate(hx, hy); c.rotate(a); rr(c, -R * .05, -R * .085, R * .62, R * .17, R * .08); c.fillStyle = '#262627'; c.fill(); c.restore();
  tableShadow(c, x, y, R, 1, 1, 1.1);
  c.fillStyle = bodyFill(c, x, y, R, '#2a2a2c'); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  speckle(c, x, y, R, '#909090', rnd, 70);
  c.beginPath(); c.arc(x, y, R * .9, 0, TAU); c.fillStyle = '#1b1b1c'; c.fill();
  ringShade(c, x, y, R * .9, R * .05, .4, .1); rimLight(c, x, y, R * .96, R * .02, .3);
  return { cx: x, cy: y, r: R * .86 };
};
V.saucepan = (c, s, rnd) => {
  const { x, y, R } = s;
  const a = Math.PI * .22, hx = x + Math.cos(a) * R * .95, hy = y + Math.sin(a) * R * .95;
  c.save(); c.translate(hx, hy); c.rotate(a); rr(c, 0, -R * .08, R * .75, R * .16, R * .08); const hg = c.createLinearGradient(0, -R * .08, 0, R * .08); hg.addColorStop(0, '#d9dbdc'); hg.addColorStop(.5, '#9ea2a5'); hg.addColorStop(1, '#6e7275'); c.fillStyle = hg; c.fill(); c.restore();
  tableShadow(c, x, y, R);
  const g = c.createLinearGradient(x - R, y - R, x + R, y + R); g.addColorStop(0, '#eef0f1'); g.addColorStop(.35, '#a8adb0'); g.addColorStop(.55, '#dfe2e3'); g.addColorStop(1, '#7c8185');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  c.beginPath(); c.arc(x, y, R * .92, 0, TAU); c.fillStyle = '#8d9295'; c.fill();
  ringShade(c, x, y, R * .92, R * .08, .45, .2);
  return { cx: x, cy: y, r: R * .86, deep: 1 };
};
V.ramekin = (c, s, rnd) => {
  const { x, y, R } = s, gl = GLAZES[s.glaze];
  tableShadow(c, x, y, R);
  c.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, rad = R * (1 + .022 * Math.cos(a * 30)); i ? c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.fillStyle = bodyFill(c, x, y, R, gl.c); c.fill();
  c.beginPath(); c.arc(x, y, R * .9, 0, TAU); c.fillStyle = C.light(gl.c, .1); c.fill();
  ringShade(c, x, y, R * .88, R * .1, .4, .25); rimLight(c, x, y, R * .9, R * .025);
  return { cx: x, cy: y, r: R * .79, deep: 1 };
};
V.jar = (c, s, rnd) => {
  const { x, y, R } = s;
  tableShadow(c, x, y, R, 1, 1, .7);
  c.beginPath(); c.arc(x, y, R, 0, TAU); c.fillStyle = 'rgba(210,228,232,.2)'; c.fill();
  return { cx: x, cy: y, r: R * .84, glass: 1 };
};
V.glass = (c, s, rnd) => { const { x, y, R } = s; tableShadow(c, x, y, R, 1, 1, .6); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fillStyle = 'rgba(210,228,232,.16)'; c.fill(); return { cx: x, cy: y, r: R * .9, glass: 1 }; };
V.mug = (c, s, rnd) => {
  const { x, y, R } = s, gl = GLAZES[s.glaze];
  c.save(); c.lineCap = 'round'; c.lineWidth = R * .2; c.strokeStyle = C.dark(gl.c, .12); c.beginPath(); c.arc(x + R * 1.05, y + R * .05, R * .32, -1.2, 1.2); c.stroke(); c.restore();
  tableShadow(c, x, y, R);
  c.fillStyle = bodyFill(c, x, y, R, gl.c); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); speckle(c, x, y, R, gl.sp, rnd, 60);
  ringShade(c, x, y, R * .9, R * .1, .45, .25); rimLight(c, x, y, R * .95, R * .03);
  return { cx: x, cy: y, r: R * .8, deep: 1 };
};
V.board = (c, s, rnd) => {
  const { x, y, w, h } = s;
  c.save(); c.translate(x + .012, y + .02); rr(c, -w / 2, -h / 2, w, h, .03); c.fillStyle = 'rgba(5,6,8,.45)'; c.shadowColor = 'rgba(5,6,8,.45)'; c.shadowBlur = c.getTransform().a * .022; c.fill(); c.restore();
  rr(c, x - w / 2, y - h / 2, w, h, .025);
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); g.addColorStop(0, '#caa074'); g.addColorStop(1, '#a87a4f'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(110,70,35,.25)'; c.lineWidth = .003;
  for (let i = 0; i < 40; i++) { const yy = y - h / 2 + rnd() * h; c.beginPath(); c.moveTo(x - w / 2, yy); for (let k = 1; k <= 10; k++) c.lineTo(x - w / 2 + k * w / 10, yy + Math.sin(k * .8 + i) * .006); c.stroke(); }
  c.restore(); c.lineWidth = .004; c.strokeStyle = 'rgba(255,240,215,.35)'; rr(c, x - w / 2 + .003, y - h / 2 + .003, w - .006, h - .006, .022); c.stroke();
  return { rect: [x - w / 2 + .03, y - h / 2 + .03, w - .06, h - .06] };
};
V.tray = (c, s, rnd) => {
  const { x, y, w, h } = s;
  c.save(); c.translate(x + .012, y + .02); rr(c, -w / 2, -h / 2, w, h, .02); c.fillStyle = 'rgba(5,6,8,.45)'; c.shadowColor = 'rgba(5,6,8,.45)'; c.shadowBlur = c.getTransform().a * .022; c.fill(); c.restore();
  rr(c, x - w / 2, y - h / 2, w, h, .02); c.fillStyle = '#3b3d40'; c.fill();
  rr(c, x - w / 2 + .018, y - h / 2 + .018, w - .036, h - .036, .012); const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); g.addColorStop(0, '#f4ecdc'); g.addColorStop(1, '#e2d6c0'); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(150,130,100,.18)'; c.lineWidth = .002; for (let i = 0; i < 16; i++) { c.beginPath(); const x0 = x - w / 2 + rnd() * w, y0 = y - h / 2 + rnd() * h; c.moveTo(x0, y0); c.lineTo(x0 + (rnd() - .5) * .2, y0 + (rnd() - .5) * .2); c.stroke(); }
  return { rect: [x - w / 2 + .04, y - h / 2 + .04, w - .08, h - .08] };
};
V.ovendish = (c, s, rnd) => {
  const { x, y, w, h } = s, gl = GLAZES[s.glaze];
  c.save(); c.translate(x + .014, y + .022); rr(c, -w / 2 - .03, -h / 2, w + .06, h, .05); c.fillStyle = 'rgba(5,6,8,.5)'; c.shadowColor = 'rgba(5,6,8,.5)'; c.shadowBlur = c.getTransform().a * .022; c.fill(); c.restore();
  for (const sx of [-1, 1]) { rr(c, x + sx * (w / 2 + .012) - .025, y - h * .18, .05, h * .36, .02); c.fillStyle = C.dark(gl.c, .08); c.fill(); }
  rr(c, x - w / 2, y - h / 2, w, h, .05); c.fillStyle = bodyFill(c, x, y, Math.max(w, h) / 2, gl.c); c.fill();
  rr(c, x - w / 2 + .03, y - h / 2 + .03, w - .06, h - .06, .03); c.fillStyle = C.dark(gl.c, .1); c.fill();
  return { rect: [x - w / 2 + .035, y - h / 2 + .035, w - .07, h - .07], deep: 1 };
};
V.piedish = (c, s, rnd) => {
  const { x, y, R } = s, gl = GLAZES[s.glaze];
  tableShadow(c, x, y, R);
  c.beginPath(); for (let i = 0; i <= 180; i++) { const a = i / 180 * TAU, rad = R * (1 + .018 * Math.cos(a * 36)); i ? c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.fillStyle = bodyFill(c, x, y, R, gl.c); c.fill();
  ringShade(c, x, y, R * .9, R * .08, .35, .25);
  return { cx: x, cy: y, r: R * .84 };
};
V.cakestand = (c, s, rnd) => { const r = V.plate(c, { ...s }, rnd); return { cx: r.cx, cy: r.cy, r: s.R * .82 }; };
function glassOver(c, s) {
  const { x, y, R } = s;
  c.lineWidth = R * .07; c.strokeStyle = 'rgba(225,238,240,.28)'; c.beginPath(); c.arc(x, y, R * .95, 0, TAU); c.stroke();
  c.lineWidth = R * .02; c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x, y, R * .99, Math.PI * 1.02, Math.PI * 1.45); c.stroke();
  c.lineWidth = R * .012; c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x, y, R * .88, Math.PI * 1.1, Math.PI * 1.3); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x, y, R * .9, Math.PI * .1, Math.PI * .3); c.stroke();
  c.fillStyle = 'rgba(200,225,235,.06)'; c.beginPath(); c.arc(x, y, R * .9, 0, TAU); c.fill();
}
function innerShadow(c, a) {
  if (!a.r) return;
  const { cx, cy, r } = a;
  c.save(); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.clip();
  const g = c.createRadialGradient(cx - LIGHT.x * r * .12, cy - LIGHT.y * r * .12, r * .82, cx - LIGHT.x * r * .12, cy - LIGHT.y * r * .12, r * 1.08);
  g.addColorStop(0, 'rgba(15,8,4,0)'); g.addColorStop(1, `rgba(15,8,4,${a.deep ? .5 : .22})`);
  c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2); c.restore();
}

/* ==========================================================================
   Recipe → scene
   ========================================================================== */
function flatIngredients(rec) { const out = []; rec.parts.forEach((p, pi) => p.ing.forEach((t, ii) => out.push({ t, pi, ii, k: classify(t) }))); return out; }
function areaOf(a) { return a.rect ? a.rect[2] * a.rect[3] : Math.PI * a.r * a.r; }
function samplePoint(a, rnd, mode, spread = 1) {
  if (a.rect) { const [x, y, w, h] = a.rect; if (mode === 'center') { return [x + w / 2 + (rnd() - .5) * w * .7 * spread, y + h / 2 + (rnd() - .5) * h * .7 * spread]; } return [x + w * .06 + rnd() * w * .88, y + h * .06 + rnd() * h * .88]; }
  let d;
  if (mode === 'center') { d = Math.min(.9, Math.abs((rnd() + rnd() + rnd()) / 1.5 - 1) * spread * 1.1); }
  else if (mode === 'ring') d = .45 + rnd() * .45; else d = Math.sqrt(rnd()) * .9;
  const ang = rnd() * TAU; return [a.cx + Math.cos(ang) * a.r * d, a.cy + Math.sin(ang) * a.r * d];
}
function place(items, a, rnd, n, make, mode, spread, minD) {
  for (let i = 0; i < n; i++) {
    let best = null, bestD = -1;
    for (let t = 0; t < 7; t++) {
      const p = samplePoint(a, rnd, mode, spread); let md = 9;
      for (const it of items) if (it.L === make.L) { const d = Math.hypot(it.x - p[0], it.y - p[1]); if (d < md) md = d; }
      if (md > bestD) { bestD = md; best = p; } if (md > minD) break;
    }
    items.push({ ...make, x: best[0], y: best[1], rot: rnd() * TAU, seed: Math.floor(rnd() * 1e9) });
  }
}
function computeBase(ings, spec) {
  let r = 0, g = 0, b = 0, w = 0; const from = [];
  for (const it of ings) {
    const k = K[it.k] || {}; let L = k.liq; if (!L && spec.blend && k.bl) L = [k.bl, 2];
    if (spec.blendAll && k.bl) L = [k.bl, 2.2];
    if (!L) continue; const [cr, cg, cb] = C.rgb(L[0]); r += Math.log(Math.max(cr, 10)) * L[1]; g += Math.log(Math.max(cg, 10)) * L[1]; b += Math.log(Math.max(cb, 10)) * L[1]; w += L[1]; from.push(it.idx);
  }
  if (!w) return null; return { col: C.hex([Math.exp(r / w), Math.exp(g / w), Math.exp(b / w)]), from };
}
function pickGlaze(rnd, avoid, prefs) {
  const opts = prefs || ['white', 'white', 'oat', 'celadon', 'blue', 'ink', 'rust', 'butter', 'sand', 'sage'];
  let best = opts[0], bd = -1;
  for (let i = 0; i < 4; i++) { const g = opts[Math.floor(rnd() * opts.length)]; const d = avoid ? C.dist(GLAZES[g].c, avoid) : 1; const score = d + rnd() * .08; if (score > bd) { bd = score; best = g; } }
  return best;
}
function buildScene(rec, spec) {
  const rnd = mulberry(strHash(rec.id) ^ 0x9e3779b9);
  const all = flatIngredients(rec); all.forEach((it, i) => it.idx = i);
  const extra = (spec.extra || []).map(k => ({ t: '', k, idx: -1, pi: 0 }));
  let groups;
  if (spec.multi) groups = rec.parts.map((p, pi) => all.filter(i => i.pi === pi));
  else groups = [all.concat(extra)];
  if (spec.multi && extra.length) groups[0] = groups[0].concat(extra);
  const slots = spec.slots || (groups.length === 1 ? [{ x: .5, y: .5, R: spec.R || .41 }] : groups.length === 2 ? [{ x: .31, y: .36, R: .25 }, { x: .67, y: .64, R: .27 }] : [{ x: .29, y: .3, R: .215 }, { x: .72, y: .36, R: .215 }, { x: .47, y: .73, R: .215 }]);
  const scene = { vessels: [], items: [], id: rec.id };
  groups.forEach((ings, gi) => {
    const sl = { ...slots[gi] }; const vs = { ...spec, ...(spec.per ? spec.per[gi] : {}) };
    sl.type = vs.v || 'plate';
    if (vs.w) { sl.w = vs.w; sl.h = vs.h; }
    const swap = vs.swap || {};
    ings.forEach(i => { if (swap[i.k]) i.k = swap[i.k]; });
    const hide = new Set(vs.hide || []);
    const base = vs.base ? { col: vs.base, from: [] } : (vs.nobase ? null : computeBase(ings, vs));
    if (base && vs.baseTint) base.col = C.mix(base.col, vs.baseTint[0], vs.baseTint[1]);
    sl.glaze = vs.glaze || pickGlaze(rnd, base ? base.col : '#d9b373', vs.glazes);
    if (vs.enamel) sl.enamel = vs.enamel;
    const ves = { ...sl, base, mode: vs.m || 'fill', baseStyle: vs.bs || (vs.m === 'nest' ? 'pool' : 'sauce'), spec: vs };
    scene.vessels.push(ves);
    // area is computed by drawing into a throwaway context
    const tmp = mkCanvas(4, 4).getContext('2d'); tmp.save(); ves.area = V[sl.type](tmp, sl, mulberry(1)); tmp.restore();
    const a = ves.area, aScale = areaOf(a) / (Math.PI * .275 * .275) * (vs.dens || 1);
    const items = [];
    const mode = ves.mode;
    // bulk groups (nest, rice pile)
    for (const it of ings) {
      const k = K[it.k]; if (!k || hide.has(it.k)) continue;
      if (k.grp) {
        const sz = (vs.bulkS || k.s) * (a.r ? a.r / .275 : 1);
        const off = vs.bulkOff || [0, 0];
        const vv = base && k.grp === 'nest' ? { ...k.v, coat: base.col, coatK: C.lum(base.col) > .75 ? .12 : .3 } : k.v;
        items.push({ g: k.grp, col: k.col, v: vv, s: sz, L: 1, x: (a.cx || .5) + off[0], y: (a.cy || .5) + off[1], rot: rnd() * TAU, seed: Math.floor(rnd() * 1e9), ing: it.idx, grp: 1 });
      }
    }
    const hasNest = items.some(i => i.grp) && mode !== 'sectors'; const sectorsUsed = [], sectorQueue = [];
    if (base && ((hasNest && vs.m === 'nest') || vs.dabs)) {   // sauce dabs over the pasta
      const n = Math.round(10 * aScale);
      place(items, a, rnd, n, { g: 'dab', col: base.col, s: .07, L: 1.5, ing: -2 }, 'center', .55, .03);
    }
    for (const it of ings) {
      const k = K[it.k]; if (!k || !k.g || hide.has(it.k)) continue;
      let n = vs.counts && vs.counts[it.k] != null ? vs.counts[it.k] : Math.round(k.n * aScale);
      if ((vs.blend || vs.blendAll) && k.bl) n = Math.round(n * (vs.blendKeep != null ? vs.blendKeep : .12));
      if (it.t.startsWith('(') || it.t.startsWith('[')) n = Math.max(1, Math.round(n * .6));
      if (k.n && !n && !(vs.blend && k.bl)) n = 1;
      const L = k.L;
      let pm = mode === 'fill' ? 'uniform' : 'center', spread = vs.spread || .75;
      if (mode === 'sectors' && L < 5 && !k.grp) { const si = sectorsUsed.indexOf(it.k) >= 0 ? sectorsUsed.indexOf(it.k) : sectorsUsed.push(it.k) - 1; const make = { g: k.g, col: k.col, v: k.v, s: k.s * (a.r / .275), L, ing: it.idx }; const nn = vs.counts && vs.counts[it.k] != null ? vs.counts[it.k] : Math.round(k.n * aScale * .8); sectorQueue.push([make, nn, si]); continue; }
      if (L >= 5) { pm = 'center'; spread = vs.garnishSpread || .7; }
      if (mode === 'fill' && L < 5) { pm = 'uniform'; }
      if (hasNest && L >= 2 && L < 5) { pm = 'center'; spread = .7; }
      const make = { g: k.g, col: k.col, v: k.v, s: k.s * (vs.itemScale || 1) * (a.r ? Math.max(.75, Math.min(1.25, a.r / .275)) : 1), L, ing: it.idx };
      if (mode === 'fill' && L <= 3 && base) { make.subCol = base.col; }
      place(items, a, rnd, n, make, pm, spread, k.s * .8);
    }
    if (sectorQueue.length) { const ns = sectorsUsed.length, off = rnd() * TAU; sectorQueue.forEach(([make, nn, si]) => { const a0 = off + si / ns * TAU, a1 = off + (si + 1) / ns * TAU; for (let q = 0; q < nn; q++) { const t = a0 + (a1 - a0) * (.12 + rnd() * .76), d = a.r * (.38 + rnd() * .5); items.push({ ...make, x: a.cx + Math.cos(t) * d, y: a.cy + Math.sin(t) * d, rot: rnd() * TAU, seed: Math.floor(rnd() * 1e9) }); } }); }
    // forms: explicit arrangements (patties, buns, cookies, …)
    if (vs.form) {
      const f = vs.form, pos = f.pos || ring(f.n, a, f.rr || .55, rnd);
      pos.forEach(p => items.push({ g: f.g, col: f.col || '#7a4a2e', v: f.v, s: f.s, L: f.L || 2.5, x: p[0], y: p[1], rot: f.norot ? 0 : rnd() * TAU, seed: Math.floor(rnd() * 1e9), ing: f.ing != null ? f.ing : (all.find(i => i.k === f.k) || {}).idx }));
    }
    if (vs.deco) vs.deco.forEach(d => { const n = d.n || 1; place(items, a, rnd, n, { g: d.g, col: d.col, v: d.v, s: d.s, L: d.L || 6, ing: -2 }, d.pm || 'center', d.spread || .4, .02); });
    items.forEach(i => { if (i.subCol) i.sub = rnd() * (i.L <= 2 ? .35 : .22); });
    items.forEach(i => i.vi = gi);
    scene.items.push(...items);
  });
  scene.items.sort((a, b) => a.L - b.L);
  scene.flat = all;
  return scene;
}
/* a portion multiplier as more (or fewer) plates on the table */
function portionScene(sc, k) {
  if (k === 1) return sc;
  const n = k < 1 ? 1 : Math.min(3, Math.round(k));
  const L = n === 1 ? [[.5, .5, .84]] : n === 2 ? [[.3, .36, .6], [.7, .64, .6]] : [[.27, .29, .5], [.73, .32, .5], [.5, .73, .5]];
  const out = { id: sc.id + '@' + k, flat: sc.flat, vessels: [], items: [], copies: n, centers: L.map(l => [l[0], l[1]]) };
  L.forEach(([cx, cy, s], ci) => {
    const tx = x => cx + (x - .5) * s, ty = y => cy + (y - .5) * s;
    sc.vessels.forEach(v => {
      const a = v.area, na = a.rect ? { ...a, rect: [tx(a.rect[0]), ty(a.rect[1]), a.rect[2] * s, a.rect[3] * s] } : { ...a, cx: tx(a.cx), cy: ty(a.cy), r: a.r * s };
      out.vessels.push({ ...v, x: tx(v.x), y: ty(v.y), R: v.R != null ? v.R * s : v.R, w: v.w != null ? v.w * s : v.w, h: v.h != null ? v.h * s : v.h, area: na, copy: ci });
    });
    let items = sc.items; if (k < 1) items = items.filter((it, i) => it.grp || it.L >= 5 || i % 2 === 0);
    items.forEach(it => out.items.push({ ...it, x: tx(it.x), y: ty(it.y), s: it.s * s, copy: ci, rot: it.rot + ci * .7 }));
  });
  out.items.sort((a, b) => a.L - b.L);
  return out;
}
function ring(n, a, rr_, rnd) {
  const out = [];
  if (a.rect) { const [x, y, w, h] = a.rect; let cols = 1, best = 1e9; for (let cc = 1; cc <= n; cc++) { const rw = Math.ceil(n / cc); const waste = cc * rw - n; const asp = Math.abs(Math.log((w / cc) / (h / rw))); const sc = waste * 2 + asp; if (sc < best) { best = sc; cols = cc; } } const rows = Math.ceil(n / cols); for (let i = 0; i < n; i++) { const cx = i % cols, cy = Math.floor(i / cols); out.push([x + (cx + .5) / cols * w + (rnd() - .5) * .01, y + (cy + .5) / rows * h + (rnd() - .5) * .01]); } return out; }
  if (n === 1) return [[a.cx, a.cy]];
  const off = rnd() * TAU; for (let i = 0; i < n; i++) { const t = off + i / n * TAU; out.push([a.cx + Math.cos(t) * a.r * rr_, a.cy + Math.sin(t) * a.r * rr_]); }
  if (n >= 6) out.push([a.cx, a.cy]);
  return out;
}

/* ---------- base (liquids) ---------- */
function drawBase(c, ves, rnd, reveal = 1) {
  const a = ves.area, b = ves.base; if (!b) return;
  c.save();
  const st0 = ves.baseStyle;
  if (a.rect) { const [x, y, w, h] = a.rect; rr(c, x, y, w, h, .025); }
  else if (st0 === 'pool' || st0 === 'dressing') { const r3 = mulberry(strHash(ves.spec.v + st0 + (ves.base.col))); c.save(); c.translate(a.cx, a.cy); blobPath(c, a.r * (st0 === 'pool' ? .86 : .7) * reveal, r3, 11, .08); c.restore(); }
  else { c.beginPath(); const R = a.r * reveal; for (let i = 0; i <= 48; i++) { const t = i / 48 * TAU, w = R * (1 + (reveal < 1 ? .04 * Math.sin(t * 5 + reveal * 9) : 0)); i ? c.lineTo(a.cx + Math.cos(t) * w, a.cy + Math.sin(t) * w) : c.moveTo(a.cx + Math.cos(t) * w, a.cy + Math.sin(t) * w); } c.closePath(); }
  c.clip();
  const cx = a.rect ? a.rect[0] + a.rect[2] / 2 : a.cx, cy = a.rect ? a.rect[1] + a.rect[3] / 2 : a.cy, R = a.rect ? Math.max(a.rect[2], a.rect[3]) / 1.6 : a.r;
  const st = ves.baseStyle;
  const g = c.createRadialGradient(cx + LIGHT.x * R * .3, cy + LIGHT.y * R * .3, R * .05, cx, cy, R);
  if (st === 'broth') { g.addColorStop(0, C.rgba(C.light(b.col, .1), .92)); g.addColorStop(1, C.rgba(C.dark(b.col, .35), .95)); }
  else { g.addColorStop(0, C.light(b.col, .12)); g.addColorStop(.7, b.col); g.addColorStop(1, C.dark(b.col, .22)); }
  c.fillStyle = g; c.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
  const r2 = mulberry(strHash(ves.spec.v + b.col));
  if (st === 'baked') {
    for (let i = 0; i < 70; i++) { const ang = r2() * TAU, d = Math.sqrt(r2()) * R; const rb = R * (.03 + r2() * .1); const gg = c.createRadialGradient(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 0, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, rb); const dk = r2() < .6; gg.addColorStop(0, dk ? 'rgba(150,80,25,.55)' : 'rgba(255,230,160,.5)'); gg.addColorStop(1, 'rgba(150,80,25,0)'); c.fillStyle = gg; c.fillRect(cx + Math.cos(ang) * d - rb, cy + Math.sin(ang) * d - rb, rb * 2, rb * 2); }
    c.strokeStyle = 'rgba(120,60,20,.5)'; c.lineWidth = R * .04; c.strokeRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
  }
  if (st === 'froth') { for (let i = 0; i < 90; i++) { const ang = r2() * TAU, d = R * (.72 + r2() * .26); const rb = R * (.012 + r2() * .03); c.fillStyle = 'rgba(245,230,210,.28)'; c.beginPath(); c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, rb, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,245,230,.4)'; c.lineWidth = rb * .25; c.stroke(); } }
  if (st === 'sauce' || st === 'soup' || st === 'mash' || st === 'pool' || st === 'dressing') {
    for (let i = 0; i < 46; i++) { const ang = r2() * TAU, d = Math.sqrt(r2()) * R; c.fillStyle = C.rgba(r2() < .5 ? C.light(b.col, .2) : C.dark(b.col, .18), st === 'soup' ? .07 : .12); c.beginPath(); c.ellipse(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, R * (.05 + r2() * .12), R * (.03 + r2() * .06), r2() * TAU, 0, TAU); c.fill(); }
  }
  if ((st === 'sauce' || st === 'pool') && C.lum(b.col) < .6 && (C.rgb(b.col)[0] > 140)) {   // oil beads on tomato-ish sauces
    for (let i = 0; i < 16; i++) { const ang = r2() * TAU, d = Math.sqrt(r2()) * R * .9; const rr__ = R * (.012 + r2() * .02); c.fillStyle = 'rgba(255,190,90,.28)'; c.beginPath(); c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, rr__, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,230,170,.35)'; c.lineWidth = rr__ * .3; c.stroke(); }
  }
  if (st === 'broth') { for (let i = 0; i < 26; i++) { const ang = r2() * TAU, d = Math.sqrt(r2()) * R * .9; const rr__ = R * (.01 + r2() * .03); c.strokeStyle = 'rgba(255,220,150,.35)'; c.lineWidth = rr__ * .25; c.beginPath(); c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, rr__, 0, TAU); c.stroke(); } }
  if (st === 'mash') { c.save(); c.translate(cx, cy); c.scale(R * 2, R * 2); G.mashswirl(c, r2, b.col); c.restore(); }
  if (ves.spec.swirl) { c.save(); c.translate(cx, cy); c.rotate(r2() * TAU); c.scale(R * 1.1, R * 1.1); G.swirl(c, r2, ves.spec.swirl); c.restore(); }
  // window reflection streaks on the liquid, and the meniscus where it meets the wall
  if (st !== 'mash' && st !== 'dressing') {
    c.save(); c.translate(cx + LIGHT.x * R * .42, cy + LIGHT.y * R * .42); c.rotate(Math.atan2(LIGHT.y, LIGHT.x) + Math.PI / 2);
    c.fillStyle = `rgba(255,253,245,${st === 'broth' ? .16 : .1})`; c.beginPath(); c.ellipse(0, 0, R * .26, R * .045, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,253,245,${st === 'broth' ? .1 : .06})`; c.beginPath(); c.ellipse(R * .05, R * .09, R * .16, R * .025, 0, 0, TAU); c.fill(); c.restore();
  }
  if (!a.rect && st !== 'pool' && st !== 'dressing') { c.lineWidth = R * .03; c.strokeStyle = C.rgba(C.light(b.col, .5), .28); c.beginPath(); c.arc(cx, cy, R * .985, 0, TAU); c.stroke(); c.lineWidth = R * .012; c.strokeStyle = C.rgba(C.dark(b.col, .5), .3); c.beginPath(); c.arc(cx, cy, R * .955, Math.PI * .1, Math.PI * .9); c.stroke(); }
  // specular sheen
  const sg = c.createRadialGradient(cx + LIGHT.x * R * .45, cy + LIGHT.y * R * .45, 0, cx + LIGHT.x * R * .45, cy + LIGHT.y * R * .45, R * .55);
  sg.addColorStop(0, `rgba(255,252,240,${st === 'broth' ? .22 : .16})`); sg.addColorStop(1, 'rgba(255,252,240,0)'); c.fillStyle = sg; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  c.restore();
}

/* ---------- sprites & rendering ---------- */
const _scratch = mkCanvas();
function itemSprite(it, S, target) {
  const e = EXT[it.g] || 1.05, px = it.s * S, size = Math.ceil(px * e * 1.5 + 6);
  const cv = target || mkCanvas();
  cv.width = cv.height = size; const c = cv.getContext('2d');
  c.clearRect(0, 0, size, size);
  c.translate(size / 2, size / 2); c.rotate(it.rot); c.scale(px, px);
  const cr = Math.cos(-it.rot), sr = Math.sin(-it.rot); LX = LIGHT.x * cr - LIGHT.y * sr; LY = LIGHT.x * sr + LIGHT.y * cr;
  try { G[it.g](c, mulberry(it.seed), it.col, it.v || {}); } catch (e) { console.warn('glyph', it.g, e); }
  LX = LIGHT.x; LY = LIGHT.y;
  if (it.sub) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = it.sub; c.fillStyle = it.subCol; c.fillRect(0, 0, size, size); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  cv._size = size; return cv;
}
function drawItem(c, it, S, sprite, opts = {}) {
  const spr = sprite || itemSprite(it, S, _scratch), size = spr._size;
  const lift = opts.lift || 0, sc = 1 + lift * 1.6;
  c.save();
  const sh = it.sub ? .45 : 1;
  c.shadowColor = `rgba(20,10,4,${(opts.shadowA != null ? opts.shadowA : .42) * sh})`;
  c.shadowBlur = Math.max(1, it.s * S * (.22 + lift * 1.5)); c.shadowOffsetX = it.s * S * (.07 + lift * 1.2); c.shadowOffsetY = it.s * S * (.1 + lift * 1.6);
  if (it.grp) { c.shadowBlur = it.s * S * (.04 + lift); c.shadowOffsetX = it.s * S * (.012 + lift * .5); c.shadowOffsetY = it.s * S * (.02 + lift * .7); }
  if (opts.alpha != null) c.globalAlpha = opts.alpha;
  const w = size * sc; c.drawImage(spr, it.x * S - w / 2 + (opts.dx || 0), it.y * S - w / 2 + (opts.dy || 0), w, w);
  c.restore();
}
function renderUnder(scene, S, c) {
  c.save(); c.scale(S, S);
  scene.vessels.forEach((v, i) => { const r = mulberry(strHash(scene.id + i)); V[v.type](c, v, r); });
  c.restore();
}
function renderBase(scene, S, c, reveal = 1) { c.save(); c.scale(S, S); scene.vessels.forEach(v => drawBase(c, v, null, reveal)); c.restore(); }
let _grain = null;
function grainPattern(c) {
  if (!_grain) { const g = mkCanvas(128, 128), gc = g.getContext('2d'), r = mulberry(77), d = gc.createImageData(128, 128); for (let i = 0; i < d.data.length; i += 4) { const v = 110 + r() * 146; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } gc.putImageData(d, 0, 0); _grain = g; }
  return c.createPattern(_grain, 'repeat');
}
function renderOver(scene, S, c) {
  // sauce smears and stray crumbs on the rim of plated dishes
  c.save(); c.scale(S, S);
  scene.vessels.forEach((v, vi) => {
    if (v.type !== 'plate' || !v.base || !v.area.r) return; const r = mulberry(strHash(scene.id + 'smear' + vi)), a = v.area;
    for (let i = 0; i < 3; i++) { const ang = r() * TAU, d = a.r * (1.02 + r() * .1); c.save(); c.translate(a.cx + Math.cos(ang) * d, a.cy + Math.sin(ang) * d); c.rotate(ang + Math.PI / 2); c.fillStyle = C.rgba(v.base.col, .55 + r() * .3); c.beginPath(); c.ellipse(0, 0, a.r * (.04 + r() * .08), a.r * (.012 + r() * .015), 0, 0, TAU); c.fill(); c.restore(); }
  });
  c.restore();
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .07; c.fillStyle = grainPattern(c);
  scene.vessels.forEach(v => { c.save(); c.beginPath(); if (v.w) c.rect((v.x - v.w / 2) * S, (v.y - v.h / 2) * S, v.w * S, v.h * S); else if (v.R) c.arc(v.x * S, v.y * S, v.R * S, 0, TAU); c.clip(); c.fillRect(0, 0, S, S); c.restore(); });
  c.restore();
  c.save(); c.scale(S, S);
  scene.vessels.forEach(v => { if (v.area.glass) glassOver(c, v); else if (!v.area.rect) innerShadow(c, v.area); });
  c.restore();
}
function renderScene(scene, S, cv) {
  cv = cv || mkCanvas(S, S); cv.width = cv.height = S; const c = cv.getContext('2d');
  renderUnder(scene, S, c); renderBase(scene, S, c);
  for (const it of scene.items) drawItem(c, it, S);
  renderOver(scene, S, c);
  return cv;
}
