/* ==========================================================================
   Stegfilmer — every step in cook mode becomes a little film of what you
   actually do, played with the ingredients that step mentions.
   ========================================================================== */
function initProcess(A) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ACTIONS = [
    [/sätt (på )?ugnen|värm ugnen|sätt på en platta/, 'preheat', 'Värm ugnen'],
    [/grädda|gratinera|tillaga i ugn|in i ugnen|i ugnen i|in formen i/, 'bake', 'Grädda'],
    [/\bfinriv|\bgrovriv|\briv\b|\briv(er|en)? |rivjärn|riv av/, 'grate', 'Riv'],
    [/\bskala\b/, 'peel', 'Skala'],
    [/hacka|skiva|strimla|tärna|\bskär\b|dela |dela,|ansa|mortla|kärna ur/, 'chop', 'Skär'],
    [/mixa|mosa|stavmixer|mixkanna|potatisstomp|pressa ner|pressa i/, 'blend', 'Mixa'],
    [/vispa/, 'whisk', 'Vispa'],
    [/fräs|\bstek|bryn|rosta|glansig/, 'fry', 'Stek'],
    [/koka|sjud|puttra|bubbla/, 'boil', 'Koka'],
    [/häll av|skölj|sila|rinna av|krama ur|ånga av/, 'drain', 'Häll av'],
    [/forma|rulla ihop|rulla små|kavla|platta (ut|till)|knåda/, 'shape', 'Forma'],
    [/tillsätt|lägg i|lägg ner|häll (i|på|över|ner)|smula ner|vänd ner|rör ner|blanda ner|lägg över/, 'add', 'Tillsätt'],
    [/blanda|rör om|rör ihop|rör samman|rör till|arbeta (ihop|samman)|massera|vänd runt|fluffa/, 'mix', 'Blanda'],
    [/låt stå|vila|låt dra|dra i|svalna|jäsa|över natten|kylskåp|i kylen|kallna|tina/, 'rest', 'Låt vila'],
    [/smaka av|salta|peppra|krydda|smaksätt/, 'season', 'Smaka av'],
    [/servera|toppa|strö|fördela|ringla|garnera|fyll |pensla|bred /, 'serve', 'Servera']
  ];
  const VESSEL_WORDS = [[/stekpanna|panna|pannan/, 'skillet'], [/gryta|kastrull|kastrullen|grytan/, 'pot'], [/bunke|skål|bunken|mixkanna/, 'bowl'], [/ugnsform|form\b|formen|plåt/, 'dish']];
  function segments(id, text) {
    const sents = text.split(/(?<=[.!?)])\s+(?=[A-ZÅÄÖ(])/);
    const out = []; let vessel = null;
    sents.forEach(s => {
      const low = s.toLowerCase();
      for (const [re, v] of VESSEL_WORDS) if (re.test(low)) { vessel = v; break; }
      const hits = [];
      for (const [re, act, word] of ACTIONS) { const m = low.match(re); if (m) hits.push([m.index, act, word]); }
      hits.sort((a, b) => a[0] - b[0]);
      let { hits: ings } = A.stepIngredients(id, s);
      if (/alla ingredienser|ingredienserna|övriga ingredienser|resterande ingredienser|resten av ingredienserna/.test(low)) ings = A.flat(id).map((f, i) => /:$/.test(f.t) ? -1 : i).filter(i => i >= 0);
      const temp = (s.match(/(\d{3})\s*°/) || [])[1];
      const mins = A.timersIn(s)[0];
      const uniq = []; hits.forEach(h => { if (!uniq.some(u => u[1] === h[1])) uniq.push(h); });
      uniq.slice(0, 2).forEach(([, act, word]) => out.push({ act, word, ings, text: s, temp, mins, vessel, cold: /kyl|kallna|natten/.test(low), rise: /jäsa/.test(low) }));
    });
    if (!out.length) out.push({ act: 'serve', word: 'Servera', ings: [], text, vessel });
    return out.filter((s, i) => i === 0 || s.act !== out[i - 1].act || s.text !== out[i - 1].text);
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
  const liquidOf = kind => { const k = K[kind]; return k && (k.liq ? k.liq[0] : null); };
  function blit(c, spr, x, y, sc = 1, rot = 0, a = 1, shadow = true) {
    if (!spr) return; const s = spr._size * sc; c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot);
    if (shadow) { c.shadowColor = 'rgba(15,8,4,.4)'; c.shadowBlur = s * .12; c.shadowOffsetX = s * .05; c.shadowOffsetY = s * .08; }
    c.drawImage(spr, -s / 2, -s / 2, s, s); c.restore();
  }
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const fr = x => x - Math.floor(x);

  /* ---------------- props ---------------- */
  function board(c, S) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = S * .04; c.shadowOffsetY = S * .02;
    rr(c, S * .08, S * .2, S * .84, S * .6, S * .04); const g = c.createLinearGradient(0, S * .2, 0, S * .8); g.addColorStop(0, '#d2a878'); g.addColorStop(1, '#b08253'); c.fillStyle = g; c.fill(); c.restore();
    c.save(); rr(c, S * .08, S * .2, S * .84, S * .6, S * .04); c.clip(); c.strokeStyle = 'rgba(110,70,35,.22)'; c.lineWidth = S * .003;
    for (let i = 0; i < 26; i++) { const y = S * (.21 + i * .023); c.beginPath(); c.moveTo(S * .08, y); for (let k = 1; k <= 12; k++) c.lineTo(S * (.08 + k * .07), y + Math.sin(k + i) * S * .003); c.stroke(); }
    c.restore(); c.beginPath(); c.arc(S * .86, S * .5, S * .025, 0, TAU); c.fillStyle = 'rgba(40,24,12,.45)'; c.fill();
  }
  function knife(c, S, x, y, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = S * .02; c.shadowOffsetX = S * .015; c.shadowOffsetY = S * .02;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(S * .34, -S * .005); c.quadraticCurveTo(S * .36, S * .04, S * .3, S * .075); c.lineTo(0, S * .075); c.closePath();
    const g = c.createLinearGradient(0, 0, 0, S * .075); g.addColorStop(0, '#f4f6f7'); g.addColorStop(.6, '#c5cacd'); g.addColorStop(1, '#8d9397'); c.fillStyle = g; c.fill();
    c.shadowColor = 'transparent'; rr(c, -S * .2, S * .012, S * .21, S * .05, S * .02); c.fillStyle = '#3a2a1f'; c.fill();
    c.fillStyle = '#c9b89c'; [-.15, -.09, -.03].forEach(p => { c.beginPath(); c.arc(S * p, S * .037, S * .007, 0, TAU); c.fill(); });
    c.restore();
  }
  function steamPuffs(c, S, t, x, y, n = 5, w = .2) {
    for (let i = 0; i < n; i++) { const p = fr(t * .5 + i / n); const px = x + Math.sin(i * 2 + t) * S * w * .3 + (i - n / 2) * S * w * .15, py = y - p * S * .3, r = S * (.03 + p * .07);
      const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(255,255,255,${.28 * Math.sin(p * Math.PI)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2); }
  }
  function vessel(c, S, type, glaze = 'white') {
    const r = mulberry(4); c.save(); c.scale(S, S);
    let a;
    if (type === 'skillet') a = V.skillet(c, { x: .47, y: .5, R: .33 }, r);
    else if (type === 'pot') a = V.pot(c, { x: .5, y: .5, R: .36, enamel: '#2b2b2e' }, r);
    else if (type === 'dish') a = V.ovendish(c, { x: .5, y: .5, w: .72, h: .54, glaze }, r);
    else if (type === 'colander') { a = V.bowl(c, { x: .5, y: .5, R: .36, glaze: 'white' }, r); c.fillStyle = '#b7bcc0'; c.beginPath(); c.arc(.5, .5, .36, 0, TAU); c.fill(); c.fillStyle = '#8d9397'; c.beginPath(); c.arc(.5, .5, .3, 0, TAU); c.fill(); c.fillStyle = 'rgba(30,30,30,.55)'; for (let i = 0; i < 70; i++) { const aa = r() * TAU, d = Math.sqrt(r()) * .27; c.beginPath(); c.arc(.5 + Math.cos(aa) * d, .5 + Math.sin(aa) * d, .006, 0, TAU); c.fill(); } a = { cx: .5, cy: .5, r: .28 }; }
    else a = V.bowl(c, { x: .5, y: .5, R: .37, glaze }, r);
    c.restore(); return a;
  }
  function liquid(c, S, a, col, t, style = 'still') {
    if (!col) return; c.save(); c.beginPath(); if (a.rect) rr(c, a.rect[0] * S, a.rect[1] * S, a.rect[2] * S, a.rect[3] * S, S * .02); else c.arc(a.cx * S, a.cy * S, a.r * S, 0, TAU); c.clip();
    const cx = (a.cx || .5) * S, cy = (a.cy || .5) * S, R = (a.r || .3) * S;
    const g = c.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R * 1.1); g.addColorStop(0, C.light(col, .15)); g.addColorStop(1, C.dark(col, .25)); c.fillStyle = g; c.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
    if (style === 'vortex') { c.strokeStyle = C.rgba(C.light(col, .35), .5); c.lineWidth = S * .008; for (let i = 0; i < 5; i++) { c.beginPath(); for (let k = 0; k < 60; k++) { const aa = k / 60 * TAU * 1.5 + t * 6 + i * 1.25, rr_ = R * (.95 - k / 60 * .9); c.lineTo(cx + Math.cos(aa) * rr_, cy + Math.sin(aa) * rr_); } c.stroke(); } }
    c.restore();
  }
  function bubbles(c, S, a, col, t, n = 22) {
    const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
    for (let i = 0; i < n; i++) { const p = fr(t * (.6 + (i % 5) * .15) + i * .37); const aa = i * 2.4, d = R * (.15 + ((i * 37) % 80) / 100); const x = cx + Math.cos(aa) * d, y = cy + Math.sin(aa) * d, r = S * (.006 + p * .02);
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = `rgba(255,250,235,${.65 * (1 - p)})`; c.lineWidth = S * .003; c.stroke(); c.fillStyle = `rgba(255,255,255,${.15 * (1 - p)})`; c.fill(); }
  }
  function oven(c, S, t, glow, dishImg, temp) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = S * .05; c.shadowOffsetY = S * .03;
    rr(c, S * .1, S * .1, S * .8, S * .8, S * .04); const g = c.createLinearGradient(0, S * .1, 0, S * .9); g.addColorStop(0, '#3b3d41'); g.addColorStop(1, '#232427'); c.fillStyle = g; c.fill(); c.restore();
    rr(c, S * .16, S * .14, S * .68, S * .1, S * .02); c.fillStyle = '#1a1b1d'; c.fill();
    [.24, .34, .66, .76].forEach((x, i) => { c.beginPath(); c.arc(S * x, S * .19, S * .03, 0, TAU); c.fillStyle = '#c9cdd0'; c.fill(); c.save(); c.translate(S * x, S * .19); c.rotate(i === 0 ? glow * 2.4 - 1.2 : i * .7); c.fillStyle = '#2a2b2e'; c.fillRect(-S * .004, -S * .026, S * .008, S * .02); c.restore(); });
    c.fillStyle = `rgba(255,${120 + glow * 60},60,${.35 + glow * .6})`; c.font = `500 ${S * .045}px "Spline Sans Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(temp ? Math.round(temp * glow) + '°' : '', S * .5, S * .19);
    rr(c, S * .18, S * .3, S * .64, S * .5, S * .03); c.fillStyle = '#0d0d0f'; c.fill();
    c.save(); rr(c, S * .2, S * .32, S * .6, S * .46, S * .025); c.clip();
    const w = c.createRadialGradient(S * .5, S * .55, S * .05, S * .5, S * .55, S * .45); w.addColorStop(0, `rgba(255,160,60,${.15 + glow * .5})`); w.addColorStop(1, `rgba(120,40,10,${.1 + glow * .3})`); c.fillStyle = w; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 2; i++) { c.strokeStyle = `rgba(255,${90 + i * 40},40,${(.4 + .5 * Math.sin(t * 3 + i)) * glow})`; c.lineWidth = S * .01; c.beginPath(); c.moveTo(S * .22, S * (.36 + i * .38)); for (let k = 0; k < 8; k++) c.lineTo(S * (.22 + k * .08), S * (.36 + i * .38) + (k % 2 ? S * .02 : 0)); c.stroke(); }
    if (dishImg) { const rise = 1 + glow * .06 + Math.sin(t * 2) * .01; const s = S * .38 * rise; c.globalAlpha = .95; c.drawImage(dishImg, S * .5 - s / 2, S * .57 - s / 2, s, s * .7); }
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(S * .2, S * .32); c.lineTo(S * .45, S * .32); c.lineTo(S * .3, S * .78); c.lineTo(S * .2, S * .78); c.fill();
    c.restore(); rr(c, S * .3, S * .83, S * .4, S * .03, S * .015); c.fillStyle = '#b9bdc0'; c.fill();
  }

  /* ---------------- scenes ---------------- */
  function kindsOf(id, seg) { const fl = A.flat(id); const ks = []; seg.ings.forEach(i => { const k = fl[i] && fl[i].k; if (k && !ks.includes(k)) ks.push(k); }); return ks; }
  function drawScene(c, S, t, seg, id, st) {
    const kinds = st.kinds, vis = kinds.filter(k => K[k] && (K[k].g || K[k].grp)), liq = kinds.map(liquidOf).filter(Boolean);
    const main = vis[0] || 'onion', P = 3.4, p = fr(t / P);
    const baseCol = liq.length ? liq.reduce((a, b) => C.mix(a, b, .5)) : (st.recipeBase || '#e2cfa3');
    switch (seg.act) {
      case 'chop': case 'peel': {
        board(c, S);
        const kinds2 = vis.length ? vis : ['onion']; const ki = Math.floor(t / P) % kinds2.length, kk = kinds2[ki];
        const cuts = Math.floor(p * 9), whole = wholeOf(kk, S * .34);
        if (seg.act === 'peel' && p < .45) { blit(c, whole, S * .5, S * .48, 1, t * 1.5); c.strokeStyle = C.light(K[kk].col, .2); c.lineWidth = S * .018; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 30; i++) { const a = i / 30 * TAU * 2 + t * 1.5, r = S * (.1 + i * .004); c.lineTo(S * .5 + Math.cos(a) * r, S * .48 + Math.sin(a) * r + i * S * .006); } c.stroke(); break; }
        const cx = S * (.66 - cuts * .025);
        c.save(); c.beginPath(); c.rect(cx, 0, S, S); c.clip(); blit(c, whole, S * .66, S * .5, 1); c.restore();
        for (let i = 0; i < cuts * 3; i++) { const r = mulberry(i * 13 + ki); blit(c, spriteOf(kk, S * .07, 1 + i % 5), S * (.24 + r() * .22), S * (.36 + r() * .3), 1, r() * TAU); }
        const chop = Math.abs(Math.sin(p * 9 * Math.PI)); knife(c, S, cx - S * .02, S * .28 - chop * S * .09, .25 - chop * .2);
        break;
      }
      case 'grate': {
        board(c, S); const kk = vis[0] || 'carrot';
        c.save(); rr(c, S * .42, S * .18, S * .2, S * .6, S * .02); const g = c.createLinearGradient(S * .42, 0, S * .62, 0); g.addColorStop(0, '#9aa0a4'); g.addColorStop(.5, '#e6e9eb'); g.addColorStop(1, '#8a9094'); c.fillStyle = g; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = S * .03; c.fill(); c.restore();
        c.fillStyle = 'rgba(40,40,45,.55)'; for (let y = 0; y < 12; y++) for (let x = 0; x < 4; x++) { c.beginPath(); c.ellipse(S * (.455 + x * .04), S * (.23 + y * .045), S * .008, S * .012, 0, 0, TAU); c.fill(); }
        const up = Math.sin(t * 7) * S * .1; blit(c, wholeOf(kk, S * .26), S * .52, S * .45 + up, 1, 1.3);
        const n = Math.floor(p * 26) + 6; for (let i = 0; i < n; i++) { const r = mulberry(i * 7); blit(c, spriteOf(kk, S * .06, 1 + i % 4), S * (.26 + r() * .5), S * (.74 + r() * .06), 1, r() * TAU); }
        break;
      }
      case 'fry': {
        const a = vessel(c, S, 'skillet');
        c.save(); c.beginPath(); c.arc(a.cx * S, a.cy * S, a.r * S, 0, TAU); c.clip();
        const oil = c.createRadialGradient(a.cx * S - S * .06, a.cy * S - S * .06, 0, a.cx * S, a.cy * S, a.r * S); oil.addColorStop(0, 'rgba(255,215,120,.22)'); oil.addColorStop(1, 'rgba(255,200,90,.05)'); c.fillStyle = oil; c.fillRect(0, 0, S, S);
        const brown = Math.min(1, p * 1.4);
        (vis.length ? vis : ['onion']).forEach((kk, ki) => { for (let i = 0; i < 9; i++) { const r = mulberry(i * 31 + ki * 7); const ang = r() * TAU + t * .4 * (ki % 2 ? 1 : -1), d = Math.sqrt(r()) * a.r * S * .8; const hop = Math.max(0, Math.sin(t * 9 + i * 2.1)) * S * .012; blit(c, spriteOf(kk, S * .085, 1 + i % 4), a.cx * S + Math.cos(ang) * d, a.cy * S + Math.sin(ang) * d - hop, 1 + hop / S * 3, r() * TAU + t * (r() - .5)); } });
        c.fillStyle = `rgba(120,60,15,${brown * .22})`; c.fillRect(0, 0, S, S);
        for (let i = 0; i < 26; i++) { const q = fr(t * 2.2 + i * .173); const r = mulberry(i * 5); c.fillStyle = `rgba(255,250,230,${(1 - q) * .8})`; c.beginPath(); c.arc(a.cx * S + (r() - .5) * a.r * S * 1.6, a.cy * S + (r() - .5) * a.r * S * 1.6 - q * S * .03, S * .004 * (1 + q), 0, TAU); c.fill(); }
        c.restore();
        const sa = t * 1.8; c.save(); c.translate(a.cx * S + Math.cos(sa) * S * .1, a.cy * S + Math.sin(sa) * S * .1); c.rotate(sa + 1.2); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = S * .02; c.shadowOffsetY = S * .015;
        rr(c, -S * .05, -S * .04, S * .1, S * .08, S * .015); c.fillStyle = '#2f2f33'; c.fill(); rr(c, -S * .012, S * .03, S * .024, S * .3, S * .012); c.fillStyle = '#8a5a34'; c.fill(); c.restore();
        steamPuffs(c, S, t, a.cx * S, a.cy * S - S * .05, 4, .3);
        break;
      }
      case 'boil': case 'add': {
        const type = seg.act === 'add' ? (seg.vessel || 'pot') : (seg.vessel === 'skillet' ? 'skillet' : 'pot');
        const a = vessel(c, S, type === 'dish' ? 'dish' : type === 'bowl' ? 'bowl' : type);
        const col = seg.act === 'boil' ? (liq.length ? baseCol : st.recipeBase || '#d8c9a6') : (liq.length ? baseCol : st.recipeBase);
        liquid(c, S, a, col, t);
        const R = (a.r || .28) * S, cx = (a.cx || .5) * S, cy = (a.cy || .5) * S;
        const items = (vis.length ? vis : []);
        items.forEach((kk, ki) => { for (let i = 0; i < 7; i++) { const r = mulberry(i * 17 + ki * 3); const ang = r() * TAU + t * (.25 + r() * .2); const d = Math.sqrt(r()) * R * .78;
          let x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d, sc = 1, al = 1;
          if (seg.act === 'add') { const drop = clamp((p * 1.6 - (ki * .18 + i * .03)) / .35, 0, 1); if (drop <= 0) continue; sc = 1 + (1 - drop) * 1.6; al = drop; }
          blit(c, spriteOf(kk, S * .075, 1 + i % 4), x, y + Math.sin(t * 2 + i) * S * .004, sc, r() * TAU + t * .3, al); } });
        if (seg.act === 'boil') { bubbles(c, S, { cx: cx / S, cy: cy / S, r: R / S }, col, t); steamPuffs(c, S, t, cx, cy - R * .4, 6, .35); }
        else { const q = fr(t / P * 2); c.strokeStyle = `rgba(255,255,255,${.4 * (1 - q)})`; c.lineWidth = S * .004; c.beginPath(); c.arc(cx, cy, R * q * .8, 0, TAU); c.stroke(); }
        break;
      }
      case 'blend': {
        const a = vessel(c, S, seg.vessel === 'pot' ? 'pot' : 'bowl');
        const k = Math.min(1, p * 1.5); const col = liq.length ? baseCol : (vis.length ? C.mix(K[vis[0]].col, st.recipeBase || '#e8dcc0', .3) : '#ddd');
        liquid(c, S, a, col, t, 'vortex');
        const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        vis.forEach((kk, ki) => { for (let i = 0; i < 8; i++) { const r = mulberry(i * 23 + ki); const ang = r() * TAU + t * 5; const d = R * (.8 - k * .7) * Math.sqrt(r()); blit(c, spriteOf(kk, S * .07, 1 + i % 3), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1 - k * .8, ang, 1 - k * .9, false); } });
        c.save(); c.translate(cx + Math.sin(t * 13) * S * .006, cy); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = S * .03; c.shadowOffsetX = S * .02; c.shadowOffsetY = S * .03;
        c.beginPath(); c.arc(0, 0, S * .075, 0, TAU); c.fillStyle = '#e9ebec'; c.fill(); c.shadowColor = 'transparent'; c.beginPath(); c.arc(0, 0, S * .05, 0, TAU); c.fillStyle = '#b4b9bc'; c.fill();
        c.rotate(t * 30); c.fillStyle = '#7d8286'; c.fillRect(-S * .045, -S * .006, S * .09, S * .012); c.fillRect(-S * .006, -S * .045, S * .012, S * .09); c.restore();
        break;
      }
      case 'mix': case 'whisk': {
        const a = vessel(c, S, seg.vessel === 'pot' ? 'pot' : seg.vessel === 'skillet' ? 'skillet' : 'bowl', 'celadon');
        const cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        if (liq.length) liquid(c, S, a, baseCol, t, seg.act === 'whisk' ? 'vortex' : 'still');
        (vis.length ? vis : []).forEach((kk, ki) => { for (let i = 0; i < 8; i++) { const r = mulberry(i * 11 + ki * 5); const ang = r() * TAU + t * (1.2 + ki * .15); const d = R * (.2 + r() * .62); blit(c, spriteOf(kk, S * .075, 1 + i % 4), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 1, ang * 2); } });
        const sa = t * (seg.act === 'whisk' ? 7 : 2.4); c.save(); c.translate(cx + Math.cos(sa) * R * .45, cy + Math.sin(sa) * R * .45); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = S * .02; c.shadowOffsetX = S * .02; c.shadowOffsetY = S * .03;
        if (seg.act === 'whisk') { c.strokeStyle = '#d7dbde'; c.lineWidth = S * .005; for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(0, 0, S * .05, S * .02 * Math.abs(i) + S * .004, 0, 0, TAU); c.stroke(); } c.rotate(sa); rr(c, -S * .01, S * .04, S * .02, S * .28, S * .01); c.fillStyle = '#9aa0a4'; c.fill(); }
        else { c.rotate(sa + .8); c.beginPath(); c.ellipse(0, 0, S * .035, S * .05, 0, 0, TAU); c.fillStyle = '#c69a66'; c.fill(); rr(c, -S * .01, S * .04, S * .02, S * .32, S * .01); c.fill(); }
        c.restore();
        break;
      }
      case 'drain': {
        const a = vessel(c, S, 'colander'), cx = a.cx * S, cy = a.cy * S, R = a.r * S;
        (vis.length ? vis : ['penne']).forEach((kk, ki) => { for (let i = 0; i < 10; i++) { const r = mulberry(i * 19 + ki); const ang = r() * TAU, d = Math.sqrt(r()) * R * .8; blit(c, spriteOf(kk, S * .075, 1 + i % 4), cx + Math.cos(ang) * d, cy + Math.sin(ang) * d + Math.sin(t * 5 + i) * S * .004, 1, r() * TAU); } });
        for (let i = 0; i < 40; i++) { const q = fr(t * 1.5 + i * .09), r = mulberry(i * 3); const ang = r() * TAU, d = R * (.9 + q * .5); c.fillStyle = `rgba(160,205,235,${.7 * (1 - q)})`; c.beginPath(); c.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, S * .006, 0, TAU); c.fill(); }
        c.strokeStyle = 'rgba(180,215,240,.55)'; c.lineWidth = S * .018; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * .2, cy - S * .42); c.quadraticCurveTo(cx - S * .1, cy - S * .3, cx - S * .05 + Math.sin(t * 8) * S * .01, cy - S * .05); c.stroke();
        break;
      }
      case 'shape': {
        board(c, S); const kk = vis[0] || 'mince'; const n = 6;
        for (let i = 0; i < n; i++) { const r = mulberry(i * 5); const done = clamp(p * 1.4 - i * .15, 0, 1); const x = S * (.22 + (i % 3) * .28), y = S * (.38 + Math.floor(i / 3) * .24);
          if (done < 1) for (let q = 0; q < 6; q++) blit(c, spriteOf(kk, S * .05, 1 + q % 3), x + Math.cos(q + r()) * S * .05 * (1 - done), y + Math.sin(q * 2 + r()) * S * .05 * (1 - done), 1, q);
          if (done > 0) { const g = c.createRadialGradient(x - S * .02, y - S * .02, S * .005, x, y, S * .07); const col = K[kk] ? K[kk].col : '#d9a560'; g.addColorStop(0, C.light(col, .3)); g.addColorStop(1, C.dark(col, .25)); c.save(); c.globalAlpha = done; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = S * .02; c.shadowOffsetY = S * .015; c.fillStyle = g; c.beginPath(); c.ellipse(x, y, S * .06 * (1 + (1 - done) * .3), S * .06 * done + S * .01, 0, 0, TAU); c.fill(); c.restore(); } }
        break;
      }
      case 'bake': case 'preheat': {
        const glow = seg.act === 'preheat' ? Math.min(1, p * 1.3) : .85 + Math.sin(t * 2) * .1;
        oven(c, S, t, glow, seg.act === 'bake' ? st.dishImg : null, seg.temp ? +seg.temp : (seg.act === 'preheat' ? 200 : 0));
        break;
      }
      case 'rest': {
        const a = vessel(c, S, seg.vessel === 'pot' ? 'pot' : 'bowl', 'blue');
        if (liq.length || st.recipeBase) liquid(c, S, a, baseCol, 0);
        vis.forEach((kk, ki) => { for (let i = 0; i < 6; i++) { const r = mulberry(i * 7 + ki); const ang = r() * TAU, d = Math.sqrt(r()) * a.r * S * .75; blit(c, spriteOf(kk, S * .07, 1 + i % 3), a.cx * S + Math.cos(ang) * d, a.cy * S + Math.sin(ang) * d, seg.rise ? 1 + Math.sin(t) * .06 + p * .2 : 1, r() * TAU); } });
        if (seg.cold) { for (let i = 0; i < 18; i++) { const q = fr(t * .25 + i / 18), r = mulberry(i); c.fillStyle = `rgba(220,238,255,${.8 * Math.sin(q * Math.PI)})`; c.font = `${S * (.03 + r() * .03)}px Georgia`; c.fillText('❄', S * r(), S * q); } }
        c.save(); c.translate(S * .82, S * .18); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = S * .02; c.beginPath(); c.arc(0, 0, S * .09, 0, TAU); c.fillStyle = '#f3efe6'; c.fill(); c.shadowColor = 'transparent'; c.strokeStyle = '#29241f'; c.lineWidth = S * .008; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 1.5 - 1.57) * S * .065, Math.sin(t * 1.5 - 1.57) * S * .065); c.moveTo(0, 0); c.lineTo(Math.cos(t * .12 - 1.57) * S * .045, Math.sin(t * .12 - 1.57) * S * .045); c.stroke(); c.restore();
        break;
      }
      case 'season': {
        const a = vessel(c, S, seg.vessel === 'skillet' ? 'skillet' : 'pot'); liquid(c, S, a, st.recipeBase || baseCol, t);
        [[.36, 'salt'], [.62, 'pepper']].forEach(([x, w], i) => { const sh = Math.sin(t * 10 + i * 2) * S * .02; c.save(); c.translate(S * x + sh, S * .3); c.rotate(.3 + sh / S * 4); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = S * .03; c.shadowOffsetY = S * .02;
          if (w === 'salt') { rr(c, -S * .035, -S * .06, S * .07, S * .12, S * .02); c.fillStyle = 'rgba(235,240,245,.9)'; c.fill(); c.fillStyle = '#c9ced1'; c.fillRect(-S * .035, -S * .07, S * .07, S * .025); }
          else { rr(c, -S * .03, -S * .08, S * .06, S * .16, S * .025); c.fillStyle = '#6a4a33'; c.fill(); c.beginPath(); c.arc(0, -S * .085, S * .02, 0, TAU); c.fillStyle = '#3a2a1f'; c.fill(); }
          c.restore();
          for (let q = 0; q < 16; q++) { const f = fr(t * 1.8 + q / 16), r = mulberry(q + i * 30); c.fillStyle = w === 'salt' ? `rgba(255,255,255,${1 - f})` : `rgba(30,22,18,${1 - f})`; c.beginPath(); c.arc(S * x + (r() - .5) * S * .08, S * .36 + f * S * .25, S * .005, 0, TAU); c.fill(); } });
        break;
      }
      default: { // serve: the dish comes together on the plate
        if (st.dishImg) { const q = Math.min(1, p * 1.5); const s = S * .82; c.save(); c.globalAlpha = q; c.translate(S / 2, S / 2); c.scale(.9 + q * .1, .9 + q * .1); c.drawImage(st.dishImg, -s / 2, -s / 2, s, s); c.restore(); }
        vis.forEach((kk, ki) => { for (let i = 0; i < 5; i++) { const r = mulberry(i * 9 + ki); const drop = clamp(p * 1.8 - ki * .2 - i * .06, 0, 1); if (drop <= 0 || drop >= 1) continue; blit(c, spriteOf(kk, S * .07, 1 + i % 3), S * (.3 + r() * .4), S * (.3 + r() * .4), 1 + (1 - drop) * 2, r() * TAU, drop); } });
      }
    }
  }

  /* ---------------- player ---------------- */
  let cur = null;
  function play(cv, capEl, id, text) {
    stop();
    const segs = segments(id, text); if (!segs.length) return;
    const sc = A.scene(id); const base = sc.vessels.find(v => v.base); let dishImg = null; const b = A.THUMB_IMG[id]; if (b) dishImg = b;
    const st = { recipeBase: base ? base.base.col : null, dishImg, kinds: [] };
    cur = { raf: 0, t0: performance.now(), segs, cv, capEl, id, st, last: -1 };
    const fl = A.flat(id);
    const loop = now => {
      if (!cur || !cv.isConnected) return;
      const r = cv.getBoundingClientRect(), D = Math.min(2, window.devicePixelRatio || 1), S = Math.round(r.width * D);
      if (cv.width !== S) { cv.width = cv.height = S; SPR.clear(); }
      const t = (now - cur.t0) / 1000, P = 3.4, si = Math.floor(t / P) % segs.length, seg = segs[si];
      if (si !== cur.last) { cur.last = si; st.kinds = kindsOf(id, seg); const names = seg.ings.map(i => fl[i] && A.shortName(fl[i].t)).filter(Boolean).slice(0, 4); capEl.innerHTML = `<b>${seg.word}</b>${names.length ? ' · ' + A.esc(names.join(', ')) : ''}${segs.length > 1 ? `<span>${si + 1}/${segs.length}</span>` : ''}`; }
      const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S, S);
      try { drawScene(c, S, t % P + (A.REDUCED ? 1.7 : 0), seg, id, st); } catch (e) { console.warn('process', e); }
      if (!A.REDUCED) cur.raf = requestAnimationFrame(loop);
    };
    cur.raf = requestAnimationFrame(loop);
  }
  function stop() { if (cur) cancelAnimationFrame(cur.raf); cur = null; }
  function renderFrame(cv, id, text, si, t) { const segs = segments(id, text), seg = segs[si % segs.length]; const sc = A.scene(id); const base = sc.vessels.find(v => v.base); const st = { recipeBase: base ? base.base.col : null, dishImg: A.THUMB_IMG[id], kinds: kindsOf(id, seg) }; const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); drawScene(c, cv.width, t, seg, id, st); return segs.map(s => s.act + ':' + s.word); }
  return { play, stop, segments, renderFrame };
}
