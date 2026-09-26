setTimeout(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const R = DATA.recipes;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(2, window.devicePixelRatio || 1);
const store = {
  get(k, d) { try { const v = localStorage.getItem('linas:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('linas:' + k, JSON.stringify(v)); } catch (e) { } }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- loader ---------------- */
const LOADER = (() => {
  const el = document.getElementById('loader'), t0 = performance.now(); let heroOk = false, hidden = !el;
  const hide = () => { if (hidden) return; hidden = true; setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 800); }, Math.max(0, 450 - (performance.now() - t0))); };
  const check = n => { if (!hidden && heroOk && ((n || 0) >= 10 || performance.now() - t0 > 1400)) hide(); };
  setTimeout(() => { heroOk = true; check(99); }, 2600);
  return { progress(n) { if (hidden) return; const N = document.getElementById('ldN'), b = document.getElementById('ldBar'); if (N) N.textContent = n; if (b) b.style.transform = `scaleX(${Math.min(1, n / 89)})`; check(n); }, hero() { heroOk = true; check(thumbsDone); } };
})();

/* ---------------- book order ---------------- */
const ORDER = [], META = {};
CHAPTERS.forEach(ch => {
  let i = 0;
  ch.sections.forEach(([sec, ids]) => ids.forEach(id => { i++; ORDER.push(id); META[id] = { ch, sec, page: i, ref: ch.n + ':' + i }; }));
  ch.count = i;
});
const SCENES = {};
const scene = id => SCENES[id] || (SCENES[id] = buildScene(R[id], VIS[id] || {}));
const flat = id => scene(id).flat;

/* ---------------- stone table texture ---------------- */
(function stone() {
  const S = 420, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = '#1c2225'; c.fillRect(0, 0, S, S);
  const rnd = mulberry(7);
  const wrap = (fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) fn(dx, dy); };
  for (let i = 0; i < 26; i++) {
    const x = rnd() * S, y = rnd() * S, r = 40 + rnd() * 120, a = .025 + rnd() * .035, light = rnd() < .5;
    wrap((dx, dy) => { const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, light ? `rgba(120,140,145,${a})` : `rgba(0,0,0,${a * 1.6})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); });
  }
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * S, y = rnd() * S, r = .3 + rnd() * .9, l = rnd();
    c.fillStyle = l < .5 ? `rgba(210,220,220,${.02 + rnd() * .05})` : `rgba(0,0,0,${.05 + rnd() * .12})`;
    c.fillRect(x, y, r, r);
  }
  document.documentElement.style.setProperty('--stone', `url(${cv.toDataURL('image/png')})`);
  document.body.classList.add('stone');
})();

/* ---------------- sound ---------------- */
const SND = {
  on: store.get('sound', false), ctx: null, master: null, amb: null,
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = .55; this.master.connect(this.ctx.destination); } catch (e) { return null; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  noiseBuf() { if (this._nb) return this._nb; const c = this.ctx, b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (this._nb = b); },
  plop(size = .05, pan = 0) {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime; if (t - (this._lp || 0) < .03) return; this._lp = t;
    const o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    const f = clamp(820 - size * 3800, 170, 900) * (.85 + Math.random() * .3);
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .42, t + .08);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .11);
    o.connect(g); if (p) { p.pan.value = clamp(pan, -1, 1); g.connect(p).connect(this.master); } else g.connect(this.master);
    o.start(t); o.stop(t + .13);
  },
  tick() {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf(); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2; const g = c.createGain();
    g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + .04);
  },
  chime() {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime;
    [[880, .2], [1318.5, .12], [1760, .06]].forEach(([f, a], i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.0001, t + i * .12); g.gain.exponentialRampToValueAtTime(a, t + i * .12 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + i * .12 + 1.6); o.connect(g).connect(this.master); o.start(t + i * .12); o.stop(t + i * .12 + 1.7); });
  },
  ambience(kind) {
    if (this.amb && this.amb.kind === kind) return;
    if (this.amb) { this.amb.stop(); this.amb = null; }
    if (!kind || !this.on) return; const c = this.ensure(); if (!c) return;
    const out = c.createGain(); out.gain.value = 0; out.connect(this.master); out.gain.setTargetAtTime(kind === 'sizzle' ? .22 : .5, c.currentTime, .4);
    let timer;
    if (kind === 'sizzle') {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf(); s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = .6; const g = c.createGain(); g.gain.value = .3;
      s.connect(f).connect(g).connect(out); s.start();
      timer = setInterval(() => { g.gain.setTargetAtTime(.12 + Math.random() * .5 * (Math.random() < .2 ? 2 : 1), c.currentTime, .015); }, 45);
      this.amb = { kind, stop() { clearInterval(timer); out.gain.setTargetAtTime(0, c.currentTime, .2); setTimeout(() => { try { s.stop(); } catch (e) { } }, 900); } };
    } else {
      timer = setInterval(() => { if (Math.random() < .55) { const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f0 = 140 + Math.random() * 260; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + .06); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08 + Math.random() * .08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .09); o.connect(g).connect(out); o.start(t); o.stop(t + .1); } }, 110);
      this.amb = { kind, stop() { clearInterval(timer); out.gain.setTargetAtTime(0, c.currentTime, .2); } };
    }
  },
  meow(p = 1) {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth'; const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 6; const g = c.createGain();
    o.frequency.setValueAtTime(420 * p, t); o.frequency.linearRampToValueAtTime(760 * p, t + .16); o.frequency.linearRampToValueAtTime(480 * p, t + .5);
    f1.frequency.setValueAtTime(900, t); f1.frequency.linearRampToValueAtTime(2200, t + .18); f1.frequency.linearRampToValueAtTime(1100, t + .5);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .05); g.gain.setValueAtTime(.35, t + .3); g.gain.exponentialRampToValueAtTime(.0001, t + .55);
    o.connect(f1).connect(g).connect(this.master); o.start(t); o.stop(t + .6);
  },
  purr(sec = 2) {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf(); s.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180; const g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 24; lg.gain.value = .35; lfo.connect(lg).connect(g.gain); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.45, t + .3); g.gain.setValueAtTime(.45, t + sec - .4); g.gain.linearRampToValueAtTime(0, t + sec);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); lfo.start(t); s.stop(t + sec + .1); lfo.stop(t + sec + .1);
  },
  tada() {
    if (!this.on) return; const c = this.ensure(); if (!c) return; const t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; const s = t + i * .09 + (i === 3 ? .06 : 0); g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.18, s + .01); g.gain.exponentialRampToValueAtTime(.0001, s + (i === 3 ? .9 : .25)); o.connect(g).connect(this.master); o.start(s); o.stop(s + 1); });
  },
  toggle() { this.on = !this.on; store.set('sound', this.on); if (this.on) { this.ensure(); this.plop(.03); } else this.ambience(null); syncSoundBtn(); }
};
function syncSoundBtn() { const b = $('#soundBtn'); b.setAttribute('aria-pressed', SND.on); b.title = SND.on ? 'Ljud på' : 'Ljud av'; $('.w', b).style.opacity = SND.on ? 1 : .25; }
$('#soundBtn').addEventListener('click', () => SND.toggle()); syncSoundBtn();

/* ---------------- quantities ---------------- */
const FR = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
function toNum(s) { s = s.trim().replace(',', '.'); const m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3]; const f = s.match(/^(\d+)\/(\d+)$/); if (f) return f[1] / f[2]; return parseFloat(s); }
function fmtNum(n) {
  if (n >= 20) return String(Math.round(n / (n >= 100 ? 10 : 1)) * (n >= 100 ? 10 : 1));
  const w = Math.floor(n + 1e-9), f = n - w;
  for (const [v, g] of FR) if (Math.abs(f - v) < .04) return (w || !g ? String(w) : '') + g;
  if (Math.abs(f - 1) < .04) return String(w + 1);
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}
const QRE = /^((?:ca|Ca)\.?\s+)?((?:\d+\s+)?\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s*-\s*((?:\d+\s+)?\d+\/\d+|\d+(?:[.,]\d+)?))?(?=\s|[a-zA-ZåäöÅÄÖ]|$)/;
function splitQty(text) {
  let pre = '', s = text, post = '', label = '';
  const w = s.match(/^([(\[])(.*)([)\]])$/); if (w) { pre = w[1]; s = w[2]; post = w[3]; }
  const lb = s.match(/^([A-ZÅÄÖ][a-zåäö]+:\s*)(.*)$/); if (lb) { label = lb[1]; s = lb[2]; }
  const m = s.match(QRE);
  if (!m) return { pre, label, q: null, rest: s, post };
  let rest = s.slice(m[0].length).replace(/^\s+/, ''), unit = '';
  const u = rest.match(/^(msk|tsk|krm|dl|cl|ml|l|L|g|gram|kg|st|förp|burkar|burk|pkt|paket|krukor|kruka|knippe|klyftor|klyfta|portioner|portion|cm|nypa|kub|skivor|stjälkar|kvistar)(?=\s|$)/);
  if (u) { unit = u[1]; rest = rest.slice(u[0].length).replace(/^\s+/, ''); }
  return { pre, label, ca: m[1] || '', a: toNum(m[2]), b: m[3] ? toNum(m[3]) : null, raw: m[0], unit, rest, post };
}
function qtyHTML(text, k) {
  const p = splitQty(text);
  if (p.a == null) return { q: '', t: esc(p.pre + p.label + p.rest + p.post) };
  const q = (p.ca ? 'ca ' : '') + fmtNum(p.a * k) + (p.b != null ? '–' + fmtNum(p.b * k) : '') + (p.unit ? ' ' + p.unit : '');
  return { q: esc(q), t: esc(p.pre + p.label + p.rest + p.post) };
}

/* ---------------- ingredient icons ---------------- */
const ICONS = {};
function iconFor(k) {
  if (ICONS[k] !== undefined) return ICONS[k];
  const kk = K[k]; let url = null;
  if (kk && (kk.g || kk.grp || kk.liq)) {
    const S = 64 * DPR, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
    const g = kk.grp ? kk.grp : kk.g, col = kk.col || (kk.liq && kk.liq[0]);
    const big = { nest: .95, ricepile: .95 }[g];
    const it = { g: g || 'dab', col, v: kk.v || (g === 'nest' ? { n: 16, w: .05 } : g === 'ricepile' ? { n: 260 } : {}), s: big || (g === 'dust' || g === 'pepper' || g === 'herbspecks' || g === 'flakes' ? .8 : .62), x: .5, y: .5, rot: -.5, seed: 11, L: 3 };
    if (!kk.g && !kk.grp) { it.g = 'dab'; it.s = .7; }
    if (g === 'ricepile') it.v = { n: 300 };
    drawItem(c, it, S, null, { shadowA: .3 });
    url = cv.toDataURL();
  }
  return (ICONS[k] = url);
}

/* ---------------- thumbnails ---------------- */
const THUMB_IMG = {}, URLS = {}, waiting = {}, inflight = new Set();
const queue = []; let pumping = false, pool = null, poolReady = false;
function thumbPx() { return Math.round(clamp(230 * DPR, 280, 460)); }
function wantThumb(id, front) { if (THUMB_IMG[id] || inflight.has(id)) return; const i = queue.indexOf(id); if (i >= 0) queue.splice(i, 1); front ? queue.unshift(id) : queue.push(id); pump(); }
function thumbURL(id) {
  if (URLS[id]) return URLS[id]; const b = THUMB_IMG[id]; if (!b) return null;
  const c = mkCanvas(b.width, b.height); c.getContext('2d').drawImage(b, 0, 0);
  let u = c.toDataURL('image/webp', .9); if (!u.startsWith('data:image/webp')) u = c.toDataURL(); return (URLS[id] = u);
}
let thumbsDone = 0;
function gotThumb(id, bmp) { inflight.delete(id); if (THUMB_IMG[id]) return; THUMB_IMG[id] = bmp; thumbsDone++; LOADER.progress(thumbsDone); (waiting[id] || []).forEach(f => f()); delete waiting[id]; }
const WORKER_GLUE = `onmessage = e => { const out = []; for (const { id, S } of e.data) { try { const cv = renderScene(buildScene(DATA.recipes[id], VIS[id] || {}), S); out.push({ id, bmp: cv.transferToImageBitmap() }); } catch (err) { out.push({ id, err: String(err) }); } } postMessage(out, out.filter(o => o.bmp).map(o => o.bmp)); };`;
async function initPool() {
  try {
    if (typeof OffscreenCanvas === 'undefined' || !window.Worker || !OffscreenCanvas.prototype.transferToImageBitmap) throw 0;
    let src = document.getElementById('core')?.textContent;
    if (!src) src = (await Promise.all(['data.js', 'engine.js', 'book.js'].map(f => fetch(f + location.search).then(r => r.text())))).join('\n');
    const url = URL.createObjectURL(new Blob([src + '\n' + WORKER_GLUE], { type: 'text/javascript' }));
    const n = clamp((navigator.hardwareConcurrency || 4) - 1, 1, 4);
    pool = [];
    for (let i = 0; i < n; i++) {
      const w = new Worker(url); w.busy = false;
      w.onmessage = e => { w.busy = false; e.data.forEach(o => o.bmp ? gotThumb(o.id, o.bmp) : (inflight.delete(o.id), mainThumb(o.id))); pump(); };
      w.onerror = ev => { ev.preventDefault && ev.preventDefault(); pool = null; inflight.forEach(id => { inflight.delete(id); queue.unshift(id); }); pump(); };
      pool.push(w);
    }
  } catch (e) { pool = null; }
  poolReady = true; pump();
}
function mainThumb(id) { const cv = renderScene(scene(id), thumbPx()); gotThumb(id, cv); }
function pump() {
  if (!queue.length || !poolReady) return;
  if (pool) {
    for (const w of pool) { if (w.busy || !queue.length) continue; const batch = queue.splice(0, 2).filter(id => !THUMB_IMG[id] && !inflight.has(id)); if (!batch.length) continue; batch.forEach(id => inflight.add(id)); w.busy = true; w.postMessage(batch.map(id => ({ id, S: thumbPx() }))); }
    return;
  }
  if (pumping) return; pumping = true;
  const id = queue.shift(); if (!THUMB_IMG[id]) mainThumb(id);
  pumping = false; setTimeout(pump, 0);
}
function onThumb(id, fn, lazy) { if (THUMB_IMG[id]) fn(thumbURL(id)); else { (waiting[id] = waiting[id] || []).push(() => fn(thumbURL(id))); wantThumb(id, !lazy); } }
function onBitmap(id, fn) { if (THUMB_IMG[id]) fn(THUMB_IMG[id]); else { (waiting[id] = waiting[id] || []).push(() => fn(THUMB_IMG[id])); wantThumb(id, true); } }

/* ---------------- the table (index) ---------------- */
const book = $('#book'), tabs = $('#tabs');
const CARDS = {};
function buildBook() {
  let html = '';
  CHAPTERS.forEach(ch => {
    html += `<section class="chapter" id="flik-${ch.n}" style="--c:${ch.color}"><div class="ch-head"><span class="ch-num">${ch.n}</span><h2>${esc(ch.name)}</h2><p class="ch-sub">Flik ${ch.n} · ${ch.count} recept · ${ch.sections.map(s => esc(s[0])).join(' · ')}</p></div>`;
    ch.sections.forEach(([sec, ids]) => {
      html += `<div class="sec"><h3>${esc(sec)}</h3><div class="grid">`;
      ids.forEach(id => {
        const r = R[id], m = META[id], rot = ((strHash(id) % 100) - 50) * .08;
        const meta = (r.parts[0].meta || [])[0] || (r.parts.length > 1 && !VIS[id]?.multi ? r.parts.length + ' delar' : '') || (r.parts.length > 1 ? r.parts.length + ' varianter' : '');
        const n = r.parts.reduce((a, p) => a + p.ing.length, 0);
        html += `<button class="card" type="button" data-id="${id}"><span class="plate" style="--r:${rot}deg"><canvas></canvas></span><span class="c-title">${esc(r.title)}</span><span class="c-meta"><span class="ref">${m.ref}</span><span>${esc(meta || n + ' ingredienser')}</span></span></button>`;
      });
      html += `</div></div>`;
    });
    html += `</section>`;
  });
  html += `<p class="noresult" id="noresult" hidden>Inga recept matchar din sökning.</p>`;
  if (DATA.wish && DATA.wish.length) {
    html += `<section class="wish" style="--c:var(--muted)"><div class="sec"><h3>Sidor som väntar på recept</h3><div class="grid">${DATA.wish.map(w => `<div class="card"><span class="plate"></span><span class="c-title">${esc(w.replace(/^\((.*)\)$/, '$1'))}</span><span class="c-meta"><span>Namnet står sist i Linas lista, receptet saknas.</span></span></div>`).join('')}</div></div></section>`;
  }
  html += `<footer class="colophon"><span>Linas recept · ${ORDER.length} recept i fyra flikar</span><span>Tallrikarna ritas i din webbläsare, ur varje recepts ingredienslista.</span></footer>`;
  book.innerHTML = html;
  $$('.card[data-id]', book).forEach(el => { CARDS[el.dataset.id] = el; el.addEventListener('click', () => openRecipe(el.dataset.id, { from: el })); });
  tabs.innerHTML = CHAPTERS.map(ch => `<a class="tab" href="#flik-${ch.n}" style="--tc:${ch.color}" data-n="${ch.n}"><b>${ch.n}</b><span>${esc(ch.short)}</span></a>`).join('') + `<a class="tab tab-k" href="#koket" style="--tc:#c9895a" data-n="k" data-act="kitchen"><b>5</b><span>Köket</span></a>`;
  $('.tab-k', tabs).addEventListener('click', e => { e.preventDefault(); KIT && KIT.open(); });
  document.body.classList.add('has-tabs');
  // thumbnails: visible first
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const id = e.target.dataset.id; wantThumb(id, true); io.unobserve(e.target); } }), { rootMargin: '500px 0px' });
  Object.entries(CARDS).forEach(([id, el]) => {
    io.observe(el);
    (waiting[id] = waiting[id] || []).push(() => { const b = THUMB_IMG[id], c = $('canvas', el); c.width = b.width; c.height = b.height; c.getContext('2d').drawImage(b, 0, 0); requestAnimationFrame(() => $('.plate', el).classList.add('ready')); });
  });
  ORDER.forEach(id => wantThumb(id));
  // active tab
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const n = e.target.id.split('-')[1]; $$('.tab', tabs).forEach(t => t.classList.toggle('on', t.dataset.n === n)); } }), { rootMargin: '-45% 0px -50% 0px' });
  $$('.chapter', book).forEach(s => cio.observe(s));
}

/* ---------------- search ---------------- */
const qEl = $('#q');
function applySearch() {
  const q = qEl.value.trim().toLowerCase();
  let any = 0;
  ORDER.forEach(id => {
    const r = R[id]; let hit = !q || r.title.toLowerCase().includes(q) || r.parts.some(p => p.ing.some(t => t.toLowerCase().includes(q)));
    CARDS[id].hidden = !hit; if (hit) any++;
  });
  $$('.sec', book).forEach(s => s.classList.toggle('empty', !!q && !$$('.card[data-id]:not([hidden])', s).length && !s.closest('.wish')));
  $$('.chapter', book).forEach(s => s.classList.toggle('empty', !!q && !$$('.card:not([hidden])', s).length));
  $('.wish', book) && ($('.wish', book).hidden = !!q);
  $('#noresult').hidden = any > 0;
  $$('.tab[href^="#flik"]', tabs).forEach(t => t.classList.toggle('off', !!q && $('#flik-' + t.dataset.n).classList.contains('empty')));
}
qEl.addEventListener('input', () => { applySearch(); if (qEl.value && window.scrollY < $('#book').offsetTop - 80) $('#bar').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });

/* ---------------- overlays ---------------- */
const openStack = [];
function showOverlay(el) { el.hidden = false; if (!openStack.includes(el)) openStack.push(el); document.documentElement.style.overflow = 'hidden'; }
function hideOverlay(el) { el.hidden = true; const i = openStack.indexOf(el); if (i >= 0) openStack.splice(i, 1); if (!openStack.length) document.documentElement.style.overflow = ''; }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openStack.length) { e.preventDefault(); closeTop(); return; }
  const inField = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
  if (e.key === '/' && !inField && !openStack.length) { e.preventDefault(); qEl.focus(); }
  const top = openStack[openStack.length - 1];
  if (top === $('#recipe') && !inField) { if (e.key === 'ArrowRight') stepRecipe(1); if (e.key === 'ArrowLeft') stepRecipe(-1); }
  if (top === $('#cook') && !inField) { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); cookGo(1); } if (e.key === 'ArrowLeft') cookGo(-1); }
});
function closeTop() {
  const top = openStack[openStack.length - 1]; if (!top) return;
  if (top.id === 'recipe') closeRecipe(); else if (top.id === 'kitchen') KIT.back(); else if (top.id === 'cook') closeCook(); else if (top.id === 'pantry') hideOverlay(top); else if (top.id === 'spin') closeSpin(); else hideOverlay(top);
}
$$('[data-close]').forEach(b => b.addEventListener('click', () => { const o = b.closest('.overlay, .sheet'); if (o.id === 'kitchen') { KIT.close(); return; } if (o === openStack[openStack.length - 1]) closeTop(); else hideOverlay(o); }));
$$('[data-act]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'spin') openSpin(); if (a === 'pantry') openPantry(); if (a === 'show') startShow(); if (a === 'kitchen') KIT && KIT.open(); }));

/* ================= recipe view: the plate ================= */
const rv = { id: null, k: 1, raf: 0, layers: null, S: 0, items: [], hover: -9, show: false };
const plateEl = $('#rPlate'), stage = $('#rStage'), tip = $('#rTip');
const tilt = document.createElement('div'); tilt.className = 'r-tilt'; tilt.style.cssText = 'transform-style:preserve-3d;transition:transform .6s cubic-bezier(.2,.8,.2,1)';
plateEl.parentNode.insertBefore(tilt, plateEl); tilt.appendChild(plateEl);
const LAYERS = ['under', 'base', 'settled', 'fly', 'over', 'steam', 'spot'];
function ensureLayers() {
  if (rv.layers) return rv.layers;
  rv.layers = {};
  LAYERS.forEach(n => { const c = document.createElement('canvas'); c.className = 'l-' + n; plateEl.appendChild(c); rv.layers[n] = c; });
  const st = document.createElement('style');
  st.textContent = `.r-plate canvas{transition:filter .3s}.r-plate.focus .l-under,.r-plate.focus .l-base,.r-plate.focus .l-settled,.r-plate.focus .l-over{filter:brightness(.5) saturate(.5)}.l-spot{filter:drop-shadow(0 0 10px rgba(255,236,190,.35))}`;
  document.head.appendChild(st);
  return rv.layers;
}
function sizeLayers() {
  const w = plateEl.getBoundingClientRect().width || 600; const S = Math.round(clamp(w * DPR, 300, 1500));
  rv.S = S; Object.values(rv.layers).forEach(c => { c.width = c.height = S; });
  return S;
}
const ease = { outBack: t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2), outCubic: t => 1 - Math.pow(1 - t, 3) };
function playPlate(id, opts = {}) {
  cancelAnimationFrame(rv.raf); cancelAnimationFrame(rv.sraf);
  const L = ensureLayers(); const S = sizeLayers(); const sc = portionScene(scene(id), rv.k); const copies = sc.copies || 1;
  const ctx = {}; LAYERS.forEach(n => { ctx[n] = L[n].getContext('2d'); ctx[n].setTransform(1, 0, 0, 1, 0, 0); ctx[n].clearRect(0, 0, S, S); });
  const underC = [];
  for (let ci = 0; ci < copies; ci++) { const cc = mkCanvas(S, S); renderUnder({ vessels: sc.vessels.filter(v => (v.copy || 0) === ci), id: sc.id }, S, cc.getContext('2d')); underC.push(cc); }
  const drawUnder = t => { ctx.under.clearRect(0, 0, S, S); underC.forEach((cc, ci) => { const p = copies === 1 ? 1 : clamp((t - ci * 210) / 620, 0, 1); if (p <= 0) return; const e = ease.outBack(p); ctx.under.save(); ctx.under.globalAlpha = clamp(p * 2, 0, 1); ctx.under.translate((1 - e) * S * .55, (1 - e) * S * .12); ctx.under.translate(S / 2, S / 2); ctx.under.rotate((1 - e) * .5); ctx.under.translate(-S / 2, -S / 2); ctx.under.drawImage(cc, 0, 0); ctx.under.restore(); }); };
  const enterEnd = copies === 1 ? 0 : (copies - 1) * 210 + 620;
  drawUnder(copies === 1 ? 1e9 : 0);
  plateEl.classList.remove('focus');
  const hasBase = sc.vessels.some(v => v.base);
  const items = sc.items.map((it, i) => ({ it, i }));
  // groups by ingredient in draw order
  const groups = []; let last = null;
  items.forEach(o => { const key = o.it.L + '|' + o.it.ing; if (!last || last.key !== key) { last = { key, ing: o.it.ing, list: [] }; groups.push(last); } last.list.push(o); });
  const instant = REDUCED || opts.instant;
  const t0 = performance.now(), baseStart = 120 + enterEnd * .9, baseDur = hasBase ? 700 : 0;
  const rainStart = baseStart + (hasBase ? 420 : 60), D = clamp(900 + items.length * 5, 1300, 2600);
  groups.forEach((g, gi) => { const st = rainStart + (gi / Math.max(1, groups.length)) * D; g.st = st; g.list.forEach(o => { o.st = st + Math.random() * clamp(260 + g.list.length * 6, 260, 620); o.dur = o.it.grp ? 720 : 480 + Math.random() * 160; o.spin = (Math.random() - .5) * 2.4; o.done = false; }); });
  rv.items = items; rv.groups = groups; rv.scene = sc; rv.S = S;
  const cx = S / 2, cy = S / 2;
  if (instant) {
    drawUnder(1e9); renderOver(sc, S, ctx.over); renderBase(sc, S, ctx.base); items.forEach(o => { drawItem(ctx.settled, o.it, S); o.done = true; }); onPlateDone(); return;
  }
  const pourLine = ing => { if (ing < 0) return; const li = $(`#rBody li[data-i="${ing}"]`); if (li) { li.classList.add('pour'); setTimeout(() => li.classList.remove('pour'), 650); } if (rv.show) $('#sLine').textContent = scene(id).flat[ing]?.t || ''; };
  // sprites prepared lazily just before each item falls
  const frame = now => {
    const t = now - t0;
    if (t <= enterEnd + 40) drawUnder(t); else if (!rv._over) { rv._over = 1; drawUnder(1e9); renderOver(sc, S, ctx.over); }
    if (hasBase && t >= baseStart && t < baseStart + baseDur + 40) { const p = clamp((t - baseStart) / baseDur, 0, 1); ctx.base.clearRect(0, 0, S, S); renderBase(sc, S, ctx.base, ease.outCubic(p)); if (!rv._basePoured) { rv._basePoured = 1; sc.vessels.forEach(v => v.base && v.base.from.forEach(pourLine)); } }
    const f = ctx.fly; f.clearRect(0, 0, S, S);
    let pending = 0;
    for (const g of groups) if (!g.fired && t >= g.st) { g.fired = 1; pourLine(g.ing); }
    for (const o of items) {
      if (o.done) continue; pending++;
      if (t < o.st - 30) continue;
      if (!o.spr) o.spr = itemSprite(o.it, S);
      const p = clamp((t - o.st) / o.dur, 0, 1);
      if (p >= 1) { drawItem(ctx.settled, o.it, S, o.spr); o.done = true; SND.plop(o.it.s, (o.it.x - .5) * 1.6); continue; }
      if (p <= 0) continue;
      const lift = (1 - p * p) * (o.it.grp ? .5 : .85);
      const X = o.it.x * S, Y = o.it.y * S, k = 1 + lift * .45, cc = sc.centers ? sc.centers[o.it.copy || 0] : [.5, .5];
      const dx = (X - cc[0] * S) * (k - 1), dy = (Y - cc[1] * S) * (k - 1);
      f.save(); f.translate(X + dx, Y + dy); f.rotate(o.spin * lift); f.translate(-X, -Y);
      drawItem(f, o.it, S, o.spr, { lift: lift * .6, alpha: clamp(p * 3.2, 0, 1) });
      f.restore();
    }
    if (pending) rv.raf = requestAnimationFrame(frame); else { f.clearRect(0, 0, S, S); onPlateDone(); }
  };
  rv._basePoured = 0; rv._over = 0;
  rv.raf = requestAnimationFrame(frame);
}
const COLD = new Set(['pastasallad', 'paprika-chorizo', 'islatte', 'dalgona', 'overnight-oats', 'chiapudding', 'avokadotoast', 'bruschetta']);
const isHot = id => { const m = META[id]; if (COLD.has(id)) return false; if (m.ch.n === 2 || m.ch.n === 1) return true; return ['Varma såser', 'Tillbehör'].includes(m.sec) || ['varm-choklad', 'bananpannkakor', 'scrambled-tofu', 'fattiga-riddare'].includes(id); };
function steamLoop() {
  cancelAnimationFrame(rv.sraf); const L = rv.layers; if (!L || !rv.id || !isHot(rv.id) || REDUCED) return;
  const c = L.steam.getContext('2d'), S = rv.S, sc = rv.scene, centers = sc.centers || [[.5, .5]], sz = sc.copies > 1 ? (sc.copies === 2 ? .6 : .5) : 1, t0 = performance.now();
  const loop = now => {
    if ($('#recipe').hidden) return; const t = (now - t0) / 1000; c.clearRect(0, 0, S, S);
    const fade = Math.min(1, t / 1.5);
    centers.forEach(([cx, cy], ci) => { for (let i = 0; i < 7; i++) { const p = ((t * .22 + i / 7 + ci * .13) % 1); const x = (cx + Math.sin(t * .7 + i * 1.9) * .06 * sz + (i - 3) * .03 * sz) * S, y = (cy + (.05 - p * .32) * sz) * S, r = S * sz * (.05 + p * .1);
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${.12 * Math.sin(p * Math.PI) * fade})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } });
    rv.sraf = requestAnimationFrame(loop);
  };
  rv.sraf = requestAnimationFrame(loop);
}
function onPlateDone() { rv.ready = true; if (rv.hover !== -9) spotlight(rv.hover); steamLoop(); }
// hover: item under the pointer → ingredient
function unitPt(e) { const r = plateEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, r]; }
function hitTest(u, v) {
  const sc = rv.scene; if (!sc) return null;
  for (let i = sc.items.length - 1; i >= 0; i--) { const it = sc.items[i]; if (!(it.ing >= 0)) continue; const d = Math.hypot(it.x - u, it.y - v); const rad = it.grp ? it.s * .45 : Math.max(.018, it.s * .5); if (d < rad) return { ing: it.ing, it }; }
  for (const v_ of sc.vessels) { if (!v_.base) continue; const a = v_.area; const inside = a.rect ? (u > a.rect[0] && u < a.rect[0] + a.rect[2] && v > a.rect[1] && v < a.rect[1] + a.rect[3]) : Math.hypot(u - a.cx, v - a.cy) < a.r; if (inside && v_.base.from.length) return { base: v_ }; }
  return null;
}
function spotlight(ing, baseV) {
  const L = rv.layers; if (!L) return; const s = L.spot.getContext('2d'), S = rv.S; s.clearRect(0, 0, S, S);
  const sc = rv.scene; rv.hover = ing;
  $$('#rBody li.hot').forEach(li => li.classList.remove('hot'));
  if (ing === -9 && !baseV) { plateEl.classList.remove('focus'); return; }
  plateEl.classList.add('focus');
  if (baseV) { s.save(); s.scale(1, 1); renderBase({ vessels: [baseV], id: sc.id }, S, s); s.restore(); baseV.base.from.forEach(i => { const li = $(`#rBody li[data-i="${i}"]`); li && li.classList.add('hot'); }); }
  else {
    const vs = sc.vessels.filter(v => v.base && v.base.from.includes(ing)); if (vs.length) renderBase({ vessels: vs, id: sc.id }, S, s);
    sc.items.forEach(it => { if (it.ing === ing) drawItem(s, it, S); });
    const li = $(`#rBody li[data-i="${ing}"]`); li && li.classList.add('hot');
  }
}
const plateHover = e => {
  if (!rv.ready) return; const [u, v, r] = unitPt(e); const h = hitTest(u, v);
  const key = h ? (h.base ? 'b' + h.base.x : h.ing) : null;
  if (key !== rv._hk) { rv._hk = key; if (h) { spotlight(h.base ? -1 : h.ing, h.base); } else spotlight(-9); }
  if (h) {
    let head, body;
    if (h.base) { head = 'Såsen, av'; body = h.base.base.from.map(i => rv.scene.flat[i].t.replace(/^[\d.,/\s–-]+(msk|tsk|krm|dl|cl|g|kg|L|l|st|förp|burk|pkt)?\s*/i, '')).join(', '); }
    else { const fi = rv.scene.flat[h.ing]; head = famOf(fi.k) || KLABEL[fi.k] || ''; body = fi.t; }
    tip.innerHTML = (head ? `<b>${esc(head)}</b>` : '') + esc(body); tip.style.left = (e.clientX - stage.getBoundingClientRect().left) + 'px'; tip.style.top = (e.clientY - stage.getBoundingClientRect().top) + 'px'; tip.classList.add('on');
  } else tip.classList.remove('on');
};
plateEl.addEventListener('pointermove', plateHover);
plateEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { rv._hk = undefined; plateHover(e); } });
plateEl.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; rv._hk = null; tip.classList.remove('on'); spotlight(-9); tilt.style.transform = ''; });
document.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || !rv.ready) return; if (!e.target.closest('#rPlate, #rBody li[data-i]')) { rv._hk = null; tip.classList.remove('on'); spotlight(-9); } });
stage.addEventListener('pointermove', e => { if (REDUCED || e.pointerType === 'touch') return; const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tilt.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`; });
stage.addEventListener('pointerleave', () => { tilt.style.transform = ''; });

/* ================= recipe view: the paper ================= */
const rBody = $('#rBody');
function portionsOf(r) { for (const p of r.parts) for (const m of (p.meta || [])) { const mm = m.match(/(\d+)\s*(portion|portioner)/i); if (mm) return +mm[1]; } return null; }
function renderPaper(id) {
  const r = R[id], m = META[id], k = rv.k, fl = flat(id), sc = scene(id);
  const overlay = $('#recipe'); overlay.style.setProperty('--c', m.ch.color);
  $('#rChip span').textContent = `Flik ${m.ch.n} · ${m.ch.name}`; $('#rRef').textContent = `sida ${m.ref} · ${m.sec}`;
  $('#rTitle').textContent = r.title;
  const metas = r.parts.flatMap(p => p.meta || []);
  $('#rMeta').textContent = metas.length ? metas.join(' · ') : (r.parts.length > 1 ? r.parts.map(p => p.label).filter(Boolean).join(' · ') : '');
  $('#rMeta').hidden = !$('#rMeta').textContent;
  const por = portionsOf(r); $('#rScaleLbl').textContent = por ? `${fmtNum(por * k)} ${por * k === 1 ? 'portion' : 'portioner'}` : (k === 1 ? 'Originalmängd' : `${fmtNum(k)} × receptet`);
  $$('#rScale button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === k));
  const visible = new Set(sc.items.map(i => i.ing)); sc.vessels.forEach(v => v.base && v.base.from.forEach(i => visible.add(i)));
  let html = '<h3>Ingredienser</h3>', idx = 0; const multi = r.parts.length > 1;
  r.parts.forEach((p, pi) => {
    if (multi && p.label) html += `<h4>${esc(p.label)}</h4>`;
    html += '<ul class="ings">';
    p.ing.forEach(t => {
      const i = idx++;
      if (/:$/.test(t)) { html += `<li class="head" data-i="${i}">${esc(t)}</li>`; return; }
      const { q, t: tt } = qtyHTML(t, k); const opt = /^[(\[]/.test(t);
      html += `<li data-i="${i}" class="${opt ? 'opt' : ''}${visible.has(i) ? '' : ' invisible'}"><span class="q">${q}</span><span class="t">${tt}</span></li>`;
    });
    html += '</ul>';
  });
  html += '<h3>Gör så här</h3>';
  r.parts.forEach((p, pi) => {
    if (multi && p.label && (p.steps || p.notes)) html += `<h4>${esc(p.label)}</h4>`;
    (p.notes || []).forEach(n => html += `<p class="note"><b>Obs</b>${esc(n)}</p>`);
    if (p.steps) html += `<ol class="steps">${p.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>`;
    (p.tips || []).forEach(n => html += `<p class="note"><b>Tips</b>${esc(n)}</p>`);
    (p.pairs || []).forEach(n => { const [a, ...b] = n.split(':'); html += `<p class="note"><b>${esc(a)}</b>${esc(b.join(':').trim())}</p>`; });
  });
  rBody.innerHTML = html;
  $$('li[data-i]', rBody).forEach(li => {
    const i = +li.dataset.i;
    li.addEventListener('pointerenter', e => { if (!rv.ready || e.pointerType !== 'mouse') return; spotlight(i); });
    li.addEventListener('pointerleave', e => { if (!rv.ready || e.pointerType !== 'mouse') return; spotlight(-9); });
    li.addEventListener('click', e => { if (!rv.ready) return; const on = li.classList.contains('hot'); spotlight(on ? -9 : i); if (!on && innerWidth < 981) stage.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); });
  });
  const pi = ORDER.indexOf(id), prev = ORDER[(pi - 1 + ORDER.length) % ORDER.length], next = ORDER[(pi + 1) % ORDER.length];
  $('#rNav').innerHTML = `<button type="button" data-go="${prev}"><small>← ${META[prev].ref}</small><span>${esc(R[prev].title)}</span></button><button type="button" data-go="${next}"><small>${META[next].ref} →</small><span>${esc(R[next].title)}</span></button>`;
  $$('#rNav button').forEach(b => b.addEventListener('click', () => gotoRecipe(b.dataset.go, b.dataset.go === next ? 1 : -1)));
}
$$('#rScale button').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; if (k === rv.k) return; rv.k = k; rv.ready = false; renderPaper(rv.id); playPlate(rv.id); }));
$('#rCook').addEventListener('click', () => openCook(rv.id));

function openRecipe(id, opts = {}) {
  if (!R[id]) return;
  const ov = $('#recipe'); const wasOpen = !ov.hidden;
  rv.id = id; rv.k = 1; rv.ready = false; rv.hover = -9;
  renderPaper(id);
  showOverlay(ov);
  $('#rPaper').scrollTop = 0; if (!wasOpen) ov.scrollTop = 0;
  plateEl.classList.remove('enter', 'leave'); void plateEl.offsetWidth; plateEl.classList.add('enter');
  requestAnimationFrame(() => playPlate(id));
  try { history.replaceState(null, '', '#' + id); } catch (e) { }
  if (!rv.show) setTimeout(() => $('#rPaper .x').focus({ preventScroll: true }), 50);
}
function gotoRecipe(id, dir = 1) {
  cancelAnimationFrame(rv.raf); rv.ready = false;
  plateEl.classList.remove('enter'); plateEl.classList.add('leave');
  plateEl.style.setProperty('--dir', dir);
  setTimeout(() => { plateEl.classList.remove('leave'); openRecipe(id); }, REDUCED ? 0 : 380);
}
function stepRecipe(d) { const i = ORDER.indexOf(rv.id); gotoRecipe(ORDER[(i + d + ORDER.length) % ORDER.length], d); }
function closeRecipe() {
  cancelAnimationFrame(rv.raf); stopShow(); hideOverlay($('#recipe')); rv.id = null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  SND.ambience(null);
}

/* ================= cook mode ================= */
const ck = { id: null, i: 0, list: [], checked: new Set() };
const STOP = new Set('msk tsk krm dl cl ml st förp burk burkar pkt paket kruka knippe klyfta klyftor gram portioner portion hackad hackade färsk färska fryst frysta torkad torkade malen mald riven rivna finriven grovriven grovhackad pressad gärna eller och med till valfri valfritt valfria stor stora små liten lite normalstora hela lätt ljus ljust mörk gul gula röd röda grön gröna vit vita svart svarta japansk kinesisk kinesiskt vegansk veganska veganskt växtbaserad växtbaserat fint fin skuren skalade urkärnade kokande rumsvarmt rumsvarma smält nymalen färskpressad kokta okokta vanliga blandade helst tinade crunchy fast mjölig mjöliga stjälkar stjälk kvistar bukett buketter några nypa skvätt saften zest skal saft soja ex. ca'.split(' '));
function keywords(t) {
  const out = new Set();
  t.toLowerCase().replace(/\(.*?\)/g, ' ').split(/[^a-zåäöéü]+/).filter(w => w.length >= 3 && !STOP.has(w)).forEach(w => {
    out.add(w.slice(0, Math.max(3, Math.min(6, w.length - (w.length > 5 ? 2 : 0)))));
    if (w.length >= 10) for (let i = 3; i <= w.length - 6; i++) out.add(w.slice(i, i + 6));
  });
  return [...out];
}
function stepIngredients(id, text) {
  const low = text.toLowerCase(), hits = [], ranges = [];
  flat(id).forEach((fi, i) => {
    if (/:$/.test(fi.t)) return;
    let found = false;
    for (const st of keywords(fi.t)) { const re = new RegExp('(^|[^a-zåäöé])(' + st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-zåäöé]*)', 'g'); let m; while ((m = re.exec(low))) { found = true; ranges.push([m.index + m[1].length, m.index + m[0].length]); } }
    if (found) hits.push(i);
  });
  ranges.sort((a, b) => a[0] - b[0]); const merged = []; for (const r of ranges) { const l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([...r]); }
  let html = '', p = 0; merged.forEach(([a, b]) => { html += esc(text.slice(p, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>'; p = b; }); html += esc(text.slice(p));
  return { hits, html };
}
const TRE = /(?:ca\s*)?(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(minuter|minut|min\b|timmar|timme|sekunder)/gi;
function timersIn(text) {
  const out = []; let m; TRE.lastIndex = 0;
  while ((m = TRE.exec(text))) { const a = parseFloat(m[1].replace(',', '.')), b = m[2] ? parseFloat(m[2].replace(',', '.')) : null; const unit = /tim/.test(m[3]) ? 60 : /sek/.test(m[3]) ? 1 / 60 : 1; out.push({ min: a * unit, label: (b ? `${m[1]}–${m[2]}` : m[1]) + (unit === 60 ? (a === 1 && !b ? ' timme' : ' timmar') : unit < 1 ? ' sek' : ' min') }); }
  return out;
}
function openCook(id) {
  const r = R[id]; ck.id = id; ck.i = 0; ck.checked = new Set();
  const list = [{ type: 'prep' }];
  r.parts.forEach(p => (p.steps || []).forEach(s => list.push({ type: 'step', part: r.parts.length > 1 ? p.label : null, text: s })));
  list.push({ type: 'done' }); ck.list = list;
  const ov = $('#cook'); ov.style.setProperty('--c', META[id].ch.color);
  $('#kTitle').textContent = r.title;
  onThumb(id, url => $('#kBg').src = url);
  showOverlay(ov); renderCook();
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => ck.lock = l).catch(() => { });
}
function closeCook() { PROC && PROC.stop(); hideOverlay($('#cook')); SND.ambience(null); try { ck.lock && ck.lock.release(); } catch (e) { } ck.lock = null; }
function cookGo(d) { ck.i = clamp(ck.i + d, 0, ck.list.length - 1); renderCook(); }
$('#kPrev').addEventListener('click', () => cookGo(-1));
$('#kNext').addEventListener('click', () => { if (ck.i === ck.list.length - 1) closeCook(); else cookGo(1); });
function ingLine(fi, k = 1) { const { q, t } = qtyHTML(fi.t, k); return { q, t }; }
function renderCook() {
  const r = R[ck.id], s = ck.list[ck.i], fl = flat(ck.id), steps = ck.list.filter(x => x.type === 'step').length;
  $('#kProg').innerHTML = ck.list.map((x, i) => `<i class="${i <= ck.i ? 'done' : ''}"></i>`).join('');
  let html = '';
  if (s.type === 'prep') {
    html += `<p class="k-count">Förbered · ${fl.filter(f => !/:$/.test(f.t)).length} ingredienser</p><p class="k-step">Plocka fram allt innan du börjar. Bocka av det du har framme.</p><ul class="k-list">`;
    fl.forEach((fi, i) => { if (/:$/.test(fi.t)) return; const { q, t } = ingLine(fi, rv.id === ck.id ? rv.k : 1); html += `<li data-i="${i}" class="${ck.checked.has(i) ? 'done' : ''}"><span class="q">${q}</span><span>${t}</span></li>`; });
    html += '</ul>';
    r.parts.forEach(p => (p.notes || []).forEach(n => html += `<p class="k-note"><b>Obs</b>${esc(n)}</p>`));
    SND.ambience(null);
  } else if (s.type === 'step') {
    const n = ck.list.slice(0, ck.i + 1).filter(x => x.type === 'step').length;
    const { hits, html: th } = stepIngredients(ck.id, s.text);
    html += `<div class="k-film"><canvas id="kFilm"></canvas><p class="k-film-cap" id="kFilmCap"></p></div><div class="k-text"><p class="k-count">Steg ${n} av ${steps}${s.part ? ' · ' + esc(s.part) : ''}</p><p class="k-step">${th}</p>`;
    if (hits.length) html += `<div class="k-chips">${hits.map(i => { const fi = fl[i], ic = iconFor(fi.k), { q, t } = ingLine(fi, rv.id === ck.id ? rv.k : 1); return `<span class="k-chip">${ic ? `<img src="${ic}" alt="">` : ''}${q ? `<span class="q">${q}</span>` : ''}${t}</span>`; }).join('')}</div>`;
    const tm = timersIn(s.text);
    if (tm.length) html += `<div class="k-tbtns">${tm.map((t, i) => `<button class="btn" type="button" data-t="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg>Starta timer · ${esc(t.label)}</button>`).join('')}</div>`;
    html += '</div>';
    const low = s.text.toLowerCase();
    SND.ambience(/stek|fräs|bryn|rosta|grilla|gratinera/.test(low) ? 'sizzle' : /koka|sjud|puttra|bubbl/.test(low) ? 'simmer' : null);
    setTimeout(() => $$('#kMain [data-t]').forEach(b => b.addEventListener('click', () => { const t = tm[+b.dataset.t]; addTimer(`${r.title} · steg ${n}`, t.min, t.label); b.disabled = true; b.style.opacity = .5; })), 0);
  } else {
    html += `<p class="k-count">Klart · ${esc(r.title)}</p><div class="k-mascot" id="kMascot"></div>`;
    r.parts.forEach(p => { (p.tips || []).forEach(n => html += `<p class="k-note"><b>Tips</b>${esc(n)}</p>`); (p.pairs || []).forEach(n => { const [a, ...b] = n.split(':'); html += `<p class="k-note"><b>${esc(a)}</b>${esc(b.join(':').trim())}</p>`; }); });
    SND.ambience(null);
  }
  const main = $('#kMain'); main.innerHTML = html; main.scrollTop = 0; main.classList.toggle('with-film', s.type === 'step');
  if (s.type === 'step' && PROC) PROC.play($('#kFilm'), $('#kFilmCap'), ck.id, s.text); else PROC && PROC.stop();
  $('#cook .k-bg').hidden = s.type === 'step';
  if (s.type === 'done') playMascot($('#kMascot'), ck.id, API);
  $$('.k-list li', main).forEach(li => li.addEventListener('click', () => { const i = +li.dataset.i; ck.checked.has(i) ? ck.checked.delete(i) : ck.checked.add(i); li.classList.toggle('done'); }));
  $('#kPrev').disabled = ck.i === 0; $('#kPrev').style.visibility = ck.i === 0 ? 'hidden' : '';
  $('#kNext').textContent = s.type === 'prep' ? 'Börja →' : ck.i === ck.list.length - 1 ? 'Stäng' : ck.i === ck.list.length - 2 ? 'Klart →' : 'Nästa →';
}
// swipe in cook mode
(() => { let x0 = null; const m = $('#cook'); m.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true }); m.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) cookGo(dx < 0 ? 1 : -1); x0 = null; }); })();

/* timers */
const timers = []; const tBox = $('#timers');
function addTimer(label, min, short) {
  const t = { id: Math.random().toString(36).slice(2), label, short, total: min * 60000, end: Date.now() + min * 60000, done: false };
  timers.push(t); drawTimers(); tickTimers();
}
function drawTimers() {
  tBox.innerHTML = timers.map(t => `<div class="timer${t.done ? ' ring' : ''}" data-id="${t.id}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(237,231,219,.15)" stroke-width="3"/><circle class="arc" cx="18" cy="18" r="15" fill="none" stroke="var(--c2)" stroke-width="3" stroke-linecap="round" stroke-dasharray="94.25" stroke-dashoffset="0"/></svg><div><span class="tt">0:00</span><small>${esc(t.label)}</small></div><button type="button" data-plus title="En minut till">+1</button><button type="button" data-x title="Ta bort" aria-label="Ta bort timer">×</button></div>`).join('');
  $$('.timer', tBox).forEach(el => { const t = timers.find(x => x.id === el.dataset.id); $('[data-x]', el).onclick = () => { timers.splice(timers.indexOf(t), 1); drawTimers(); }; $('[data-plus]', el).onclick = () => { if (t.done) { t.done = false; t.end = Date.now(); t.total = 60000; } t.end += 60000; t.total = Math.max(t.total, t.end - Date.now()); drawTimers(); tickTimers(); }; });
  tickTimers(true);
}
let tInt = 0;
function tickTimers(once) {
  const now = Date.now();
  timers.forEach(t => {
    const el = $(`.timer[data-id="${t.id}"]`, tBox); if (!el) return; const left = Math.max(0, t.end - now);
    const s = Math.ceil(left / 1000); $('.tt', el).textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    $('.arc', el).setAttribute('stroke-dashoffset', (94.25 * (1 - left / t.total)).toFixed(2));
    if (!left && !t.done) { t.done = true; el.classList.add('ring'); SND.chime(); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { } t._chime = setInterval(() => t.done && timers.includes(t) ? SND.chime() : clearInterval(t._chime), 5000); }
  });
  if (!once && !tInt && timers.length) tInt = setInterval(() => { if (!timers.length) { clearInterval(tInt); tInt = 0; } tickTimers(true); }, 250);
}

/* ================= show mode ("visningsläge") ================= */
const show = { on: false, i: 0, t: 0, timer: 0, start: 0 };
function startShow(from) {
  const ov = $('#recipe'); rv.show = true; show.on = true; ov.classList.add('show');
  show.i = from != null ? ORDER.indexOf(from) : Math.floor(Math.random() * ORDER.length);
  try { ov.requestFullscreen && ov.requestFullscreen().catch(() => { }); } catch (e) { }
  showNext(0);
}
function showNext(d) {
  if (!show.on) return; show.i = (show.i + d + ORDER.length) % ORDER.length; const id = ORDER[show.i];
  $('#sTitle').textContent = R[id].title; $('#sLine').textContent = `Flik ${META[id].ch.n} · ${META[id].ch.name}`;
  $('#recipe').style.setProperty('--c', META[id].ch.color);
  if ($('#recipe').hidden) openRecipe(id); else gotoRecipe(id, 1);
  const bar = $('#sBar'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = 'width 8.4s linear'; bar.style.width = '100%';
  clearTimeout(show.timer); show.timer = setTimeout(() => showNext(1), 8800);
}
function stopShow() {
  if (!show.on) return; show.on = false; rv.show = false; clearTimeout(show.timer); $('#recipe').classList.remove('show');
  try { document.fullscreenElement && document.exitFullscreen(); } catch (e) { }
}
$('#sExit').addEventListener('click', () => { stopShow(); renderPaper(rv.id); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && show.on) { stopShow(); } });
$('#rStage').addEventListener('click', e => { if (show.on && !e.target.closest('button')) showNext(1); });

/* ================= pantry ================= */
const BASIC = new Set(['none', 'water', 'broth', 'darkbroth', 'pepper', 'driedherb', 'spice', 'bay', 'clove', 'paprikap', 'turmeric', 'cinnamon', 'soy', 'chiliflakes', 'curry', 'bread', 'pearl', 'sesame']);
const FAMNAME = { cream: 'Grädde & crème fraiche', milk: 'Växtmjölk', mayo: 'Majonnäs', tomatopaste: 'Tomatpuré', mustard: 'Senap', pesto: 'Pesto', tahini: 'Tahini', hoisin: 'Hoisinsås', cocoa: 'Kakao', coffee: 'Kaffe', lemonslice: 'Citron', lime: 'Lime', orange: 'Apelsin', parm: 'Vegansk parmesan', feta: 'Vegansk fetaost', melt: 'Riven ost', cheeseslice: 'Vegansk ost', roe: 'Tångkaviar', nuts: 'Nötter', coconut: 'Kokos', chia: 'Chiafrön', poppy: 'Vallmofrön', jam: 'Sylt & gelé', lingon: 'Lingon', ice: 'Is', relish: 'Bostongurka', caper: 'Kapris', bbq: 'BBQ-sås', yeastflakes: 'Näringsjäst', sweetchili: 'Sweet chilisås', freshherb: 'Färska örter', friedonion: 'Gul lök', bacon: 'Vegobacon', cannedcherry: 'Körsbärstomater', yellowrice: 'Ris', cucshred: 'Gurka', avocube: 'Avokado', tofucrumble: 'Tofu', carrotshred: 'Morötter' };
const KLABEL = { pepper: 'Peppar', driedherb: 'Torkade örter', spice: 'Kryddor', paprikap: 'Paprikapulver', curry: 'Curry', chiliflakes: 'Chili', bay: 'Lagerblad', clove: 'Kryddnejlikor', juniper: 'Enbär', cinnamon: 'Kanel', sesame: 'Sesamfrön', pearl: 'Pärlsocker', bread: 'Bröd', none: '' };
const famOf = k => (K[k] && K[k].fam) || FAMNAME[k] || null;
let pantrySel = new Set(store.get('pantry', []));
const NEEDS = {};
ORDER.forEach(id => { const s = new Set(); flat(id).forEach(fi => { if (/^[(\[]/.test(fi.t) || /valfri/.test(fi.t) || /:$/.test(fi.t) || BASIC.has(fi.k)) return; const f = famOf(fi.k); if (f) s.add(f); }); NEEDS[id] = s; });
const FAMS = (() => { const c = {}, kind = {}; Object.values(NEEDS).forEach(s => s.forEach(f => c[f] = (c[f] || 0) + 1)); ORDER.forEach(id => flat(id).forEach(fi => { const f = famOf(fi.k); if (f && !kind[f] && (K[fi.k]?.g || K[fi.k]?.grp || K[fi.k]?.liq)) kind[f] = fi.k; })); return Object.keys(c).sort((a, b) => c[b] - c[a]).map(f => ({ f, n: c[f], k: kind[f] })); })();
function openPantry() {
  const el = $('#pantry');
  $('#pChips').innerHTML = FAMS.map(({ f, k }) => { const ic = k ? iconFor(k) : null; return `<button class="pchip" type="button" aria-pressed="${pantrySel.has(f)}" data-f="${esc(f)}">${ic ? `<img src="${ic}" alt="">` : ''}${esc(f)}</button>`; }).join('');
  $$('#pChips .pchip').forEach(b => b.addEventListener('click', () => { const f = b.dataset.f; pantrySel.has(f) ? pantrySel.delete(f) : pantrySel.add(f); b.setAttribute('aria-pressed', pantrySel.has(f)); store.set('pantry', [...pantrySel]); renderPantry(); }));
  renderPantry(); showOverlay(el); document.documentElement.style.overflow = '';
}
function pantryMatch() { return ORDER.map(id => { const need = NEEDS[id]; const miss = [...need].filter(f => !pantrySel.has(f)); return { id, miss, have: need.size - miss.length, need: need.size }; }); }
function renderPantry() {
  const res = $('#pResults');
  if (!pantrySel.size) { res.innerHTML = '<p class="pempty">Välj några saker du har hemma, så visas vad du kan laga.</p>'; applyPantry(false); return; }
  const m = pantryMatch().filter(x => x.need && x.have > 0);
  const full = m.filter(x => !x.miss.length).sort((a, b) => b.need - a.need), one = m.filter(x => x.miss.length === 1).sort((a, b) => b.have - a.have), two = m.filter(x => x.miss.length === 2).sort((a, b) => b.have - a.have);
  const row = x => `<button class="pres" type="button" data-id="${x.id}"><img alt="" data-thumb="${x.id}"><span>${esc(R[x.id].title)}<small>${x.miss.length ? 'Saknar ' + esc(x.miss.join(', ')) : 'Du har allt'}</small></span></button>`;
  res.innerHTML = (full.length ? `<h3>Du har allt · ${full.length}</h3>` + full.map(row).join('') : '') + (one.length ? `<h3>Saknar en sak · ${one.length}</h3>` + one.map(row).join('') : '') + (two.length ? `<h3>Saknar två saker · ${two.length}</h3>` + two.slice(0, 12).map(row).join('') : '') + (!full.length && !one.length && !two.length ? '<p class="pempty">Inget recept är nära än. Välj fler saker.</p>' : '');
  $$('[data-thumb]', res).forEach(im => onThumb(im.dataset.thumb, u => im.src = u));
  $$('.pres', res).forEach(b => b.addEventListener('click', () => { hideOverlay($('#pantry')); openRecipe(b.dataset.id); }));
  if (pantryOnTable) applyPantry(true);
}
let pantryOnTable = false;
function applyPantry(on) {
  pantryOnTable = on && pantrySel.size > 0;
  const m = pantryOnTable ? Object.fromEntries(pantryMatch().map(x => [x.id, x])) : null;
  ORDER.forEach(id => { const el = CARDS[id]; $('.badge', el)?.remove(); el.classList.remove('dim'); if (!m) return; const x = m[id]; if (x.miss.length > 1 || !x.have) el.classList.add('dim'); else { const b = document.createElement('span'); b.className = 'badge' + (x.miss.length ? '' : ' full'); b.textContent = x.miss.length ? 'Saknar ' + x.miss[0].toLowerCase() : 'Allt hemma'; el.prepend(b); } });
}
$('#pClear').addEventListener('click', () => { pantrySel.clear(); store.set('pantry', []); $$('#pChips .pchip').forEach(b => b.setAttribute('aria-pressed', 'false')); renderPantry(); applyPantry(false); });
$('#pShow').addEventListener('click', () => { applyPantry(true); hideOverlay($('#pantry')); $('#flik-1').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); });

/* ================= lazy susan ================= */
const sp = { on: false, ids: [], a: 0, w: 0, drag: null, raf: 0, pick: -1, imgs: [] };
function openSpin() {
  const pool = ORDER.filter(id => META[id].ch.n <= 2);
  const ids = []; const p = [...pool]; while (ids.length < 10 && p.length) ids.push(p.splice(Math.floor(Math.random() * p.length), 1)[0]);
  sp.ids = ids; sp.imgs = ids.map(id => THUMB_IMG[id] || renderScene(scene(id), Math.round(260 * DPR)));
  sp.a = Math.random() * TAU; sp.w = 0; sp.pick = -1; sp.on = true;
  $('#spinResult').textContent = ''; $('#spinOpen').hidden = true;
  showOverlay($('#spin')); sizeSpin(); spinLoop(); setTimeout(() => spinKick(), 350);
}
function closeSpin() { sp.on = false; cancelAnimationFrame(sp.raf); hideOverlay($('#spin')); }
const spc = $('#spinCanvas');
let woodCache = null;
function sizeSpin() { const r = spc.getBoundingClientRect(); spc.width = Math.round(r.width * DPR); spc.height = Math.round(r.height * DPR); woodCache = null; }
window.addEventListener('resize', () => { if (sp.on) sizeSpin(); });
function spinGeom() { const W = spc.width, H = spc.height; const Rt = Math.min(W * .46, H * .36); return { W, H, cx: W / 2, cy: H * .43, Rt }; }
function drawWood(R0) {
  const S = Math.ceil(R0 * 2.3), cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), m = S / 2, rnd = mulberry(99);
  c.save(); c.translate(m + R0 * .04, m + R0 * .07); const sg = c.createRadialGradient(0, 0, R0 * .8, 0, 0, R0 * 1.12); sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.beginPath(); c.arc(0, 0, R0 * 1.12, 0, TAU); c.fill(); c.restore();
  c.save(); c.translate(m, m);
  const g = c.createRadialGradient(-R0 * .3, -R0 * .35, R0 * .1, 0, 0, R0); g.addColorStop(0, '#c99a68'); g.addColorStop(.7, '#aa7a4c'); g.addColorStop(1, '#8a5f39');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R0, 0, TAU); c.fill();
  c.save(); c.clip();
  for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(${rnd() < .5 ? '90,55,25' : '230,190,140'},${.05 + rnd() * .1})`; c.lineWidth = R0 * (.002 + rnd() * .006); const y0 = -R0 + rnd() * R0 * 2; c.beginPath(); for (let x = -R0; x <= R0; x += R0 / 30) { const y = y0 + Math.sin(x / R0 * 3 + i) * R0 * .02 + Math.sin(x / R0 * 11 + i * 2) * R0 * .006; x === -R0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  c.restore();
  c.lineWidth = R0 * .018; c.strokeStyle = 'rgba(255,235,200,.35)'; c.beginPath(); c.arc(0, 0, R0 * .985, Math.PI * .95, Math.PI * 1.6); c.stroke();
  c.strokeStyle = 'rgba(40,20,5,.35)'; c.beginPath(); c.arc(0, 0, R0 * .985, -.1, Math.PI * .6); c.stroke();
  const word = 'Mathjulet'; c.font = `100px Caprasimo, Georgia, serif`; const fsz = Math.min(R0 * .13, 100 * R0 * .66 / c.measureText(word).width);
  c.fillStyle = 'rgba(60,35,15,.55)'; c.font = `${Math.round(fsz)}px Caprasimo, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, 0, R0 * .01);
  c.fillStyle = 'rgba(255,230,190,.18)'; c.fillText(word, -R0 * .004, -R0 * .004);
  c.restore(); return cv;
}
function spinDraw() {
  const { W, H, cx, cy, Rt } = spinGeom(), c = spc.getContext('2d'); c.clearRect(0, 0, W, H);
  if (!woodCache) woodCache = drawWood(Rt);
  c.save(); c.translate(cx, cy); c.rotate(sp.a); c.drawImage(woodCache, -woodCache.width / 2, -woodCache.height / 2);
  const n = sp.ids.length, pr = Rt * .66, ps = Rt * .56;
  sp.ids.forEach((id, i) => { const t = i / n * TAU; c.save(); c.translate(Math.cos(t) * pr, Math.sin(t) * pr); c.rotate(t + Math.PI / 2); const im = sp.imgs[i]; let z = ps; if (i === sp.pick) { c.shadowColor = 'rgba(255,214,140,.75)'; c.shadowBlur = 36 * DPR; z = ps * (1 + .14 * sp.glow); } c.drawImage(im, -z / 2, -z / 2, z, z); c.restore(); });
  c.restore();
  // pointer
  c.save(); c.translate(cx, cy - Rt - 14 * DPR); c.fillStyle = '#ede7db'; c.beginPath(); c.moveTo(-11 * DPR, -16 * DPR); c.lineTo(11 * DPR, -16 * DPR); c.lineTo(0, 6 * DPR); c.closePath(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 10; c.fill(); c.restore();
}
function spinIndexAtTop() { const n = sp.ids.length; let best = 0, bd = 9; for (let i = 0; i < n; i++) { let a = (sp.a + i / n * TAU + Math.PI / 2) % TAU; if (a < 0) a += TAU; const d = Math.min(a, TAU - a); if (d < bd) { bd = d; best = i; } } return best; }
let lastTickIdx = -1, lastT = 0;
function spinLoop(now = performance.now()) {
  if (!sp.on) return; const dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
  if (!sp.drag) {
    sp.a += sp.w * dt; sp.w *= Math.exp(-.9 * dt);
    if (Math.abs(sp.w) < .45 && Math.abs(sp.w) > 0 && sp.pick < 0) {
      const i = spinIndexAtTop(), n = sp.ids.length; const target = -Math.PI / 2 - i / n * TAU; let d = ((target - sp.a) % TAU + TAU * 1.5) % TAU - Math.PI;
      sp.w = sp.w * .9 + d * 3.2 * dt * 20; if (Math.abs(d) < .004 && Math.abs(sp.w) < .05) { sp.w = 0; sp.a += d; sp.pick = i; spinResult(); }
    }
  }
  const ti = spinIndexAtTop(); if (ti !== lastTickIdx) { if (lastTickIdx >= 0 && Math.abs(sp.w) > .2) SND.tick(); lastTickIdx = ti; }
  spinDraw(); sp.raf = requestAnimationFrame(spinLoop);
}
function spinResult() { sp.glow = 0; const g0 = performance.now(); const up = n => { sp.glow = Math.min(1, (n - g0) / 380); if (sp.glow < 1 && sp.on) requestAnimationFrame(up); }; requestAnimationFrame(up); const id = sp.ids[sp.pick]; $('#spinResult').textContent = R[id].title; $('#spinOpen').hidden = false; $('#spinQ').textContent = `Flik ${META[id].ch.n} · ${META[id].ch.name}`; SND.chime(); }
function spinKick() { sp.pick = -1; $('#spinResult').textContent = ''; $('#spinOpen').hidden = true; $('#spinQ').textContent = 'Vad blir det till middag?'; sp.w = (7 + Math.random() * 7) * (Math.random() < .5 ? 1 : -1); }
$('#spinGo').addEventListener('click', spinKick);
$('#spinOpen').addEventListener('click', () => { const id = sp.ids[sp.pick]; closeSpin(); openRecipe(id); });
(() => {
  const ang = e => { const r = spc.getBoundingClientRect(), { cx, cy } = spinGeom(); return Math.atan2((e.clientY - r.top) * DPR - cy, (e.clientX - r.left) * DPR - cx); };
  spc.addEventListener('pointerdown', e => { spc.setPointerCapture(e.pointerId); sp.drag = { a: ang(e), t: performance.now(), v: 0 }; sp.w = 0; sp.pick = -1; $('#spinOpen').hidden = true; $('#spinResult').textContent = ''; });
  spc.addEventListener('pointermove', e => { if (!sp.drag) return; const a = ang(e), now = performance.now(); let d = a - sp.drag.a; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; sp.a += d; const dt = Math.max(1, now - sp.drag.t) / 1000; sp.drag.v = sp.drag.v * .6 + (d / dt) * .4; sp.drag.a = a; sp.drag.t = now; });
  const up = () => { if (!sp.drag) return; sp.w = clamp(sp.drag.v, -22, 22); if (Math.abs(sp.w) < .5) sp.w = sp.w < 0 ? -.6 : .6; sp.drag = null; };
  spc.addEventListener('pointerup', up); spc.addEventListener('pointercancel', up);
})();

/* ================= hero: the title laid in ingredients ================= */
function initHero() {
  const cv = $('#heroCanvas'), hero = $('.hero'), h1 = $('#heroTitle');
  const PAL = [['pea', '#69a83a'], ['lentil', '#df8a3e'], ['chickpea', '#d9b373'], ['bean', '#efe3c8'], ['bean', '#2b2327'], ['bean', '#7b2a2a'], ['kernel', '#f2c53a'], ['tdice', '#df4a2e'], ['cherry', '#e2402a'], ['coin', '#e8792a'], ['garlic', '#f3ead2'], ['herbbits', '#3c8a2b'], ['chiliring', '#d4251c'], ['olive', '#4b2335'], ['caper', '#6f7b3a'], ['edamame', '#7db34a'], ['banana', '#f3e9c0'], ['blueberry', '#2f3a6a'], ['lingon', '#c81d25'], ['nut', '#caa06a'], ['tofu', '#f1e3bf'], ['avcube', '#b9d266'], ['radish', '#cf3557'], ['cuke', '#cfe3a0'], ['kernel', '#f2c53a'], ['pea', '#69a83a'], ['lentil', '#df8a3e'], ['chickpea', '#d9b373']];
  let W = 0, H = 0, ctx, P = [], sprites = [], running = false, ptr = { x: -1e4, y: -1e4, t: 0 }, lastMove = 0, built = false;
  function makeSprites(px) {
    sprites = [];
    PAL.forEach(([g, col], pi) => { for (let v = 0; v < 3; v++) {
      const it = { g, col, s: px, x: 0, y: 0, rot: Math.random() * TAU, seed: pi * 17 + v, v: {} };
      const raw = itemSprite(it, DPR); const pad = Math.ceil(px * DPR * .5); const out = document.createElement('canvas'); out.width = out.height = raw._size + pad * 2; const c = out.getContext('2d');
      c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = px * DPR * .35; c.shadowOffsetX = px * DPR * .1; c.shadowOffsetY = px * DPR * .16; c.drawImage(raw, pad, pad); out._size = out.width; sprites.push(out);
    } });
  }
  function layout() {
    const r = hero.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx = cv.getContext('2d');
    const gut = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
    const avail = W - gut * 2 - (innerWidth >= 900 ? 44 : 0);
    const m = document.createElement('canvas').getContext('2d');
    let fs = 300, lines = ['Linas recept'];
    m.font = `400 ${fs}px Caprasimo, Georgia, serif`; let w = m.measureText('Linas recept').width; fs = Math.min(260, fs * avail / w);
    if (fs < 110) { lines = ['Linas', 'recept']; m.font = `400 300px Caprasimo, Georgia, serif`; w = Math.max(m.measureText('Linas').width, m.measureText('recept').width); fs = Math.min(230, 300 * avail / w); }
    fs = Math.floor(fs);
    hero.style.setProperty('--title-size', fs + 'px'); hero.style.setProperty('--title-zone', Math.round(lines.length * fs * 1.02 + 20) + 'px');
    const hr = h1.getBoundingClientRect(), top = hr.top - r.top;
    const r2 = hero.getBoundingClientRect(); H = Math.round(r2.height); cv.height = Math.round(H * DPR);
    const off = document.createElement('canvas'); off.width = W; off.height = H; const o = off.getContext('2d');
    o.font = `400 ${fs}px Caprasimo, Georgia, serif`; o.fillStyle = '#000'; o.textBaseline = 'alphabetic';
    const zoneTop = h1.getBoundingClientRect().top - r2.top + 14, lineH = fs * 1.0;
    lines.forEach((ln, i) => o.fillText(ln, gut - fs * .02, zoneTop + fs * .8 + i * lineH));
    const data = o.getImageData(0, 0, W, H).data;
    const step = clamp(fs / 23, 4.4, 10), px = step * 1.66;
    makeSprites(px);
    const pts = [];
    for (let y = 0; y < H; y += step) for (let x = ((y / step) % 2) * step / 2; x < W; x += step) { const a = data[(Math.floor(y) * W + Math.floor(x)) * 4 + 3]; if (a > 140) pts.push([x + (Math.random() - .5) * step * .5, y + (Math.random() - .5) * step * .5]); }
    // loose ingredients spilled on the table
    const spill = Math.round(W / 34);
    for (let i = 0; i < spill; i++) { const top = Math.random() < .45; pts.push([gut + Math.random() * (W - gut * 2), top ? 4 + Math.random() * 16 : H - 6 - Math.random() * 18, 1]); }
    const old = P; P = pts.map((p, i) => {
      const o_ = old[i];
      const sx = o_ ? o_.x : p[0] + (Math.random() - .5) * 240, sy = o_ ? o_.y : -40 - Math.random() * H * .9;
      return { x: sx, y: sy, vx: 0, vy: 0, tx: p[0], ty: p[1], r: Math.random() * TAU, vr: 0, rot: (Math.random() - .5) * 1.6, s: sprites[Math.floor(Math.random() * sprites.length)], d: o_ ? 0 : (p[0] / W) * 900 + Math.random() * 420 + (p[2] ? 900 : 0), loose: !!p[2] };
    });
    if (REDUCED) P.forEach(p => { p.x = p.tx; p.y = p.ty; p.r = p.rot; });
    document.documentElement.classList.add('js-title');
    built = true; start(); LOADER.hero();
  }
  let t0 = 0;
  function start() { if (running) return; running = true; t0 = t0 || performance.now(); requestAnimationFrame(loop); }
  function loop(now) {
    if (!running) return;
    const t = now - t0; let moving = 0;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    const pr = 90, near = now - lastMove < 1200;
    for (const p of P) {
      if (t > p.d) {
        const k = p.loose ? .03 : .045;
        p.vx += (p.tx - p.x) * k; p.vy += (p.ty - p.y) * k;
        if (near) { const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < pr * pr) { const d = Math.sqrt(d2) || 1, f = (1 - d / pr) * 5.5; p.vx += dx / d * f; p.vy += dy / d * f; p.vr += (Math.random() - .5) * .08; } }
        p.vx *= .82; p.vy *= .82; p.vr *= .9; p.x += p.vx; p.y += p.vy; p.r += p.vr + (p.rot - p.r) * .02;
        if (Math.abs(p.vx) + Math.abs(p.vy) > .05 || Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > .5) moving++;
      } else { moving++; continue; }
      const sz = p.s._size / DPR;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.drawImage(p.s, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
    if (moving || near) requestAnimationFrame(loop); else running = false;
  }
  hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; lastMove = performance.now(); start(); });
  hero.addEventListener('pointerleave', () => { ptr.x = ptr.y = -1e4; });
  hero.addEventListener('click', e => { if (e.target.closest('a,button')) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; P.forEach(p => { const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1, f = Math.max(0, 1 - d / 700) * 38; p.vx += dx / d * f * (.6 + Math.random() * .8); p.vy += dy / d * f * (.6 + Math.random() * .8) - 6 * Math.random(); p.vr += (Math.random() - .5) * .6; }); SND.plop(.02); start(); });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(hero.getBoundingClientRect().width - W) > 40) layout(); }, 220); });
  const io = new IntersectionObserver(es => { es.forEach(e => { if (!e.isIntersecting) running = false; }); }); io.observe(hero);
  const go = () => { if (!built) layout(); };
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('400 100px Caprasimo'), new Promise(r => setTimeout(r, 2500))]).then(go, go); else go();
}

/* ================= boot ================= */
let KIT = null, PROC = null;
const shortName = t => { const p = splitQty(t); return (p.rest || '').replace(/\(.*?\)/g, '').replace(/[,\[\]]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' '); };
const API = { R, META, ORDER, CHAPTERS, DPR, REDUCED, esc, scene, flat, iconFor, qtyHTML, timersIn, stepIngredients, shortName, SND, THUMB_IMG, wantThumb, onThumb, onBitmap, thumbURL, showOverlay, hideOverlay, topOverlay: () => openStack[openStack.length - 1], openRecipe: id => openRecipe(id), openCook: id => openCook(id) };
$('#heroCount').textContent = ORDER.length + ' recept';
if (matchMedia('(pointer: coarse)').matches) { $('#heroHint').textContent = 'Titeln är lagd av bokens ingredienser. Dra fingret genom den, eller tryck.'; $('#rCaption').textContent = 'Tryck på maten för att se vad den är.'; }
buildBook();
initPool();
initHero();
try { KIT = initKitchen(API); } catch (e) { console.warn('kitchen', e); }
try { PROC = initProcess(API); } catch (e) { console.warn('process', e); }
window.__dbg = { PROC, KIT: () => KIT, API, playMascot: (host, id) => playMascot(host, id, API) };
const h = decodeURIComponent(location.hash.slice(1));
if (R[h]) setTimeout(() => openRecipe(h), 300);
else if (h === 'koket') setTimeout(() => KIT && KIT.open(), 200);
else if (/^flik-\d$/.test(h)) setTimeout(() => $('#' + h)?.scrollIntoView(), 100);
window.addEventListener('resize', () => { if (!$('#recipe').hidden && rv.id && rv.ready) { const w = plateEl.getBoundingClientRect().width; if (Math.abs(w * DPR - rv.S) > 40) playPlate(rv.id, { instant: true }); } });
}, 30);
