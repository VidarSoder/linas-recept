/* ==========================================================================
   Stegfilmer — every step in cook mode becomes a small, sunlit film of what
   you actually do, played with that step's own ingredients. What goes into
   the pot stays in the pot, and the last step ends in the finished dish.
   ========================================================================== */
function initProcess(A) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MB = globalThis.mulberry; const mulberry = s => MB((Math.imul((s | 0) ^ 0x5bd1e995, 2654435761) ^ ((s | 0) >>> 7)) >>> 0);
  const ACTIONS = [
    [/sätt (på )?ugnen|värm ugnen|sätt på en platta/, 'preheat', 'Värm ugnen'],
    [/grädda|gratinera|tillaga i ugn|in i ugnen|i ugnen i|in formen i|ställ in/, 'bake', 'Grädda'],
    [/riv (av |ner )?skalet|citronskal|apelsinskal|zest/, 'zest', 'Riv skalet'],
    [/\bfinriv|\bgrovriv|\briv\b|\briv(er|en)? |rivjärn/, 'grate', 'Riv'],
    [/pressa (ner |i )?(vitlök|vitlöken)|pressa vitlök|pressad vitlök|pressa ner den/, 'press', 'Pressa vitlöken'],
    [/\bskala\b/, 'peel', 'Skala'],
    [/finhacka|grovhacka|hacka|skiva|strimla|tärna|\bskär\b|dela |dela,|ansa|mortla|kärna ur|klyfta/, 'chop', 'Skär'],
    [/smält/, 'melt', 'Smält'],
    [/mosa|potatisstomp|stompa/, 'mash', 'Mosa'],
    [/mixa|stavmixer|mixkanna/, 'blend', 'Mixa'],
    [/vispa/, 'whisk', 'Vispa'],
    [/fräs|\bstek|bryn|rosta|glansig/, 'fry', 'Stek'],
    [/koka|sjud|puttra|bubbla/, 'boil', 'Koka'],
    [/skölj|krama ur/, 'rinse', 'Skölj'],
    [/häll av|sila|rinna av|ånga av/, 'drain', 'Häll av'],
    [/kavla|platta ut/, 'roll', 'Kavla'],
    [/knåda|arbeta (ihop|samman)/, 'knead', 'Knåda'],
    [/forma|rulla ihop|rulla små|platta till|rulla mördegen/, 'shape', 'Forma'],
    [/jäsa/, 'rise', 'Låt jäsa'],
    [/pensla/, 'brush', 'Pensla'],
    [/häll (i|på|över|ner|upp)|ringla/, 'pour', 'Häll'],
    [/tillsätt|lägg i|lägg ner|smula ner|vänd ner|rör ner|blanda ner|lägg över|lägg tillbaka/, 'add', 'Tillsätt'],
    [/blanda|rör om|rör ihop|rör samman|rör till|massera|vänd runt|fluffa/, 'mix', 'Blanda'],
    [/kylskåp|i kylen|kyl |över natten|kallna|svalna/, 'chill', 'Låt kallna'],
    [/låt stå|vila|låt dra|dra i|tina/, 'rest', 'Låt vila'],
    [/smaka av|salta|peppra|krydda|smaksätt/, 'season', 'Smaka av'],
    [/strö|toppa|garnera|fördela|fyll /, 'sprinkle', 'Strö över'],
    [/servera|lägg upp|dela ut/, 'serve', 'Servera']
  ];
  const VESSEL_WORDS = [[/stekpanna|pannan|\bpanna\b/, 'skillet'], [/gryta|kastrull|kastrullen|grytan/, 'pot'], [/bunke|skål|bunken|mixkanna|burk/, 'bowl'], [/ugnsform|formen|\bform\b|plåt/, 'dish']];
  const IN_VESSEL = new Set(['fry', 'boil', 'add', 'mix', 'blend', 'season', 'pour', 'melt', 'whisk', 'mash']);
  function segmentsOf(id, text) {
    const sents = text.split(/(?<=[.!?)])\s+(?=[A-ZÅÄÖ(])/);
    const out = []; let vessel = null, lastIngs = []; const fl = A.flat(id);
    sents.forEach(s => {
      const low = s.toLowerCase();
      let own = null; for (const [re, v] of VESSEL_WORDS) if (re.test(low)) { vessel = v; own = v; break; }
      const pastaK = /pasta|spaghetti|nudl|makaron|gnocchi|tagliatelle/.test(low) ? (fl.find(f => K[f.k] && (K[f.k].grp === 'nest' || ['penne', 'rigatoni', 'farfalle', 'macaroni', 'gnocchi'].includes(f.k))) || {}).k || ((VIS[id] || {}).extra || []).find(k => K[k] && (K[k].grp === 'nest' || K[k].g === 'tube')) : null;
      const hits = [];
      for (const [re, act, word] of ACTIONS) { const m = low.match(re); if (m) hits.push([m.index, act, word]); }
      hits.sort((a, b) => a[0] - b[0]);
      let { hits: ings } = A.stepIngredients(id, s);
      if (/alla ingredienser|ingredienserna|övriga ingredienser|resterande ingredienser|resten av ingredienserna|de torra/.test(low)) ings = fl.map((f, i) => /:$/.test(f.t) ? -1 : i).filter(i => i >= 0);
      if (!ings.length && lastIngs.length && !/alla|ugnen/.test(low)) ings = lastIngs; if (ings.length) lastIngs = ings;
      const temp = (s.match(/(\d{3})\s*°/) || [])[1];
      const uniq = []; hits.forEach(h => { if (!uniq.some(u => u[1] === h[1])) uniq.push(h); });
      const posOf = i => { const n = (A.shortName(fl[i].t) || '').toLowerCase().split(' ')[0]; if (!n) return 9999; const st_ = n.slice(0, Math.max(3, Math.min(5, n.length - 1))); const m = low.indexOf(st_); return m < 0 ? 9999 : m; };
      uniq.slice(0, 3).forEach(([at, act, word]) => { const ord = [...ings].sort((x, y) => { const px = posOf(x), py = posOf(y); const dx = px >= at ? px - at : 5000 + at - px, dy = py >= at ? py - at : 5000 + at - py; return dx - dy; }); out.push({ act, word, ings: ord, text: s, temp, vessel, own, pastaK, cold: /kyl|kallna|natten/.test(low) }); });
    });
    if (!out.length) out.push({ act: 'serve', word: 'Servera', ings: [], text, vessel });
    return out.filter((s, i) => i === 0 || s.act !== out[i - 1].act || s.text !== out[i - 1].text);
  }
  // what has already gone into the pot, and what colour the liquid has, before a given step
  function history(id, stepIdx) {
    const steps = A.R[id].parts.flatMap(p => p.steps || []), fl = A.flat(id);
    const kinds = [], liqs = [], prepped = []; let vessel = null;
    for (let i = 0; i < stepIdx; i++) segmentsOf(id, steps[i]).forEach(sg => {
      if (['chop', 'peel', 'grate', 'press', 'rinse'].includes(sg.act)) { sg.ings.forEach(ii => { const k = fl[ii] && fl[ii].k; if (k && K[k] && (K[k].g || K[k].grp) && !prepped.includes(k)) prepped.push(k); }); return; }
      if (!IN_VESSEL.has(sg.act)) return; if (sg.vessel) vessel = sg.vessel;
      if (sg.act === 'boil' && sg.pastaK && !sg.ings.length) return;
      sg.ings.forEach(ii => { const k = fl[ii] && fl[ii].k; if (!k || !K[k]) return; if ((K[k].g || K[k].grp) && !kinds.includes(k)) kinds.push(k); if (K[k].liq) liqs.push(k); });
    });
    return { kinds: kinds.slice(-6), liq: mixLiq(liqs), vessel, prepped: prepped.filter(k => !kinds.includes(k)).slice(-5) };
  }

  /* ---------------- helpers ---------------- */
  const SPR = new Map();
  function spriteOf(kind, px, seed = 1) {
    const k = K[kind]; if (!k || !(k.g || k.grp)) return null;
    const key = kind + '|' + Math.round(px) + '|' + seed; if (SPR.has(key)) return SPR.get(key);
    const it = { g: k.grp || k.g, col: k.col, v: k.v || (k.grp === 'nest' ? { n: 26, w: .05 } : k.grp === 'ricepile' ? { n: 500 } : {}), s: 1, x: 0, y: 0, rot: seed * 1.7, seed };
    const cv = itemSprite(it, px); SPR.set(key, cv); return cv;
  }
  function wholeOf(kind, px) {
    const w = WHOLE[kind]; if (!w) return spriteOf(kind, px, 7);
    const key = 'W' + kind + '|' + Math.round(px); if (SPR.has(key)) return SPR.get(key);
    const cv = itemSprite({ g: w[0], col: w[1] || (K[kind] && K[kind].col) || '#ccc', v: { kind: w[2] }, s: 1, x: 0, y: 0, rot: -.35, seed: 3 }, px); SPR.set(key, cv); return cv;
  }
  function shredOf(kind, px, seed = 1) { const k = K[kind]; if (!k) return null; const key = 'S' + kind + '|' + Math.round(px) + '|' + seed; if (SPR.has(key)) return SPR.get(key); const cv = itemSprite({ g: 'shred', col: C.light(k.col, .05), v: { w: .08 }, s: 1, x: 0, y: 0, rot: seed * 1.3, seed }, px); SPR.set(key, cv); return cv; }
  const liquidOf = kind => { const k = K[kind]; return k && (k.liq ? k.liq[0] : null); };
  function mixLiq(kinds) { let r = 0, g = 0, b = 0, w = 0; kinds.forEach(k => { const L = K[k] && K[k].liq; if (!L) return; const [cr, cg, cb] = C.rgb(L[0]); r += Math.log(Math.max(cr, 10)) * L[1]; g += Math.log(Math.max(cg, 10)) * L[1]; b += Math.log(Math.max(cb, 10)) * L[1]; w += L[1]; }); return w ? C.hex([Math.exp(r / w), Math.exp(g / w), Math.exp(b / w)]) : null; }
  function blit(c, spr, x, y, sc = 1, rot = 0, a = 1, shadow = true) {
    if (!spr) return; const s = spr._size * sc; c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
    if (shadow) { c.shadowColor = 'rgba(40,20,5,.4)'; c.shadowBlur = s * .12; c.shadowOffsetX = s * .05; c.shadowOffsetY = s * .08; }
    c.drawImage(spr, -s / 2, -s / 2, s, s); c.restore();
  }
  const fr = x => x - Math.floor(x);
  const eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const shade = (c, S, blur = .03, ox = .012, oy = .022, a = .42) => { c.shadowColor = `rgba(50,28,10,${a})`; c.shadowBlur = S * blur; c.shadowOffsetX = S * ox; c.shadowOffsetY = S * oy; };

  /* ---------------- the kitchen counter every film is shot on ---------------- */
  const BACK = new Map();
  const TOWELS = [['#f3eee4', '#c8473a'], ['#eef0ec', '#3f6a9a'], ['#f2ecdf', '#6b8f4e'], ['#f4efe6', '#d6923a']];
  const WOODS = ['#c99b69', '#d3a878', '#bf8f5f', '#caa16f'];
  function backdrop(S, seed) {
    const key = S + '|' + seed; if (BACK.has(key)) return BACK.get(key);
    if (BACK.size > 24) BACK.clear();
    const cv = mkCanvas(S, S), c = cv.getContext('2d'), r = mulberry(seed);
    c.save(); rr(c, 0, 0, S, S, S * .05); c.clip();
    const wood = WOODS[Math.floor(r() * WOODS.length)];
    const plank = S / 5.2;
    for (let i = 0; i < 6; i++) { const g = c.createLinearGradient(0, i * plank, 0, (i + 1) * plank); const col = C.mix(wood, r() < .5 ? C.light(wood, .1) : C.dark(wood, .08), r()); g.addColorStop(0, C.light(col, .04)); g.addColorStop(1, C.dark(col, .05)); c.fillStyle = g; c.fillRect(0, i * plank, S, plank);
      c.strokeStyle = C.rgba(C.dark(wood, .4), .16); c.lineWidth = S * .0018; for (let k = 0; k < 7; k++) { const y = i * plank + r() * plank; c.beginPath(); c.moveTo(0, y); for (let q = 1; q <= 14; q++) c.lineTo(q * S / 14, y + Math.sin(q * .9 + k + i) * S * .003); c.stroke(); }
      c.fillStyle = 'rgba(70,40,15,.28)'; c.fillRect(0, (i + 1) * plank - S * .002, S, S * .003); }
    const [tc, ts] = TOWELS[Math.floor(r() * TOWELS.length)], corner = Math.floor(r() * 4);
    c.save(); c.translate(corner % 2 ? S * .98 : S * .02, corner < 2 ? S * .03 : S * .97); c.rotate((corner % 2 ? 1 : -1) * (corner < 2 ? .5 : 2.6));
    shade(c, S, .02, .004, .008, .3); rr(c, -S * .2, -S * .12, S * .4, S * .24, S * .01); c.fillStyle = tc; c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = C.rgba(ts, .8); [-.08, -.06, .06, .08].forEach(f => c.fillRect(-S * .2, S * f, S * .4, S * .008)); c.restore();
    const deco = (x, y, kind) => { c.save(); c.translate(x, y); shade(c, S, .03, .01, .018, .35);
      if (kind === 'herb') { c.beginPath(); c.arc(0, 0, S * .075, 0, TAU); c.fillStyle = '#b8643c'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .062, 0, TAU); c.fillStyle = '#4a3322'; c.fill(); for (let i = 0; i < 10; i++) { c.save(); c.rotate(i / 10 * TAU + r()); c.translate(S * .04, 0); c.scale(S * .07, S * .07); G.basil(c, r, i % 2 ? '#3f8a2d' : '#4f9a36'); c.restore(); } }
      if (kind === 'salt') { c.beginPath(); c.arc(0, 0, S * .045, 0, TAU); c.fillStyle = '#efe9dd'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .034, 0, TAU); c.fillStyle = '#fbfaf6'; c.fill(); c.save(); scatterDots(c, r, 30, S * .03, S * .002, S * .004, ['#e8e4dc', '#ffffff'], [.6, 1], false); c.restore(); }
      if (kind === 'oil') { c.beginPath(); c.arc(0, 0, S * .04, 0, TAU); c.fillStyle = 'rgba(190,160,40,.85)'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .018, 0, TAU); c.fillStyle = '#2d3b20'; c.fill(); c.fillStyle = 'rgba(255,255,230,.5)'; c.beginPath(); c.arc(-S * .015, -S * .015, S * .008, 0, TAU); c.fill(); }
      if (kind === 'mill') { c.beginPath(); c.arc(0, 0, S * .035, 0, TAU); c.fillStyle = '#5a3e2a'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .012, 0, TAU); c.fillStyle = '#c9ced1'; c.fill(); }
      c.restore(); };
    const spots = [[.09, .12], [.91, .12], [.09, .88], [.91, .88]].filter((_, i) => i !== corner);
    ['herb', 'salt', 'oil', 'mill'].sort(() => r() - .5).slice(0, 2).forEach((k, i) => deco(S * spots[i][0], S * spots[i][1], k));
    const g = c.createLinearGradient(0, 0, S, S); g.addColorStop(0, 'rgba(255,240,205,.12)'); g.addColorStop(.6, 'rgba(255,240,205,0)'); g.addColorStop(1, 'rgba(60,30,10,.2)'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    const v = c.createRadialGradient(S / 2, S / 2, S * .35, S / 2, S / 2, S * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,5,.35)'); c.fillStyle = v; c.fillRect(0, 0, S, S);
    c.restore(); BACK.set(key, cv); return cv;
  }
  function sunlight(c, S, t, seed, step = 0) {
    const r = mulberry(seed), a = -.85 + r() * .15 + step * .09;
    c.save(); rr(c, 0, 0, S, S, S * .05); c.clip(); c.globalCompositeOperation = 'lighter';
    c.translate(S * .15, 0); c.rotate(a); const g = c.createLinearGradient(0, 0, S * .32, 0); g.addColorStop(0, 'rgba(255,230,170,0)'); g.addColorStop(.5, `rgba(255,230,170,${.05 + Math.sin(t * .6) * .015})`); g.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = g; c.fillRect(0, -S, S * .32, S * 3);
    for (let i = 0; i < 26; i++) { const p = fr(t * (.02 + (i % 5) * .006) + i * .137), x = S * .03 + (i * 37 % 100) / 100 * S * .26 + Math.sin(t * .8 + i) * S * .01, y = -S * .2 + p * S * 1.6; c.fillStyle = `rgba(255,245,220,${.5 * Math.sin(p * Math.PI)})`; c.beginPath(); c.arc(x, y, S * (.0015 + (i % 3) * .001), 0, TAU); c.fill(); }
    c.restore();
  }
  function burner(c, S, cx, cy, R, t, low) {
    c.save(); const n = 26;
    const glow = c.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.25); glow.addColorStop(0, 'rgba(90,140,255,.28)'); glow.addColorStop(1, 'rgba(90,140,255,0)'); c.fillStyle = glow; c.beginPath(); c.arc(cx, cy, R * 1.25, 0, TAU); c.fill();
    for (let i = 0; i < n; i++) { const a = i / n * TAU, fl = (low ? .05 : .09) + Math.sin(t * 20 + i * 1.7) * .02; const x0 = cx + Math.cos(a) * R, y0 = cy + Math.sin(a) * R, x1 = cx + Math.cos(a) * R * (1 + fl), y1 = cy + Math.sin(a) * R * (1 + fl);
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(120,170,255,.95)'); g.addColorStop(1, 'rgba(160,210,255,0)'); c.strokeStyle = g; c.lineWidth = S * .012; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    c.restore();
  }
  function steamPuffs(c, S, t, x, y, n = 5, w = .2) {
    for (let i = 0; i < n; i++) { const p = fr(t * .45 + i / n); const px = x + Math.sin(i * 2 + t) * S * w * .3 + (i - n / 2) * S * w * .15, py = y - p * S * .32, r = S * (.03 + p * .08);
      const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(255,255,255,${.34 * Math.sin(p * Math.PI)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2); }
  }
  function sparkles(c, S, t, n = 14, x = S / 2, y = S / 2, R = S * .4) {
    for (let i = 0; i < n; i++) { const p = fr(t * .5 + i * .31), a = i * 2.39, d = R * (.5 + (i * 29 % 50) / 100); const s = S * .014 * Math.sin(p * Math.PI); c.save(); c.translate(x + Math.cos(a) * d, y + Math.sin(a) * d); c.rotate(t + i); c.fillStyle = `rgba(255,244,200,${Math.sin(p * Math.PI)})`; c.beginPath(); for (let k = 0; k < 8; k++) { const rr_ = k % 2 ? s * .35 : s * 1.6; c.lineTo(Math.cos(k / 8 * TAU) * rr_, Math.sin(k / 8 * TAU) * rr_); } c.fill(); c.restore(); }
  }

  /* ---------------- tools ---------------- */
  // a knife whose cutting edge touches (x, y); ang points from the heel to the tip; lift 0..1 raises it towards the camera
  function knife(c, S, x, y, ang, lift = 0, style = 0) {
    const L = (style ? .2 : .3) * S, W = (style ? .045 : .07) * S, H = (style ? .16 : .19) * S, z = 1 + lift * .07;
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(z, z);
    c.shadowColor = `rgba(45,25,8,${.42 - lift * .15})`; c.shadowBlur = S * (.012 + lift * .03); c.shadowOffsetX = S * (.008 + lift * .03); c.shadowOffsetY = S * (.012 + lift * .045);
    // blade: edge along y = 0 from the heel (x = 0) to the tip (x = L), spine at y = -W
    c.beginPath(); c.moveTo(-L * .04, 0); c.lineTo(L * .82, 0); c.quadraticCurveTo(L, -W * .15, L * 1.02, -W * .55); c.quadraticCurveTo(L * .8, -W * 1.02, L * .45, -W); c.lineTo(-L * .04, -W); c.closePath();
    const g = c.createLinearGradient(0, -W, 0, 0); g.addColorStop(0, '#9ea4a8'); g.addColorStop(.35, '#e9ecee'); g.addColorStop(.8, '#c3c8cc'); g.addColorStop(1, '#f7f9fa'); c.fillStyle = g; c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = S * .003; c.beginPath(); c.moveTo(0, -S * .002); c.lineTo(L * .8, -S * .002); c.stroke();
    // bolster and handle continue behind the heel
    rr(c, -L * .08, -W * .95, L * .07, W * .85, S * .006); c.fillStyle = '#9aa0a4'; c.fill();
    rr(c, -L * .08 - H, -W * .9, H, W * .72, W * .32); c.fillStyle = style ? '#2e3b4a' : '#3a2a1f'; c.fill();
    c.fillStyle = '#d9cbb2'; [.25, .55, .8].forEach(f => { c.beginPath(); c.arc(-L * .08 - H * f, -W * .54, S * .0055, 0, TAU); c.fill(); });
    c.restore();
  }
  function woodBoard(c, S, round) {
    const path = () => { c.beginPath(); if (round) c.arc(S * .5, S * .52, S * .38, 0, TAU); else rr(c, S * .1, S * .22, S * .8, S * .58, S * .04); };
    c.save(); shade(c, S, .04, .012, .025, .45); path();
    const g = c.createLinearGradient(0, S * .2, 0, S * .85); g.addColorStop(0, '#e0b988'); g.addColorStop(1, '#b98a57'); c.fillStyle = g; c.fill(); c.restore();
    c.save(); path(); c.clip();
    c.strokeStyle = 'rgba(110,70,35,.2)'; c.lineWidth = S * .0025; for (let i = 0; i < 28; i++) { const y = S * (.16 + i * .025); c.beginPath(); c.moveTo(0, y); for (let k = 1; k <= 12; k++) c.lineTo(S * k / 12, y + Math.sin(k + i) * S * .003); c.stroke(); }
    c.strokeStyle = 'rgba(255,245,225,.3)'; c.lineWidth = S * .006; if (round) { c.beginPath(); c.arc(S * .5, S * .52, S * .372, Math.PI * .95, Math.PI * 1.6); c.stroke(); } c.restore();
  }
  function vessel(c, S, type, glaze = 'white', seed = 4) {
    const r = mulberry(seed); c.save(); c.scale(S, S);
    let a;
    if (type === 'skillet') a = V.skillet(c, { x: .47, y: .52, R: .31 }, r);
    else if (type === 'pot') a = V.pot(c, { x: .5, y: .52, R: .33, enamel: ['#2b2b2e', '#b8472e', '#2f4d6b', '#6b7a4a', '#e6e0d2'][seed % 5], inner: '#231d1b' }, r);
    else if (type === 'dish') a = V.ovendish(c, { x: .5, y: .52, w: .7, h: .5, glaze }, r);
    else if (type === 'colander') { V.bowl(c, { x: .5, y: .54, R: .33, glaze: 'white' }, r); c.fillStyle = '#b7bcc0'; c.beginPath(); c.arc(.5, .54, .33, 0, TAU); c.fill(); c.fillStyle = '#9aa0a4'; c.beginPath(); c.arc(.5, .54, .28, 0, TAU); c.fill(); c.fillStyle = 'rgba(30,30,30,.5)'; for (let i = 0; i < 90; i++) { const aa = r() * TAU, d = Math.sqrt(r()) * .26; c.beginPath(); c.arc(.5 + Math.cos(aa) * d, .54 + Math.sin(aa) * d, .005, 0, TAU); c.fill(); } a = { cx: .5, cy: .54, r: .26 }; }
    else a = V.bowl(c, { x: .5, y: .52, R: .34, glaze }, r);
    c.restore(); return a;
  }
  function liquid(c, S, a, col, t, style = 'still', level = 1) {
    if (!col) return; c.save(); c.beginPath(); if (a.rect) rr(c, a.rect[0] * S, a.rect[1] * S, a.rect[2] * S, a.rect[3] * S, S * .02); else c.arc(a.cx * S, a.cy * S, a.r * S * (style === 'rising' ? level : 1), 0, TAU); c.clip();
    const cx = (a.cx || .5) * S, cy = (a.cy || .52) * S, R = (a.r || .3) * S;
    const g = c.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R * 1.1); g.addColorStop(0, C.light(col, .15)); g.addColorStop(1, C.dark(col, .25)); c.fillStyle = g; c.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
    if (style === 'vortex') { c.strokeStyle = C.rgba(C.light(col, .35), .5); c.lineWidth = S * .008; for (let i = 0; i < 5; i++) { c.beginPath(); for (let k = 0; k < 60; k++) { const aa = k / 60 * TAU * 1.5 + t * 6 + i * 1.25, rr_ = R * (.95 - k / 60 * .9); c.lineTo(cx + Math.cos(aa) * rr_, cy + Math.sin(aa) * rr_); } c.stroke(); } }
    c.fillStyle = 'rgba(255,252,240,.14)'; c.beginPath(); c.ellipse(cx - R * .35, cy - R * .4, R * .3, R * .07, -.6, 0, TAU); c.fill();
    c.restore();
  }
  function bubbles(c, S, a, t, n = 24) {
    const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
    for (let i = 0; i < n; i++) { const p = fr(t * (.6 + (i % 5) * .15) + i * .37); const aa = i * 2.4, d = R * (.15 + ((i * 37) % 80) / 100); const x = cx + Math.cos(aa) * d, y = cy + Math.sin(aa) * d, r = S * (.006 + p * .02);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = `rgba(255,250,235,${.65 * (1 - p)})`; c.lineWidth = S * .003; c.stroke(); c.fillStyle = `rgba(255,255,255,${.15 * (1 - p)})`; c.fill(); }
  }
  function contents(c, S, a, kinds, t, opts = {}) {
    const R = (a.r || .28) * S, cx = (a.cx || .5) * S, cy = (a.cy || .52) * S;
    kinds.forEach((kk, ki) => { const n = opts.n || 7; for (let i = 0; i < n; i++) { const r = mulberry(i * 17 + ki * 3 + (opts.seed || 0)); const ang = r() * TAU + t * (opts.spin || .25) * (1 + r() * .5), d = Math.sqrt(r()) * R * .8;
      let sc = opts.scale || 1, al = 1; if (opts.drop != null) { const dp = clamp((opts.drop * 1.7 - (ki * .16 + i * .03)) / .35, 0, 1); if (dp <= 0) continue; sc *= 1 + (1 - dp) * 1.6; al = dp; }
      const hop = opts.hop ? Math.max(0, Math.sin(t * 9 + i * 2.1)) * S * .012 : 0;
      blit(c, spriteOf(kk, S * (opts.size || .075), 1 + i % 4), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d - hop + Math.sin(t * 2 + i) * S * .003, sc, r() * TAU + t * .3, al * (opts.alpha || 1)); } });
  }
  function oven(c, S, t, glow, dishImg, temp) {
    c.save(); shade(c, S, .05, .01, .03, .5);
    rr(c, S * .1, S * .08, S * .8, S * .84, S * .04); const g = c.createLinearGradient(0, S * .08, 0, S * .92); g.addColorStop(0, '#f1ece2'); g.addColorStop(1, '#d9d2c4'); c.fillStyle = g; c.fill(); c.restore();
    rr(c, S * .15, S * .12, S * .7, S * .11, S * .02); c.fillStyle = '#2a2b2e'; c.fill();
    [.22, .32, .68, .78].forEach((x, i) => { c.beginPath(); c.arc(S * x, S * .175, S * .03, 0, TAU); c.fillStyle = '#e9e5dc'; c.fill(); c.save(); c.translate(S * x, S * .175); c.rotate(i === 0 ? glow * 2.4 - 1.2 : i * .7); c.fillStyle = '#2a2b2e'; c.fillRect(-S * .004, -S * .026, S * .008, S * .02); c.restore(); });
    c.fillStyle = `rgba(255,${130 + glow * 60},60,${.4 + glow * .6})`; c.font = `500 ${S * .045}px "Spline Sans Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(temp ? Math.round(temp * Math.min(1, glow)) + '°' : '', S * .5, S * .175);
    rr(c, S * .17, S * .29, S * .66, S * .52, S * .03); c.fillStyle = '#141416'; c.fill();
    c.save(); rr(c, S * .19, S * .31, S * .62, S * .48, S * .025); c.clip();
    const w = c.createRadialGradient(S * .5, S * .56, S * .05, S * .5, S * .56, S * .45); w.addColorStop(0, `rgba(255,170,70,${.2 + glow * .55})`); w.addColorStop(1, `rgba(120,40,10,${.1 + glow * .3})`); c.fillStyle = w; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 2; i++) { c.strokeStyle = `rgba(255,${90 + i * 40},40,${(.4 + .5 * Math.sin(t * 3 + i)) * glow})`; c.lineWidth = S * .01; c.beginPath(); c.moveTo(S * .21, S * (.35 + i * .4)); for (let k = 0; k < 8; k++) c.lineTo(S * (.21 + k * .083), S * (.35 + i * .4) + (k % 2 ? S * .02 : 0)); c.stroke(); }
    c.strokeStyle = 'rgba(200,190,170,.25)'; c.lineWidth = S * .004; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(S * .19, S * (.58 + k * .003)); c.lineTo(S * .81, S * (.58 + k * .003)); c.stroke(); }
    if (dishImg) { const rise = 1 + glow * .05 + Math.sin(t * 2) * .008; const s = S * .42 * rise; c.globalAlpha = .96; c.drawImage(dishImg, S * .5 - s / 2, S * .56 - s * .36, s, s * .72); }
    c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(S * .19, S * .31); c.lineTo(S * .45, S * .31); c.lineTo(S * .3, S * .79); c.lineTo(S * .19, S * .79); c.fill();
    c.restore(); rr(c, S * .28, S * .84, S * .44, S * .035, S * .017); c.fillStyle = '#b9b3a6'; c.fill();
  }

  /* ---------------- scenes ---------------- */
  function kindsOf(id, seg) { const fl = A.flat(id); const ks = []; seg.ings.forEach(i => { const k = fl[i] && fl[i].k; if (k && !ks.includes(k)) ks.push(k); }); return ks; }
  function drawScene(c, S, t, seg, id, st) {
    const kinds = st.kinds, vis0 = kinds.filter(k => K[k] && (K[k].g || K[k].grp)), liq = kinds.map(liquidOf).filter(Boolean);
    let vis = seg.pastaK && ['boil', 'drain', 'add'].includes(seg.act) && !vis0.includes(seg.pastaK) ? [seg.pastaK, ...vis0] : vis0;
    const veg = /grönsakerna|grönsakerna|allt i|alltsammans/.test((seg.text || '').toLowerCase());
    if (!vis.length && st.hist.prepped && st.hist.prepped.length && (seg.act === 'fry' || seg.act === 'melt' || (seg.act === 'add' && (!liq.length || veg)))) vis = st.hist.prepped;
    const P = 3.6, p = fr(t / P), seed = st.seed;
    const baseCol = liq.length ? mixLiq(kinds) : (st.hist.liq || st.recipeBase || '#e2cfa3');
    const dough = st.doughy;
    const prev = [...st.hist.kinds, ...(st.within || [])].filter((k, i, arr) => !vis.includes(k) && arr.indexOf(k) === i).slice(-5);
    if (st.withinLiq && !st.hist.liq) st.hist = { ...st.hist, liq: st.withinLiq };
    c.drawImage(backdrop(S, st.rseed), 0, 0);
    const main = vis[Math.floor(t / P) % Math.max(1, vis.length)] || 'onion';
    switch (seg.act) {
      case 'chop': case 'peel': {
        woodBoard(c, S, seed % 3 === 0);
        const N = 9, u = fr(p * N), k = Math.floor(p * N), lift = .5 + .5 * Math.cos(u * TAU);
        if (!vis.length) { // cutting the dough into pieces
          const x0 = S * .24, x1 = S * .76, y0 = S * .42, y1 = S * .62, cutAt = i => x0 + (x1 - x0) * (i + 1) / (N + 1);
          c.save(); shade(c, S, .02, .005, .012, .3); c.fillStyle = dough; rr(c, x0, y0, x1 - x0, y1 - y0, S * .09); c.fill(); c.restore();
          c.strokeStyle = C.rgba(C.dark(dough, .35), .65); c.lineWidth = S * .005; for (let i = 0; i < k; i++) { c.beginPath(); c.moveTo(cutAt(i), y0 + S * .01); c.lineTo(cutAt(i), y1 - S * .01); c.stroke(); }
          knife(c, S, cutAt(k) - lift * S * .01, y1 + S * .02 - lift * S * .05, -Math.PI / 2, lift); break;
        }
        const kk = main, whole = wholeOf(kk, S * .36), ix = S * .6, iy = S * .5;
        const shape = WHOLE[kk] ? WHOLE[kk][0] : 'x', hw = S * (/wLong|wCarrot|wOnion|wGarlic/.test(shape) ? .17 : .14), hh = S * (/wLong|wCarrot/.test(shape) ? .06 : .13);
        if (seg.act === 'peel' && p < .55) { // a paring knife takes the skin off in one curling ribbon
          const q = p / .55, rot = t * 1.1, px = ix + hw * .92, py = iy;
          blit(c, whole, ix, iy, 1, rot * .15);
          const col = C.light((K[kk] || { col: '#c98d4a' }).col, .05); c.lineCap = 'round'; c.lineJoin = 'round';
          const pts = []; const n = Math.floor(10 + q * 50); for (let i = 0; i < n; i++) { const f = i / 60, a = f * TAU * 2.4; pts.push([px + S * .03 + f * S * .06 + Math.cos(a) * S * .035, py + S * .02 + f * S * .3 + Math.sin(a) * S * .02]); }
          ['rgba(60,35,15,.25)', col].forEach((st_, j) => { c.strokeStyle = st_; c.lineWidth = S * (j ? .014 : .018); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x + (j ? 0 : S * .006), y + (j ? 0 : S * .008)) : c.moveTo(x, y)); c.stroke(); });
          knife(c, S, px + Math.sin(t * 6) * S * .004, py + S * .01, -Math.PI / 2 - .25, .15, 1); break;
        }
        const q = seg.act === 'peel' ? (p - .55) / .45 : p, kc = Math.floor(q * N), uc = fr(q * N), lc = .5 + .5 * Math.cos(uc * TAU);
        const xL = ix - hw * .92, xR = ix + hw * .92, cutAt = i => xL + (xR - xL) * (i + 1) / (N + 1);
        const cutX = cutAt(Math.min(kc, N - 1)), done = kc + (uc > .5 ? 1 : 0), edge = done ? cutAt(done - 1) : xL - S;
        c.save(); c.beginPath(); c.rect(edge, 0, S, S); c.clip(); blit(c, whole, ix, iy, 1); c.restore();
        if (done) { c.save(); c.globalAlpha = .55; c.fillStyle = '#fbf6e8'; rr(c, edge - S * .003, iy - hh * .8, S * .006, hh * 1.6, S * .003); c.fill(); c.restore(); }
        // the slices slide off to a little pile on the left
        for (let i = 0; i < done * 2; i++) { const r = mulberry(i * 13 + seed), cut = Math.floor(i / 2); const tx = S * (.17 + r() * .19), ty = S * (.36 + r() * .28); const age = cut === done - 1 ? clamp((uc - .5) * 2.4, 0, 1) : 1; const sx = cutAt(cut) - S * .02; blit(c, spriteOf(kk, S * .07, 1 + i % 5), sx + (tx - sx) * eio(age), iy + (ty - iy) * eio(age), 1, r() * TAU); }
        if (seg.act === 'peel') { for (let i = 0; i < 3; i++) { c.save(); c.globalAlpha = .9; c.strokeStyle = C.light((K[kk] || { col: '#c98d4a' }).col, .05); c.lineWidth = S * .012; c.beginPath(); c.arc(S * (.8 + i * .03), S * (.74 + i * .02), S * .03, i, i + 4); c.stroke(); c.restore(); } }
        knife(c, S, cutX - lc * S * .008, iy + hh + S * .04 - lc * S * .05, -Math.PI / 2, lc);
        break;
      }
      case 'grate': case 'zest': {
        woodBoard(c, S, false); const zest = seg.act === 'zest'; const kk = zest ? (vis.find(k => /lemon|orange|lime/.test(k)) || 'lemon') : main;
        c.save(); shade(c, S, .03, .012, .02, .4); if (zest) rr(c, S * .2, S * .44, S * .62, S * .09, S * .02); else rr(c, S * .42, S * .16, S * .2, S * .62, S * .02);
        const g = zest ? c.createLinearGradient(0, S * .44, 0, S * .53) : c.createLinearGradient(S * .42, 0, S * .62, 0); g.addColorStop(0, '#9aa0a4'); g.addColorStop(.5, '#eef1f2'); g.addColorStop(1, '#8a9094'); c.fillStyle = g; c.fill(); c.restore();
        c.fillStyle = 'rgba(40,40,45,.55)';
        if (zest) { for (let x = 0; x < 22; x++) { c.beginPath(); c.ellipse(S * (.24 + x * .024), S * .485, S * .004, S * .01, 0, 0, TAU); c.fill(); } rr(c, S * .76, S * .455, S * .16, S * .06, S * .02); c.fillStyle = '#2b2b2e'; c.fill(); }
        else for (let y = 0; y < 12; y++) for (let x = 0; x < 4; x++) { c.beginPath(); c.ellipse(S * (.455 + x * .04), S * (.21 + y * .045), S * .008, S * .012, 0, 0, TAU); c.fill(); }
        const mv = Math.sin(t * 7) * S * (zest ? .12 : .1);
        blit(c, wholeOf(kk, S * (zest ? .2 : .26)), zest ? S * .5 + mv : S * .52, zest ? S * .4 : S * .45 + mv, 1, zest ? t : 1.3);
        const n = Math.floor(p * 28) + 6; for (let i = 0; i < n; i++) { const r = mulberry(i * 7 + seed); blit(c, zest ? spriteOf('lemon', S * .06, 1 + i % 4) : shredOf(kk, S * .075, 1 + i % 4), S * (.3 + r() * .42), S * (zest ? .6 + r() * .12 : .76 + r() * .05), zest ? .7 : 1, r() * TAU); }
        break;
      }
      case 'press': {
        woodBoard(c, S, true); const squeeze = eio(Math.min(1, fr(t / 1.8) * 1.3));
        for (let i = 0; i < Math.floor(p * 18); i++) { const r = mulberry(i + seed); blit(c, spriteOf('garlic', S * .05, 1 + i % 3), S * (.38 + r() * .24), S * (.62 + r() * .1), 1, r() * TAU); }
        c.save(); c.translate(S * .5, S * .42); c.rotate(-.5); shade(c, S, .03, .012, .025, .45);
        const g = c.createLinearGradient(0, -S * .03, 0, S * .03); g.addColorStop(0, '#c9ced1'); g.addColorStop(.5, '#f1f3f4'); g.addColorStop(1, '#8e9498'); c.fillStyle = g;
        rr(c, -S * .3, -S * .025, S * .36, S * .05, S * .025); c.fill(); c.save(); c.rotate(-.35 * (1 - squeeze)); rr(c, -S * .3, -S * .075, S * .36, S * .045, S * .022); c.fill(); c.restore();
        c.beginPath(); c.arc(S * .1, -S * .02, S * .07, 0, TAU); c.fill(); c.shadowColor = 'transparent'; c.fillStyle = 'rgba(40,40,45,.5)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(S * (.07 + (i % 3) * .03), -S * (.05 - Math.floor(i / 3) * .03), S * .005, 0, TAU); c.fill(); }
        c.restore(); if (squeeze < .5) blit(c, wholeOf('garlic', S * .1), S * .56, S * .36, 1, .3);
        break;
      }
      case 'melt': {
        const a = vessel(c, S, 'skillet', 'white', st.vseed); burner(c, S, a.cx * S, a.cy * S, .34 * S, t, true);
        const m = Math.min(1, p * 1.4); const cx = a.cx * S, cy = a.cy * S;
        const pool = c.createRadialGradient(cx, cy, 0, cx, cy, S * (.06 + m * .18)); pool.addColorStop(0, 'rgba(245,205,95,.95)'); pool.addColorStop(.8, 'rgba(230,180,70,.8)'); pool.addColorStop(1, 'rgba(230,180,70,0)'); c.fillStyle = pool; c.beginPath(); c.arc(cx, cy, S * (.06 + m * .18), 0, TAU); c.fill();
        const s = S * .12 * (1 - m * .85); if (s > 2) { c.save(); c.translate(cx, cy); c.rotate(.3); shade(c, S, .015, .005, .008, .3); rr(c, -s / 2, -s * .4, s, s * .8, s * .15); const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, '#fbe7a2'); g.addColorStop(1, '#e9c461'); c.fillStyle = g; c.fill(); c.restore(); }
        for (let i = 0; i < 16; i++) { const q = fr(t * 1.5 + i * .17), r = mulberry(i); c.fillStyle = `rgba(255,250,220,${(1 - q) * .8})`; c.beginPath(); c.arc(cx + (r() - .5) * S * .3 * m, cy + (r() - .5) * S * .3 * m, S * .004 * (1 + q), 0, TAU); c.fill(); }
        contents(c, S, a, vis, t, { hop: 1, size: .07, n: 5 });
        break;
      }
      case 'fry': {
        const inPot = (seg.vessel || st.hist.vessel) === 'pot'; const a = vessel(c, S, inPot ? 'pot' : 'skillet', 'white', st.vseed); burner(c, S, a.cx * S, a.cy * S, (inPot ? .36 : .34) * S, t);
        c.save(); c.beginPath(); c.arc(a.cx * S, a.cy * S, a.r * S, 0, TAU); c.clip();
        const oil = c.createRadialGradient(a.cx * S - S * .06, a.cy * S - S * .06, 0, a.cx * S, a.cy * S, a.r * S); oil.addColorStop(0, 'rgba(255,215,120,.25)'); oil.addColorStop(1, 'rgba(255,200,90,.06)'); c.fillStyle = oil; c.fillRect(0, 0, S, S);
        if (liq.length && !kinds.every(k => /broth/.test(k) || !K[k].liq)) { c.globalAlpha = .6; liquid(c, S, a, baseCol, t); c.globalAlpha = 1; }
        contents(c, S, a, prev, t, { hop: 1, size: .065, n: 4, seed: 9, alpha: .9 });
        contents(c, S, a, vis, t, { hop: 1, size: .085, n: 9, spin: .45 });
        c.fillStyle = `rgba(130,65,15,${Math.min(1, p * 1.4) * .18})`; c.fillRect(0, 0, S, S);
        for (let i = 0; i < 30; i++) { const q = fr(t * 2.2 + i * .173); const r = mulberry(i * 5); c.fillStyle = `rgba(255,250,230,${(1 - q) * .8})`; c.beginPath(); c.arc(a.cx * S + (r() - .5) * a.r * S * 1.6, a.cy * S + (r() - .5) * a.r * S * 1.6 - q * S * .03, S * .004 * (1 + q), 0, TAU); c.fill(); }
        c.restore();
        const sa = t * 1.8; c.save(); c.translate(a.cx * S + Math.cos(sa) * S * .1, a.cy * S + Math.sin(sa) * S * .1); c.rotate(sa + 1.2); shade(c, S, .02, .01, .02, .4);
        rr(c, -S * .05, -S * .04, S * .1, S * .08, S * .015); c.fillStyle = '#c69a66'; c.fill(); rr(c, -S * .011, S * .03, S * .022, S * .3, S * .011); c.fill(); c.restore();
        steamPuffs(c, S, t, a.cx * S, a.cy * S - S * .05, 4, .3);
        break;
      }
      case 'boil': case 'add': case 'pour': case 'season': {
        const want = seg.vessel || st.hist.vessel || 'pot';
        const pastaBoil = seg.act === 'boil' && seg.pastaK && vis0.length === 0;
        const vt = seg.act === 'boil' ? (seg.own === 'skillet' ? 'skillet' : 'pot') : want === 'dish' ? 'dish' : want === 'bowl' ? 'bowl' : want;
        const hot = vt === 'pot' || vt === 'skillet';
        const a = vessel(c, S, vt, ['white', 'celadon', 'blue', 'oat'][st.vseed % 4], st.vseed);
        if (hot && seg.act !== 'add') burner(c, S, a.cx * S, a.cy * S, (vt === 'pot' ? .36 : .34) * S, t, seg.act === 'season');
        const col = pastaBoil ? '#e9e6dc' : st.hist.liq || (liq.length ? baseCol : st.recipeBase);
        const level = seg.act === 'pour' ? .35 + Math.min(1, p * 1.3) * .65 : 1;
        if (col || seg.act === 'boil') liquid(c, S, a, col || '#d8c9a6', t, seg.act === 'pour' ? 'rising' : 'still', level);
        if (!pastaBoil) contents(c, S, a, prev, t, { size: .065, n: 4, seed: 9 });
        if (seg.act === 'add') contents(c, S, a, vis, t, { drop: p, size: .078 }); else contents(c, S, a, vis, t, { size: .075 });
        if (seg.act === 'add' && !vis.length && liq.length) { const lc = mixLiq(kinds) || baseCol; const q = clamp(p * 1.6, 0, 1), cx = a.cx * S, cy = a.cy * S;
          if (q < 1) { const z = 1 + (1 - q) * 1.8; c.save(); c.globalAlpha = Math.min(1, q * 3); shade(c, S, .02, .01 * z, .02 * z, .35); c.translate(cx + S * .02, cy - S * .02); c.scale(z, z); blobPath(c, S * .045, mulberry(3), 9, .15); c.fillStyle = lc; c.fill(); c.restore(); }
          else { const w = fr(p * 1.6); c.strokeStyle = `rgba(255,255,255,${.35 * (1 - w)})`; c.lineWidth = S * .004; c.beginPath(); c.arc(cx + S * .02, cy - S * .02, S * (.03 + w * .12), 0, TAU); c.stroke(); c.fillStyle = C.rgba(lc, .9 * (1 - w * .6)); c.beginPath(); c.arc(cx + S * .02, cy - S * .02, S * .045 * (1 + w * .8), 0, TAU); c.fill(); } }
        if (seg.act === 'boil') { bubbles(c, S, a, t); steamPuffs(c, S, t, a.cx * S, a.cy * S - a.r * S * .4, 6, .35); }
        if (seg.act === 'pour') {
          const lc = liq.length ? mixLiq(kinds) : '#f2eee6', tip = eio(Math.min(1, p * 2.5)), ang = -.35 - tip * .75;
          const jx = S * .76, jy = S * .2, sx = jx + Math.cos(ang + Math.PI) * S * .1, sy = jy + Math.sin(ang + Math.PI) * S * .1;
          const lx = a.cx * S + S * .04, ly = a.cy * S - S * .02;
          if (tip > .3) { c.strokeStyle = C.rgba(lc, .95); c.lineWidth = S * .016 * tip; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx - S * .02, (sy + ly) / 2, lx + Math.sin(t * 11) * S * .003, ly); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = S * .004; c.beginPath(); c.moveTo(sx - S * .004, sy); c.quadraticCurveTo(sx - S * .024, (sy + ly) / 2, lx - S * .004, ly); c.stroke();
            for (let i = 0; i < 3; i++) { const w = fr(t * 1.6 + i / 3); c.strokeStyle = `rgba(255,255,255,${.4 * (1 - w)})`; c.lineWidth = S * .003; c.beginPath(); c.ellipse(lx, ly, S * (.015 + w * .09), S * (.012 + w * .07), 0, 0, TAU); c.stroke(); } }
          c.save(); c.translate(jx, jy); c.rotate(ang); shade(c, S, .03, .012, .025, .4);
          rr(c, -S * .085, -S * .07, S * .17, S * .14, S * .035); c.fillStyle = 'rgba(238,242,246,.95)'; c.fill(); c.shadowColor = 'transparent';
          c.beginPath(); c.moveTo(-S * .085, -S * .02); c.lineTo(-S * .12, 0); c.lineTo(-S * .085, S * .02); c.fillStyle = 'rgba(238,242,246,.95)'; c.fill();
          rr(c, -S * .07, -S * .055, S * .14, S * .11, S * .025); c.fillStyle = lc; c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-S * .06, -S * .05, S * .12, S * .012);
          c.lineWidth = S * .016; c.strokeStyle = 'rgba(225,230,235,.95)'; c.beginPath(); c.arc(S * .1, 0, S * .035, -1.3, 1.3); c.stroke(); c.restore();
        }
        if (seg.act === 'season') {
          [[.34, 'salt'], [.64, 'pepper']].forEach(([x, w], i) => { const sh = Math.sin(t * 10 + i * 2) * S * .02; c.save(); c.translate(S * x + sh, S * .24); c.rotate(.3 + sh / S * 4); shade(c, S, .03, .01, .02, .45);
            if (w === 'salt') { rr(c, -S * .035, -S * .06, S * .07, S * .12, S * .02); c.fillStyle = 'rgba(245,248,250,.95)'; c.fill(); c.fillStyle = '#c9ced1'; c.fillRect(-S * .035, -S * .07, S * .07, S * .025); }
            else { rr(c, -S * .03, -S * .08, S * .06, S * .16, S * .025); c.fillStyle = '#6a4a33'; c.fill(); c.beginPath(); c.arc(0, -S * .085, S * .02, 0, TAU); c.fillStyle = '#3a2a1f'; c.fill(); }
            c.restore();
            for (let q = 0; q < 16; q++) { const f = fr(t * 1.8 + q / 16), r = mulberry(q + i * 30); c.fillStyle = w === 'salt' ? `rgba(255,255,255,${1 - f})` : `rgba(30,22,18,${1 - f})`; c.beginPath(); c.arc(S * x + (r() - .5) * S * .08, S * .31 + f * S * .24, S * .005, 0, TAU); c.fill(); } });
        }
        if (seg.act === 'add' && !hot) { const q = fr(t / P * 2); c.strokeStyle = `rgba(255,255,255,${.4 * (1 - q)})`; c.lineWidth = S * .004; c.beginPath(); c.arc(a.cx * S, a.cy * S, a.r * S * q * .8, 0, TAU); c.stroke(); }
        if (hot && seg.act === 'add') steamPuffs(c, S, t, a.cx * S, a.cy * S - a.r * S * .4, 4, .3);
        break;
      }
      case 'blend': case 'mash': {
        const mash = seg.act === 'mash';
        const a = vessel(c, S, seg.vessel === 'pot' || st.hist.vessel === 'pot' ? 'pot' : 'bowl', 'celadon', st.vseed);
        const k = Math.min(1, p * 1.5); const col = liq.length || st.hist.liq ? (st.hist.liq ? C.mix(st.hist.liq, baseCol, .5) : baseCol) : (vis.length ? C.mix(K[vis[0]].col, st.recipeBase || '#e8dcc0', .4) : '#e8dcc0');
        liquid(c, S, a, mash ? C.light(col, .1) : col, t, mash ? 'still' : 'vortex');
        const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        [...prev, ...vis].forEach((kk, ki) => { for (let i = 0; i < 7; i++) { const r = mulberry(i * 23 + ki); const ang = r() * TAU + (mash ? 0 : t * 5); const d = R * (.8 - (mash ? 0 : k * .7)) * Math.sqrt(r()); blit(c, spriteOf(kk, S * .07, 1 + i % 3), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1 - k * .8, ang, 1 - k * .9, false); } });
        if (mash) { const down = Math.abs(Math.sin(t * 5)); const mx = cx + Math.cos(t * 1.3) * R * .35, my = cy + Math.sin(t * 1.3) * R * .35; c.save(); c.translate(mx, my); shade(c, S, .03, .015 * (1 + down), .025 * (1 + down), .4);
          c.strokeStyle = '#b9bec2'; c.lineWidth = S * .008; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-S * .07, i * S * .018); c.quadraticCurveTo(0, i * S * .03, S * .07, i * S * .018); c.stroke(); } rr(c, -S * .012, -S * .3, S * .024, S * .28, S * .012); c.fillStyle = '#c69a66'; c.fill(); c.restore(); }
        else { c.save(); c.translate(cx + Math.sin(t * 13) * S * .006, cy); shade(c, S, .03, .02, .03, .45); c.beginPath(); c.arc(0, 0, S * .075, 0, TAU); c.fillStyle = '#e9ebec'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .05, 0, TAU); c.fillStyle = '#b4b9bc'; c.fill();
          c.rotate(t * 30); c.fillStyle = '#7d8286'; c.fillRect(-S * .045, -S * .006, S * .09, S * .012); c.fillRect(-S * .006, -S * .045, S * .012, S * .09); c.restore(); }
        break;
      }
      case 'mix': case 'whisk': {
        const a = vessel(c, S, seg.vessel === 'pot' ? 'pot' : seg.vessel === 'skillet' ? 'skillet' : 'bowl', ['celadon', 'blue', 'butter', 'white'][st.vseed % 4], st.vseed);
        const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        const col = liq.length ? baseCol : st.hist.liq; if (col) liquid(c, S, a, col, t, seg.act === 'whisk' ? 'vortex' : 'still');
        [...prev, ...vis].forEach((kk, ki) => { for (let i = 0; i < 7; i++) { const r = mulberry(i * 11 + ki * 5); const ang = r() * TAU + t * (1.2 + ki * .15); const d = R * (.2 + r() * .62); blit(c, spriteOf(kk, S * .072, 1 + i % 4), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1, ang * 2); } });
        const sa = t * (seg.act === 'whisk' ? 7 : 2.4); c.save(); c.translate(cx + Math.cos(sa) * R * .45, cy + Math.sin(sa) * R * .45); shade(c, S, .02, .02, .03, .4);
        if (seg.act === 'whisk') { c.strokeStyle = '#d7dbde'; c.lineWidth = S * .005; for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(0, 0, S * .05, S * .02 * Math.abs(i) + S * .004, 0, 0, TAU); c.stroke(); } c.rotate(sa); rr(c, -S * .01, S * .04, S * .02, S * .28, S * .01); c.fillStyle = '#9aa0a4'; c.fill(); }
        else { c.rotate(sa + .8); c.beginPath(); c.ellipse(0, 0, S * .035, S * .05, 0, 0, TAU); c.fillStyle = '#c69a66'; c.fill(); rr(c, -S * .01, S * .04, S * .02, S * .32, S * .01); c.fill(); }
        c.restore();
        break;
      }
      case 'drain': case 'rinse': {
        const a = vessel(c, S, 'colander', 'white', seed), cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        contents(c, S, a, vis.length ? vis : prev.slice(-2), t, { size: .075, n: 9, spin: .05 });
        if (seg.act === 'rinse') { c.save(); shade(c, S, .03, .01, .02, .4); rr(c, S * .3, S * .02, S * .08, S * .2, S * .03); const g = c.createLinearGradient(S * .3, 0, S * .38, 0); g.addColorStop(0, '#9aa0a4'); g.addColorStop(.5, '#f1f3f4'); g.addColorStop(1, '#8a9094'); c.fillStyle = g; c.fill(); c.restore(); }
        for (let i = 0; i < 44; i++) { const q = fr(t * 1.5 + i * .09), r = mulberry(i * 3); const ang = r() * TAU, d = R * (.9 + q * .5); c.fillStyle = `rgba(160,205,235,${.7 * (1 - q)})`; c.beginPath(); c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, S * .006, 0, TAU); c.fill(); }
        c.strokeStyle = 'rgba(190,225,245,.6)'; c.lineWidth = S * .02; c.lineCap = 'round'; c.beginPath(); c.moveTo(S * .34, S * .2); c.quadraticCurveTo(S * .36, S * .35, cx - S * .02 + Math.sin(t * 8) * S * .01, cy - S * .04); c.stroke();
        break;
      }
      case 'roll': case 'knead': case 'shape': case 'rise': case 'brush': {
        woodBoard(c, S, false);
        c.save(); c.translate(S * .5, S * .5); scatterDots(c, mulberry(seed + 1), 90, S * .32, S * .002, S * .005, ['#fbf8f1', '#efe8da'], [.4, .9], false); c.restore();
        if (seg.act === 'roll') { const w = S * (.2 + Math.min(1, p * 1.3) * .22), h = S * (.16 + Math.min(1, p * 1.3) * .12); c.save(); c.translate(S * .5, S * .5); shade(c, S, .02, .005, .01, .3); c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.fillStyle = dough; c.fill(); c.restore();
          const px = Math.sin(t * 3) * w * .6; c.save(); c.translate(S * .5 + px, S * .5); shade(c, S, .03, .01, .025, .45); const g = c.createLinearGradient(-S * .04, 0, S * .04, 0); g.addColorStop(0, '#b98a57'); g.addColorStop(.5, '#e7c393'); g.addColorStop(1, '#a8784a'); c.fillStyle = g; rr(c, -S * .035, -S * .3, S * .07, S * .6, S * .03); c.fill(); rr(c, -S * .018, -S * .42, S * .036, S * .12, S * .018); c.fill(); rr(c, -S * .018, S * .3, S * .036, S * .12, S * .018); c.fill(); c.restore(); }
        else if (seg.act === 'knead' || seg.act === 'rise') { const b = seg.act === 'rise' ? 1 + Math.min(1, p) * .35 + Math.sin(t * 1.5) * .02 : 1; const sq = seg.act === 'knead' ? Math.sin(t * 5) * .1 : 0; c.save(); c.translate(S * .5, S * .52); c.scale(b * (1 + sq), b * (1 - sq)); shade(c, S, .03, .008, .018, .35); blobPath(c, S * .17, mulberry(seed), 12, .06); const g = c.createRadialGradient(-S * .05, -S * .05, S * .02, 0, 0, S * .2); g.addColorStop(0, C.light(dough, .25)); g.addColorStop(1, C.dark(dough, .1)); c.fillStyle = g; c.fill(); c.restore();
          if (seg.act === 'knead') { c.strokeStyle = C.rgba(C.dark(dough, .25), .4); c.lineWidth = S * .006; c.beginPath(); c.arc(S * .5, S * .52, S * .08, t * 3, t * 3 + 2); c.stroke(); }
          else { c.save(); c.globalAlpha = .82; c.translate(S * .5, S * .5); c.rotate(-.2); shade(c, S, .02, .005, .01, .3); rr(c, -S * .3, -S * .25 * (1 + p * .2), S * .6, S * .5 * (1 + p * .2), S * .02); c.fillStyle = '#f1ece2'; c.fill(); c.fillStyle = 'rgba(200,71,58,.6)'; c.fillRect(-S * .3, -S * .2, S * .6, S * .01); c.fillRect(-S * .3, S * .18, S * .6, S * .01); c.restore(); } }
        else if (seg.act === 'brush') { for (let i = 0; i < 6; i++) { const x = S * (.3 + (i % 3) * .2), y = S * (.4 + Math.floor(i / 3) * .2); c.save(); shade(c, S, .02, .006, .012, .35); c.beginPath(); c.arc(x, y, S * .075, 0, TAU); c.fillStyle = '#e9c07a'; c.fill(); c.restore(); const shine = clamp((p * 1.4 - i * .12) * 3, 0, 1); c.fillStyle = `rgba(255,240,200,${shine * .5})`; c.beginPath(); c.ellipse(x - S * .02, y - S * .025, S * .04, S * .02, -.5, 0, TAU); c.fill(); }
          const bi = Math.min(5, Math.floor(p * 1.4 / .2)), bx = S * (.3 + (bi % 3) * .2), by = S * (.4 + Math.floor(bi / 3) * .2); c.save(); c.translate(bx + Math.sin(t * 8) * S * .03, by - S * .02); c.rotate(-.7); shade(c, S, .02, .01, .02, .4); rr(c, -S * .02, -S * .03, S * .04, S * .06, S * .008); c.fillStyle = '#f0dca8'; c.fill(); rr(c, -S * .012, -S * .25, S * .024, S * .22, S * .012); c.fillStyle = '#b98a57'; c.fill(); c.restore(); }
        else { const kk = vis[0]; const n = 6;
          for (let i = 0; i < n; i++) { const r = mulberry(i * 5 + seed); const done = clamp(p * 1.4 - i * .15, 0, 1); const x = S * (.24 + (i % 3) * .26), y = S * (.4 + Math.floor(i / 3) * .22);
            if (done < 1 && kk) for (let q = 0; q < 6; q++) blit(c, spriteOf(kk, S * .05, 1 + q % 3), x + Math.cos(q + r()) * S * .05 * (1 - done), y + Math.sin(q * 2 + r()) * S * .05 * (1 - done), 1, q);
            if (done > 0) { const g = c.createRadialGradient(x - S * .02, y - S * .02, S * .005, x, y, S * .07); const col = kk && K[kk] ? K[kk].col : dough; g.addColorStop(0, C.light(col, .3)); g.addColorStop(1, C.dark(col, .25)); c.save(); c.globalAlpha = done; shade(c, S, .02, .006, .015, .4); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, S * .06 * (1 + (1 - done) * .3), S * .06 * done + S * .01, 0, 0, TAU); c.fill(); c.restore(); } } }
        break;
      }
      case 'bake': case 'preheat': {
        const glow = seg.act === 'preheat' ? Math.min(1, p * 1.3) : .85 + Math.sin(t * 2) * .1;
        oven(c, S, t, glow, seg.act === 'bake' ? (st.finalImg || st.dishImg) : null, seg.temp ? +seg.temp : (seg.act === 'preheat' ? 200 : 0));
        if (seg.act === 'bake') steamPuffs(c, S, t, S * .5, S * .28, 3, .3);
        break;
      }
      case 'rest': case 'chill': {
        const a = vessel(c, S, st.hist.vessel === 'pot' ? 'pot' : 'bowl', ['blue', 'celadon', 'white'][st.vseed % 3], st.vseed);
        const col = st.hist.liq || (liq.length ? baseCol : null); if (col) liquid(c, S, a, col, 0);
        contents(c, S, a, [...prev, ...vis].slice(-5), t * .2, { size: .07, n: 5 });
        if (seg.act === 'chill' || seg.cold) { c.save(); c.fillStyle = 'rgba(200,225,255,.12)'; c.fillRect(0, 0, S, S); c.restore(); for (let i = 0; i < 22; i++) { const q = fr(t * .2 + i / 22), r = mulberry(i); c.save(); c.globalAlpha = .8 * Math.sin(q * Math.PI); c.translate(S * r(), S * q); c.rotate(t * .5 + i); c.strokeStyle = '#eef6ff'; c.lineWidth = S * .003; const s = S * (.012 + r() * .014); for (let k = 0; k < 3; k++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.stroke(); } c.restore(); } }
        c.save(); c.translate(S * .82, S * .18); shade(c, S, .02, .006, .012, .4); c.beginPath(); c.arc(0, 0, S * .085, 0, TAU); c.fillStyle = '#f7f3ea'; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#29241f'; c.lineWidth = S * .007; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 1.5 - 1.57) * S * .06, Math.sin(t * 1.5 - 1.57) * S * .06); c.moveTo(0, 0); c.lineTo(Math.cos(t * .12 - 1.57) * S * .042, Math.sin(t * .12 - 1.57) * S * .042); c.stroke(); c.restore();
        break;
      }
      default: { // sprinkle, serve and the final reveal
        const final = seg.act === 'result';
        const img = st.finalImg || st.dishImg;
        const q = final ? eio(Math.min(1, t / 2.2)) : Math.min(1, p * 1.5);
        if (final) { c.save(); c.translate(S / 2, S / 2); c.rotate(t * .1); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); const g = c.createLinearGradient(0, 0, S * .6, 0); g.addColorStop(0, `rgba(255,225,160,${.12 * q})`); g.addColorStop(1, 'rgba(255,225,160,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(S * .6, -S * .05); c.lineTo(S * .6, S * .05); c.fill(); } c.restore(); }
        if (img) { const s = S * (final ? .86 : .8); c.save(); c.globalAlpha = seg.act === 'sprinkle' ? 1 : q; c.translate(S / 2, S / 2); c.rotate(final ? (1 - q) * -.6 : 0); const z = final ? .7 + q * .3 : .92 + q * .08; c.scale(z, z); c.drawImage(img, -s / 2, -s / 2, s, s); c.restore(); }
        const drops = seg.act === 'sprinkle' ? (vis.length ? vis : prev) : vis;
        if (seg.act !== 'sprinkle') drops.forEach((kk, ki) => { for (let i = 0; i < 6; i++) { const r = mulberry(i * 9 + ki + seed); const dp = clamp(p * 1.8 - ki * .2 - i * .06, 0, 1); if (dp <= 0 || dp >= 1) continue; blit(c, spriteOf(kk, S * .06, 1 + i % 3), S * (.32 + r() * .36), S * (.32 + r() * .36), 1 + (1 - dp) * 2, r() * TAU, dp); } });
        if (seg.act === 'sprinkle') { const hx = S * (.46 + Math.sin(t * 1.4) * .12), hy = S * .22; const pinch = Math.sin(t * 9) * .5 + .5;
          (drops.length ? drops : ['parsley']).forEach((kk, ki) => { for (let i = 0; i < 7; i++) { const f = fr(t * 1.1 + i / 7 + ki * .13), r = mulberry(i * 5 + ki); blit(c, spriteOf(kk, S * .045, 1 + i % 3), hx + (r() - .5) * S * .04 + f * S * (r() - .5) * .1, hy + S * .04 + f * S * .28, 1.4 - f * .5, r() * TAU + f * 3, f < .85 ? 1 : (1 - f) / .15); } });
          c.save(); c.translate(hx, hy); shade(c, S, .03, .012, .035, .35); c.fillStyle = '#efc9a6';
          c.beginPath(); c.ellipse(S * .05, -S * .04, S * .075, S * .05, .5, 0, TAU); c.fill();
          c.beginPath(); c.ellipse(-S * .012 - pinch * S * .004, S * .01, S * .016, S * .038, .15, 0, TAU); c.fill(); c.beginPath(); c.ellipse(S * .018 + pinch * S * .004, S * .014, S * .014, S * .034, -.25, 0, TAU); c.fill();
          c.shadowColor = 'transparent'; c.fillStyle = 'rgba(255,235,220,.5)'; c.beginPath(); c.ellipse(-S * .016, 0, S * .006, S * .012, .15, 0, TAU); c.fill(); c.restore(); }
        if (final) sparkles(c, S, t, 18, S / 2, S / 2, S * .42); else if (seg.act === 'serve') sparkles(c, S, t, 6, S / 2, S / 2, S * .36);
      }
    }
    sunlight(c, S, t, st.rseed, st.step);
  }

  /* ---------------- player ---------------- */
  const FINAL = new Map();
  function finalImg(id, S) { const key = id + '|' + S; if (!FINAL.has(key)) { if (FINAL.size > 6) FINAL.clear(); try { FINAL.set(key, renderScene(A.scene(id), S)); } catch (e) { FINAL.set(key, null); } } return FINAL.get(key); }
  function build(id, text, stepIdx, isLast) { const segs = segmentsOf(id, text); if (isLast) segs.push({ act: 'result', word: 'Klart', ings: [], text: '' }); return segs; }
  function withinOf(st, segs, si) {
    const fl = A.flat(st.id), ks = [], ls = [];
    segs.slice(0, si).forEach(sg => { if (!IN_VESSEL.has(sg.act)) return; sg.ings.forEach(ii => { const k = fl[ii] && fl[ii].k; if (!k || !K[k]) return; if ((K[k].g || K[k].grp) && !ks.includes(k)) ks.push(k); if (K[k].liq) ls.push(k); }); });
    st.within = ks; st.withinLiq = mixLiq(ls); st.hist = { ...st.hist0 };
  }
  function stateFor(id, stepIdx) {
    const sc = A.scene(id), base = sc.vessels.find(v => v.base), fl = A.flat(id);
    const h = history(id, stepIdx);
    return { id, step: stepIdx, recipeBase: base ? base.base.col : null, dishImg: A.THUMB_IMG[id], kinds: [], hist: h, hist0: h, seed: (strHash(id) + stepIdx * 7919) % 100000, rseed: strHash(id) % 100000, vseed: strHash(id + 'v') % 1000, doughy: fl.some(f => /(vego|soja|formbar )färs|^\d+ g färs/.test(f.t)) ? '#8a5a3a' : '#ecd5a8' };
  }
  // every moment of a recipe (or of one step) as a flat list the player walks through
  function momentsOf(id, onlyStep = null) {
    const steps = A.R[id].parts.flatMap(p => p.steps || []), out = [];
    steps.forEach((text, si) => { if (onlyStep != null && si !== onlyStep) return; const last = si === steps.length - 1, segs = build(id, text, si, last); segs.forEach((seg, k) => out.push({ step: si, k, seg, segs, text, last })); });
    return out;
  }
  const P_SEC = 3.6;
  // a player: plays moments in order, can pause, step back and forward; the finished dish is held at the end
  function player(cv, id, moments, opts = {}) {
    const pl = { i: 0, t0: performance.now(), paused: false, pausedAt: 0, raf: 0, dead: false, loop: !!opts.loop };
    const states = new Map(), fl = A.flat(id);
    const stOf = m => { if (!states.has(m.step)) states.set(m.step, stateFor(id, m.step)); return states.get(m.step); };
    let shown = -1;
    const frame = now => {
      if (pl.dead || !cv.isConnected) return;
      const r = cv.getBoundingClientRect(), D = Math.min(2, window.devicePixelRatio || 1), S = Math.round(r.width * D);
      if (!S) { pl.raf = requestAnimationFrame(frame); return; }
      if (cv.width !== S) { cv.width = cv.height = S; SPR.clear(); shown = -1; }
      let ts = ((pl.paused ? pl.pausedAt : now) - pl.t0) / 1000;
      const m = moments[pl.i], hold = m.seg.act === 'result';
      if (!pl.paused && !hold && ts >= P_SEC) { if (pl.i < moments.length - 1) { go(pl.i + 1); ts = 0; } else if (pl.loop) { go(0); ts = 0; } }
      if (!pl.paused && hold && ts >= 7 && pl.loop && moments.length > 1) { go(0); ts = 0; }
      const mm = moments[pl.i], st = stOf(mm);
      if (shown !== pl.i) { shown = pl.i; st.kinds = kindsOf(id, mm.seg); withinOf(st, mm.segs, mm.k); if (['result', 'serve', 'bake', 'sprinkle'].includes(mm.seg.act)) st.finalImg = finalImg(id, S); opts.onMoment && opts.onMoment(pl.i, mm, fl); }
      const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S, S);
      try { drawScene(c, S, A.REDUCED ? 1.8 : Math.min(ts, mm.seg.act === 'result' ? 999 : P_SEC - .001), mm.seg, id, st); } catch (e) { console.warn('process', e); }
      opts.onTick && opts.onTick(Math.min(1, ts / P_SEC), pl.paused);
      pl.raf = requestAnimationFrame(frame);
    };
    function go(i) { pl.i = (i + moments.length) % moments.length; pl.t0 = performance.now(); if (pl.paused) pl.pausedAt = pl.t0; }
    pl.go = i => { go(i); };
    pl.next = () => go(pl.i + 1);
    pl.prev = () => { const el = ((pl.paused ? pl.pausedAt : performance.now()) - pl.t0) / 1000; go(el > 1.2 ? pl.i : pl.i - 1); };
    pl.toggle = () => { const now = performance.now(); if (pl.paused) { pl.t0 += now - pl.pausedAt; pl.paused = false; } else { pl.paused = true; pl.pausedAt = now; } opts.onTick && opts.onTick(0, pl.paused); return pl.paused; };
    pl.destroy = () => { pl.dead = true; cancelAnimationFrame(pl.raf); };
    pl.moments = moments;
    pl.raf = requestAnimationFrame(frame);
    return pl;
  }
  let cur = null;
  function play(cv, capEl, id, text, stepIdx = 0, isLast = false, ui = {}) {
    stop();
    const moments = momentsOf(id, stepIdx);
    cur = player(cv, id, moments, { loop: true, onMoment: (i, m, fl) => {
      const names = m.seg.ings.map(ii => fl[ii] && A.shortName(fl[ii].t)).filter(Boolean).slice(0, 4);
      capEl.innerHTML = m.seg.act === 'result' ? `<b>Klart</b> · ${A.esc(A.R[id].title)}` : `<b>${m.seg.word}</b>${names.length ? ' · ' + A.esc(names.join(', ')) : ''}`;
      ui.onMoment && ui.onMoment(i, moments.length, m);
    }, onTick: ui.onTick });
    return cur;
  }
  function stop() { if (cur) cur.destroy(); cur = null; }
  function renderFrame(cv, id, text, si, t, stepIdx = 0, isLast = false) {
    const segs = build(id, text, stepIdx, isLast), seg = segs[si % segs.length], st = stateFor(id, stepIdx); st.kinds = kindsOf(id, seg); withinOf(st, segs, si % segs.length); st.finalImg = finalImg(id, cv.width);
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); drawScene(c, cv.width, t, seg, id, st); return segs.map(s => s.act + ':' + s.word);
  }
  return { play, stop, player, momentsOf, segments: segmentsOf, renderFrame };
}
